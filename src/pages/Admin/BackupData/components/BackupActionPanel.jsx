import { useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiArchive,
  FiCheckCircle,
  FiDownload,
  FiLoader,
  FiUploadCloud,
} from "react-icons/fi";
import { backupChecklist } from "../utils/backupData";

export default function BackupActionPanel({ theme, onCreateBackup, isCreating, onRestoreUpload }) {
  const fileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreUpload(file);
      e.target.value = "";
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
              <FiArchive />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Create Backup</h2>
              <p className={`mt-1 max-w-2xl text-sm leading-6 ${theme.muted}`}>
                Create a protected backup file for database records, uploaded images, and system settings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateBackup}
            disabled={isCreating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <FiLoader className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FiDownload />
                Backup Now
              </>
            )}
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {backupChecklist.map((item) => (
            <div key={item} className={`flex items-start gap-3 rounded-2xl border p-4 ${theme.softCard}`}>
              <FiCheckCircle className="mt-0.5 shrink-0 text-xl text-emerald-500" />
              <p className="text-sm leading-6">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl text-amber-500">
            <FiUploadCloud />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Restore Backup</h2>
            <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
              Use only when data is lost or you need to move the system to another server.
            </p>
          </div>
        </div>

        <div
          className={`mt-6 cursor-pointer rounded-2xl border border-dashed p-5 transition hover:opacity-80 ${theme.softCard}`}
          onClick={() => fileRef.current?.click()}
        >
          <p className="font-bold">Upload backup file</p>
          <p className={`mt-2 text-sm ${theme.muted}`}>Supported: .zip backup from this system.</p>
          <button
            type="button"
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiUploadCloud />
            Choose File
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500">
          <FiAlertTriangle className="mt-0.5 shrink-0 text-xl" />
          <p className="text-sm leading-6">
            Restore will overwrite all current data. A confirmation dialog will appear before running.
          </p>
        </div>
      </div>
    </div>
  );
}
