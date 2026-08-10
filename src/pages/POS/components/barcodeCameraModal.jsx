import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanLine } from "./posIcons";

const SCANNER_ELEMENT_ID = "pos-barcode-camera-scanner";
// After a successful scan, ignore further hits for this long — the same code often stays in
// frame for several camera frames in a row, which would otherwise re-trigger add-to-cart
// repeatedly for one physical scan.
const SCAN_COOLDOWN_MS = 1500;

// A time-based cooldown alone isn't enough: if the cashier holds the same item in front of
// the camera continuously (reading instructions, repositioning, etc.), the cooldown quietly
// expires and the exact same barcode re-triggers and adds another unit — over and over,
// with no re-scan action from the cashier. Require the camera to report "nothing decoded"
// for this many consecutive frames (i.e. the item actually left view) before the same code
// is allowed to trigger again.
const NO_DETECT_FRAMES_TO_RESET = 5;

// A low-quality/compressed WiFi phone-webcam feed can produce several DIFFERENT wrong
// reads in a row (each individually checksum-valid), not just one-off noise — so requiring
// two *consecutive* identical reads still fails constantly. Instead, keep a short rolling
// history of recent decodes and accept a code once it recurs within that window — the real
// barcode keeps reappearing as the phone holds steady, even if wrong reads interrupt it.
const READ_HISTORY_SIZE = 8;
const READ_CONFIRM_COUNT = 2;

// Product barcodes are 1D (EAN/UPC), not QR — must be listed explicitly or the decoder
// only reliably picks up QR codes. Also a wide, short box (not a square) since 1D
// barcodes are much wider than they are tall.
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

// html5-qrcode's stop() throws synchronously (not a rejected promise) when the scanner
// isn't in a "scanning" state — which can happen even after a successful start() if the
// scan loop errors out internally. Always route through this so a stale/dead scanner
// can never crash the component.
function safeStopScanner(scanner) {
  try {
    return Promise.resolve(scanner.stop()).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

// clear() throws synchronously too (opposite condition: while still "scanning") — same
// defensive wrapping applies.
function safeClearScanner(scanner) {
  try {
    scanner.clear();
  } catch {
    // ignore
  }
}

export default function BarcodeCameraModal({ onScan, onClose }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const startedCameraIdRef = useRef(null);
  const lastScanRef = useRef({ code: "", at: 0 });
  const readHistoryRef = useRef([]);
  const noDetectStreakRef = useRef(0);

  // The scan effect below only (re)starts when the camera changes, so its decode callback
  // is captured once and never rebuilt — without this ref it would keep calling whatever
  // `onScan` (and everything it closes over: cart, products, applied pricing) looked like
  // at that moment, silently going stale for the rest of the modal's session.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (cancelled) return;
        if (!devices?.length) {
          setError("រកមិនឃើញកាមេរ៉ាទេ។ សូមប្រាកដថាបានអនុញ្ញាត camera permission ។");
          return;
        }
        setCameras(devices);
        setSelectedCameraId(devices[0].id);
      })
      .catch(() => {
        if (!cancelled) setError("មិនអាចចូលប្រើកាមេរ៉ាបានទេ។ សូមពិនិត្យ permission របស់ browser ។");
      });

    scannerRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner && startedCameraIdRef.current) {
        safeStopScanner(scanner).finally(() => safeClearScanner(scanner));
      }
    };
  }, []);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || !selectedCameraId) return;

    let stoppedPreviousBeforeStart = Promise.resolve();
    if (startedCameraIdRef.current) {
      stoppedPreviousBeforeStart = safeStopScanner(scanner);
    }

    stoppedPreviousBeforeStart.then(() => {
      scanner
        .start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: { width: 280, height: 140 },
            // Request a higher resolution than the camera's default — phone-as-webcam apps
            // (DroidCam/Iriun) often default to a low stream resolution that blurs out the
            // thin bars of a 1D barcode once compressed over WiFi. Only "ideal", no "min":
            // a hard minimum can make a WiFi virtual-camera stream fail/freeze entirely if
            // bandwidth dips, instead of just falling back to a lower resolution.
            videoConstraints: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          (decodedText) => {
            // Something is in view right now — the item hasn't left frame, so don't let the
            // no-detect streak below build up (that streak is specifically for "camera sees
            // nothing at all", which this frame contradicts).
            noDetectStreakRef.current = 0;

            const now = Date.now();
            if (decodedText === lastScanRef.current.code && now - lastScanRef.current.at < SCAN_COOLDOWN_MS) {
              return;
            }

            const history = readHistoryRef.current;
            history.push(decodedText);
            if (history.length > READ_HISTORY_SIZE) history.shift();

            const occurrences = history.filter((code) => code === decodedText).length;
            if (occurrences < READ_CONFIRM_COUNT) return;

            readHistoryRef.current = [];
            lastScanRef.current = { code: decodedText, at: now };
            onScanRef.current(decodedText);
          },
          () => {
            // Fires every frame nothing decodes. Once this happens enough times in a row,
            // the item has genuinely left the camera's view — clear the cooldown/history so
            // the SAME barcode can trigger again on the next real presentation, instead of
            // silently re-adding on its own every ~1.5s while held steady in frame.
            noDetectStreakRef.current += 1;
            if (noDetectStreakRef.current >= NO_DETECT_FRAMES_TO_RESET) {
              noDetectStreakRef.current = 0;
              lastScanRef.current = { code: "", at: 0 };
              readHistoryRef.current = [];
            }
          }
        )
        .then(() => {
          startedCameraIdRef.current = selectedCameraId;
        })
        .catch(() => {
          setError("មិនអាចបើកកាមេរ៉ានេះបានទេ។ សូមសាកល្បងកាមេរ៉ាផ្សេង។");
        });
    });
  }, [selectedCameraId]);

  function handleClose() {
    const scanner = scannerRef.current;
    if (scanner && startedCameraIdRef.current) {
      safeStopScanner(scanner).finally(() => {
        safeClearScanner(scanner);
        onClose();
      });
    } else {
      onClose();
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* Keep the scanner visible without covering or disabling the POS/cart. On a phone-sized
          viewport it becomes a bottom sheet; on the desktop POS it floats over the product
          browser on the left, leaving the cart on the right fully visible and interactive. */}
      <div className="pointer-events-auto absolute bottom-4 left-4 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm">
              <ScanLine className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">ស្កេនកាមេរ៉ា</p>
              <p className="text-[10px] text-slate-400">ស្កេនបានច្រើនដងជាប់ៗគ្នា</p>
            </div>
          </div>
          <button type="button" onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="mb-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-red-300"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>{cam.label || cam.id}</option>
              ))}
            </select>
          )}

          {error && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-xl bg-slate-900" />
        </div>
      </div>
    </div>
  );
}
