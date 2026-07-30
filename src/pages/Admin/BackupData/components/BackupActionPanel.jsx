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
      <div className={`rounded-2xl border p-4 shadow-sm sm:p-6 ${theme.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="summary-icon-3d flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
              <FiArchive />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">បង្កើតទិន្នន័យបម្រុងទុក</h2>
              <p className={`mt-1 max-w-2xl text-sm leading-6 ${theme.muted}`}>
                បង្កើតឯកសារទិន្នន័យបម្រុងទុកដើម្បីការពារទិន្នន័យ database រូបភាព និងការកំណត់ប្រព័ន្ធ។
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateBackup}
            disabled={isCreating}
            className="quick-action-icon-3d inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? (
              <>
                <FiLoader className="animate-spin" />
                កំពុងបង្កើត...
              </>
            ) : (
              <>
                <FiDownload />
                បង្កើតឥឡូវ
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

      <div className={`rounded-2xl border p-4 shadow-sm sm:p-6 ${theme.card}`}>
        <div className="flex items-start gap-4">
          <div className="summary-icon-3d flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl text-amber-500">
            <FiUploadCloud />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">ស្ដារទិន្នន័យ</h2>
            <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
              ប្រើតែពេលទិន្នន័យបាត់ ឬចង់ផ្លាស់ប្ដូរ server ថ្មីប៉ុណ្ណោះ។
            </p>
          </div>
        </div>

        <div
          className={`mt-6 cursor-pointer rounded-2xl border border-dashed p-5 transition hover:opacity-80 ${theme.softCard}`}
          onClick={() => fileRef.current?.click()}
        >
          <p className="font-bold">ជ្រើសរើសឯកសារបម្រុងទុក</p>
          <p className={`mt-2 text-sm ${theme.muted}`}>គាំទ្រតែ .zip ពីប្រព័ន្ធនេះប៉ុណ្ណោះ។</p>
          <button
            type="button"
            className="quick-action-icon-3d mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          >
            <FiUploadCloud />
            ជ្រើសរើសឯកសារ
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
            ការស្ដារទិន្នន័យនឹងជំនួសទិន្នន័យទាំងអស់បច្ចុប្បន្ន។ ប្រអប់បញ្ជាក់នឹងបង្ហាញមុននឹងដំណើរការ។
          </p>
        </div>
      </div>
    </div>
  );
}
