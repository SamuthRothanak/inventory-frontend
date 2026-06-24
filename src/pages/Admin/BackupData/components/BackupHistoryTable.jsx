import { FiDownload, FiRefreshCcw, FiRefreshCw, FiTrash2 } from "react-icons/fi";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));
}

function StatusBadge({ status }) {
  const styles = {
    completed:   "bg-emerald-500/10 text-emerald-500",
    in_progress: "bg-amber-500/10 text-amber-500",
    failed:      "bg-red-500/10 text-red-500",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[status] ?? styles.failed}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

export default function BackupHistoryTable({ theme, rows = [], isLoading, onDownload, onDelete, onRestore }) {
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h2 className="text-xl font-extrabold">Backup History</h2>
          <p className={`mt-1 text-sm ${theme.muted}`}>Showing {rows.length} backup files</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead>
            <tr className="bg-red-600 text-sm font-bold text-white">
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Created By</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className={`border-t ${theme.divider}`}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className={`h-4 w-full animate-pulse rounded-lg ${theme.softCard}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className={`border-t transition ${theme.divider} hover:bg-zinc-50/5`}>
                  <td className="px-6 py-5">
                    <p className="font-bold text-sm">{row.file_name}</p>
                  </td>
                  <td className="px-6 py-5 font-semibold text-sm">{formatBytes(row.file_size)}</td>
                  <td className="px-6 py-5 text-sm">{row.created_by?.name ?? "System"}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-5 text-sm whitespace-nowrap">{formatDate(row.created_at)}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        title="Download"
                        onClick={() => onDownload(row)}
                        disabled={row.status !== "completed"}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FiDownload />
                      </button>
                      <button
                        type="button"
                        title="Restore from this backup"
                        onClick={() => onRestore(row)}
                        disabled={row.status !== "completed"}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FiRefreshCcw />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => onDelete(row)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={`px-6 py-16 text-center ${theme.muted}`}>
                  No backup files found. Create your first backup above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
