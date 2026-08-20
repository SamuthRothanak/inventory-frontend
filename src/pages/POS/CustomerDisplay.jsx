import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ShoppingCart, Clock, CheckCircle } from "./components/posIcons";
import { usd } from "./components/posData";

// Standalone page meant to live in its own popup window on a second monitor —
// receives its state from the main POS tab via BroadcastChannel (same origin,
// same browser, no server round-trip needed). Requests current state on mount
// since a channel has no history: a window that opens after the last "state"
// message was sent would otherwise see nothing until the next change.
const CHANNEL_NAME = "bakong-customer-display";

export default function CustomerDisplay() {
  const [state, setState] = useState(null);
  const canvasRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === "state") {
        setState(event.data.payload);
      }
    };

    channel.postMessage({ type: "request-state" });

    document.documentElement.requestFullscreen?.().catch(() => {});

    return () => channel.close();
  }, []);

  useEffect(() => {
    if (!state?.qr || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, state.qr, { width: 420, margin: 1 }).catch(() => {});
  }, [state?.qr]);

  // Show the success confirmation briefly, then close itself — this window has no
  // controls of its own (it's meant to face the customer, not be operated by them).
  useEffect(() => {
    if (state?.status !== "paid") return undefined;
    const timer = window.setTimeout(() => window.close(), 4000);
    return () => window.clearTimeout(timer);
  }, [state?.status]);

  if (!state) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
      </div>
    );
  }

  const { cartItems = [], subtotal = 0, discountAmount = 0, deliveryFeeUsd = 0, total = 0, status } = state;

  return (
    <div className="grid h-screen w-screen grid-cols-1 bg-white lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col overflow-hidden border-b border-slate-100 bg-slate-50 p-8 lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">វិក្កយបត្ររបស់អ្នក</p>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{item.productName}</p>
                <p className="mt-0.5 text-sm text-slate-500">{item.variantName} · {item.qty} {item.unitName} × {usd(item.unitPrice)}</p>
              </div>
              <span className="ml-3 shrink-0 text-base font-bold text-slate-900">{usd(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>តម្លៃមុនបញ្ចុះ</span><span>{usd(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>បញ្ចុះ</span><span>−{usd(discountAmount)}</span>
            </div>
          )}
          {deliveryFeeUsd > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>ដឹកជញ្ជូន</span><span>+{usd(deliveryFeeUsd)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-lg font-extrabold text-slate-900">
            <span>សរុបទាំងអស់</span>
            <span>{usd(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-5 p-8">
        {status === "paid" ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-16 w-16 text-emerald-500" />
            <p className="text-2xl font-extrabold text-emerald-600">បានទូទាត់ជោគជ័យ!</p>
          </div>
        ) : (
          <>
            <p className="text-xl font-bold text-slate-900">សូមស្កេន QR ដើម្បីទូទាត់</p>
            <canvas ref={canvasRef} className="rounded-2xl border border-slate-200" />
            <p className="text-4xl font-extrabold text-slate-900">{usd(total)}</p>
            {status === "waiting" && (
              <div className="flex items-center gap-2 text-base font-semibold text-amber-600">
                <Clock className="h-5 w-5 animate-pulse" />
                កំពុងរង់ចាំការទូទាត់...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
