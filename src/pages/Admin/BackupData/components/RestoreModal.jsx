import { useRef, useState } from "react";
import { FiAlertTriangle, FiUploadCloud, FiX } from "react-icons/fi";

export default function RestoreModal({ theme, onClose, onConfirmUpload, onConfirmFromId, isLoading, existingBackup, preSelectedFile }) {
  const fileRef = useRef(null);
  const [file, setFile]           = useState(preSelectedFile ?? null);
  const [confirmed, setConfirmed] = useState(false);

  const isFromExisting = Boolean(existingBackup);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  function handleSubmit() {
    if (!confirmed) return;
    if (isFromExisting) {
      onConfirmFromId(existingBackup.id);
    } else {
      if (!file) return;
      onConfirmUpload(file);
    }
  }

  const canSubmit = confirmed && (isFromExisting || file);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${theme.card}`}>
        <div className={`flex items-center justify-between border-b p-4 sm:p-6 ${theme.divider}`}>
          <h2 className="text-xl font-extrabold">ស្ដារទិន្នន័យ</h2>
          <button
            type="button"
            onClick={onClose}
            className={`table-icon-3d flex h-9 w-9 items-center justify-center rounded-xl transition hover:-translate-y-0.5 hover:opacity-80 ${theme.softCard}`}
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-xl" />
            <p className="text-sm leading-6 font-semibold">
              ការព្រមាន: ការស្ដារទិន្នន័យនឹងជំនួសទិន្នន័យបច្ចុប្បន្នទាំងអស់ រួមមាន ផលិតផល ការលក់ ការទិញ និងអ្នកប្រើប្រាស់។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។
            </p>
          </div>

          {isFromExisting ? (
            <div className={`rounded-2xl border p-5 ${theme.softCard}`}>
              <p className="font-bold text-sm">ស្ដារពីបម្រុងទុកដែលមានស្រាប់:</p>
              <p className="mt-2 font-mono text-sm text-blue-500">{existingBackup.file_name}</p>
              <p className={`mt-1 text-sm ${theme.muted}`}>
                ទំហំ: {(existingBackup.file_size / 1024 / 1024).toFixed(1)} MB
              </p>
              {existingBackup.file_size > 100 * 1024 * 1024 && (
                <p className="mt-2 text-xs font-semibold text-amber-500">
                  ⚠️ ឯកសារធំ — ការស្ដារអាចចំណាយពេលច្រើនវិនាទី។
                </p>
              )}
            </div>
          ) : (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition hover:opacity-80 ${theme.softCard}`}
              onClick={() => fileRef.current?.click()}
            >
              <span className="summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <FiUploadCloud className="text-3xl" />
              </span>
              {file ? (
                <div className="text-center">
                  <p className="font-bold text-emerald-500">{file.name}</p>
                  <p className={`text-xs ${theme.muted}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {file.size > 100 * 1024 * 1024 && (
                    <p className="mt-1 text-xs font-semibold text-amber-500">
                      ⚠️ ឯកសារធំ — ការផ្ទុកឡើង និងការស្ដារអាចចំណាយពេលយូរ។
                    </p>
                  )}
                </div>
              ) : (
                <p className={`text-sm ${theme.muted}`}>ចុចដើម្បីជ្រើសរើសឯកសារ .zip (អតិបរមា 1 GB)</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span className={`text-sm leading-6 ${theme.muted}`}>
              ខ្ញុំយល់ថាការស្ដារទិន្នន័យនឹងជំនួសទិន្នន័យបច្ចុប្បន្នទាំងអស់ជាអចិន្ត្រៃយ៍ ហើយសកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។
            </span>
          </label>
        </div>

        <div className={`flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6 [&>button]:w-full sm:[&>button]:w-auto ${theme.divider}`}>
          <button
            type="button"
            onClick={onClose}
            className={`table-icon-3d h-11 rounded-xl border px-5 font-semibold transition hover:-translate-y-0.5 hover:opacity-80 ${theme.softCard}`}
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="quick-action-icon-3d h-11 rounded-xl bg-red-600 px-5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "កំពុងស្ដារ..." : "ស្ដារឥឡូវ"}
          </button>
        </div>
      </div>
    </div>
  );
}
