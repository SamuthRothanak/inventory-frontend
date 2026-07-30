import {
  FiDatabase,
  FiDownload,
  FiRefreshCcw,
  FiTrash2,
} from "react-icons/fi";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));
}

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-emerald-500/10 text-emerald-500",
    in_progress: "bg-amber-500/10 text-amber-500",
    failed: "bg-red-500/10 text-red-500",
  };

  const labels = {
    completed: "ជោគជ័យ",
    in_progress: "កំពុងដំណើរការ",
    failed: "បរាជ័យ",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] ?? styles.failed}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default function BackupHistoryTable({
  theme,
  rows = [],
  isLoading,
  onDownload,
  onDelete,
  onRestore,
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-extrabold sm:text-xl">ប្រវត្តិបម្រុងទុក</h2>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            បង្ហាញ {rows.length} ឯកសារបម្រុងទុក
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="responsive-card-table min-w-[900px] w-full text-left">
          <thead>
            <tr className="bg-red-600 text-sm font-bold text-white">
              <th className="px-6 py-4">ឈ្មោះឯកសារ</th>
              <th className="px-6 py-4">ទំហំ</th>
              <th className="px-6 py-4">បង្កើតដោយ</th>
              <th className="px-6 py-4">ស្ថានភាព</th>
              <th className="px-6 py-4">កាលបរិច្ឆេទ</th>
              <th className="px-6 py-4 text-center">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <Backup3DLoading
                theme={theme}
                colSpan={6}
              />
            ) : rows.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t transition ${theme.divider} hover:bg-zinc-50/5`}
                >
                  <td data-label="ឯកសារ" className="px-6 py-5">
                    <p className="font-bold text-sm">{row.file_name}</p>
                  </td>
                  <td data-label="ទំហំ" className="px-6 py-5 font-semibold text-sm">
                    {formatBytes(row.file_size)}
                  </td>
                  <td data-label="បង្កើតដោយ" className="px-6 py-5 text-sm">
                    {row.created_by?.name ?? "ប្រព័ន្ធ"}
                  </td>
                  <td data-label="ស្ថានភាព" className="px-6 py-5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td data-label="កាលបរិច្ឆេទ" className="px-6 py-5 text-sm whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td data-label="សកម្មភាព" className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <Tooltip label={"ទាញយក"}>
                        <button
                          type="button"
                          // title="ទាញយក"
                          onClick={() => onDownload(row)}
                          disabled={row.status !== "completed"}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiDownload />
                        </button>
                      </Tooltip>
                      <Tooltip label={"ស្ដារពីទិន្នន័យបម្រុងទុកនេះ"}>
                        <button
                          type="button"
                          title="ស្ដារពីទិន្នន័យបម្រុងទុកនេះ"
                          onClick={() => onRestore(row)}
                          disabled={row.status !== "completed"}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/25 focus:outline-none focus:ring-4 focus:ring-purple-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiRefreshCcw />
                        </button>
                      </Tooltip>
                      <Tooltip label={"លុប"}>
                        <button
                          type="button"
                          title="លុប"
                          onClick={() => onDelete(row)}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0"
                        >
                          <FiTrash2 />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className={`px-6 py-16 text-center ${theme.muted}`}
                >
                  រកមិនឃើញឯកសារបម្រុងទុក។ សូមបង្កើតបម្រុងទុកដំបូងខាងលើ។
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Backup3DLoading({ theme, colSpan }) {
  return (
    <tr className={`border-t ${theme.row}`}>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div
          className="flex min-h-[230px] flex-col items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="relative flex h-32 w-32 items-center justify-center"
            style={{ perspective: "700px" }}
          >
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-violet-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-violet-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-fuchsia-300 border-r-violet-500 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-fuchsia-300 via-violet-500 to-indigo-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(76, 29, 149, 0.3), inset 4px 4px 10px rgba(255,255,255,0.35), inset -5px -7px 12px rgba(49,46,129,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiDatabase className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[11px] font-black text-emerald-950 shadow-lg shadow-emerald-400/40">
                ✓
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.title}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំទិន្នន័យបម្រុងទុក
          </p>
        </div>
      </td>
    </tr>
  );
}

function Tooltip({ label, children }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
      </span>
    </div>
  );
}
