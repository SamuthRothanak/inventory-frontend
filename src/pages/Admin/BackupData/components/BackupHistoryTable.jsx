import {
  FiDownload,
  FiRefreshCcw,
  FiRefreshCw,
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h2 className="text-xl font-extrabold">ប្រវត្តិបម្រុងទុក</h2>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            បង្ហាញ {rows.length} ឯកសារបម្រុងទុក
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
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
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className={`border-t ${theme.divider}`}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-6 py-5">
                      <div
                        className={`h-4 w-full animate-pulse rounded-lg ${theme.softCard}`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t transition ${theme.divider} hover:bg-zinc-50/5`}
                >
                  <td className="px-6 py-5">
                    <p className="font-bold text-sm">{row.file_name}</p>
                  </td>
                  <td className="px-6 py-5 font-semibold text-sm">
                    {formatBytes(row.file_size)}
                  </td>
                  <td className="px-6 py-5 text-sm">
                    {row.created_by?.name ?? "ប្រព័ន្ធ"}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-5 text-sm whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <Tooltip label={"ទាញយក"}>
                        <button
                          type="button"
                          // title="ទាញយក"
                          onClick={() => onDownload(row)}
                          disabled={row.status !== "completed"}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-md shadow-purple-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-purple-600 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-600/25 focus:outline-none focus:ring-4 focus:ring-purple-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiRefreshCcw />
                        </button>
                      </Tooltip>
                      <Tooltip label={"លុប"}>
                        <button
                          type="button"
                          title="លុប"
                          onClick={() => onDelete(row)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0"
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
