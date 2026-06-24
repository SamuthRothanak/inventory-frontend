import { useRef, useState } from "react";
import { FiAlertTriangle, FiUploadCloud, FiX } from "react-icons/fi";

export default function RestoreModal({ theme, onClose, onConfirmUpload, onConfirmFromId, isLoading, existingBackup }) {
  const fileRef = useRef(null);
  const [file, setFile]           = useState(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${theme.card}`}>
        <div className={`flex items-center justify-between border-b p-6 ${theme.divider}`}>
          <h2 className="text-xl font-extrabold">Restore Backup</h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-80 ${theme.softCard}`}
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-xl" />
            <p className="text-sm leading-6 font-semibold">
              Warning: Restoring will overwrite all current data including products, sales, purchases, and users. This cannot be undone.
            </p>
          </div>

          {isFromExisting ? (
            <div className={`rounded-2xl border p-5 ${theme.softCard}`}>
              <p className="font-bold text-sm">Restore from existing backup:</p>
              <p className="mt-2 font-mono text-sm text-blue-500">{existingBackup.file_name}</p>
            </div>
          ) : (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition hover:opacity-80 ${theme.softCard}`}
              onClick={() => fileRef.current?.click()}
            >
              <FiUploadCloud className="text-4xl text-zinc-400" />
              {file ? (
                <div className="text-center">
                  <p className="font-bold text-emerald-500">{file.name}</p>
                  <p className={`text-xs ${theme.muted}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <p className={`text-sm ${theme.muted}`}>Click to choose .zip backup file</p>
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
              I understand that restoring will permanently overwrite all current data and this action cannot be undone.
            </span>
          </label>
        </div>

        <div className={`flex justify-end gap-3 border-t p-6 ${theme.divider}`}>
          <button
            type="button"
            onClick={onClose}
            className={`h-11 rounded-xl border px-5 font-semibold transition hover:opacity-80 ${theme.softCard}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="h-11 rounded-xl bg-red-600 px-5 font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Restoring..." : "Restore Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
