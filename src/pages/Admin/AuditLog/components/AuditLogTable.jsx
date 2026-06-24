import React from "react";
import { FiEye, FiRefreshCw } from "react-icons/fi";
import { actionTone, formatDateTime, formatJsonPreview, moduleLabel } from "../utils/auditLogFormat";

function badgeClass(tone, isDark) {
  const tones = {
    emerald: isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700",
    blue: isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700",
    red: isDark ? "bg-red-500/15 text-red-300" : "bg-red-50 text-red-700",
    purple: isDark ? "bg-purple-500/15 text-purple-300" : "bg-purple-50 text-purple-700",
    amber: isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-700",
  };

  return tones[tone] || tones.amber;
}

export default function AuditLogTable({ rows = [], isDark = false, onView, isLoading = false, isError = false, onRefresh }) {
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const border = isDark ? "border-white/10" : "border-zinc-200";

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${border} ${isDark ? "bg-[#18181b]" : "bg-white"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-xl font-extrabold">Activity Log List</h2>
          <p className={`mt-1 text-sm ${muted}`}>Showing {rows.length} activity records</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={`flex h-9 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${isDark ? "border-white/10 hover:bg-white/10" : "border-zinc-200 hover:bg-zinc-50"}`}
        >
          <FiRefreshCw className={isLoading ? "animate-spin" : ""} size={14} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full text-left">
          <thead>
            <tr className="bg-red-600 text-sm font-bold text-white">
              <th className="px-6 py-4">Time / User</th>
              <th className="px-6 py-4">Module / Action</th>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Changes</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={`border-t ${border}`}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className={`h-4 w-full animate-pulse rounded-lg ${isDark ? "bg-white/10" : "bg-zinc-100"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="font-semibold text-red-500">Could not load activity logs.</p>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => {
                const tone = actionTone(row.action);
                return (
                  <tr key={row.id} className={`border-t transition ${border} ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-zinc-50"}`}>
                    <td className="w-40 px-6 py-4 align-middle">
                      <p className="whitespace-nowrap text-sm font-bold">{formatDateTime(row.created_at)}</p>
                      <p className={`mt-1 max-w-35 truncate text-xs ${muted}`}>{row.user_name || "-"}</p>
                    </td>
                    <td className="w-36 px-6 py-4 align-middle">
                      <p className="text-sm font-bold">{moduleLabel(row.module)}</p>
                      <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${badgeClass(tone, isDark)}`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="w-32 px-6 py-4 align-middle">
                      {row.ref_table ? (
                        <>
                          <p className={`truncate text-xs font-semibold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>{row.ref_table}</p>
                          <p className={`mt-1 text-xs ${muted}`}>#{row.ref_id}</p>
                        </>
                      ) : (
                        <p className={`text-xs ${muted}`}>-</p>
                      )}
                    </td>
                    <td className="w-64 px-6 py-4 align-middle">
                      <p className="line-clamp-2 text-sm leading-5">{row.description || "-"}</p>
                    </td>
                    <td className="w-44 px-6 py-4 align-middle">
                      <p className={`truncate text-xs ${muted}`}>
                        <span className="font-semibold">Old: </span>{formatJsonPreview(row.old_values)}
                      </p>
                      <p className={`mt-1 truncate text-xs ${muted}`}>
                        <span className="font-semibold">New: </span>{formatJsonPreview(row.new_values)}
                      </p>
                    </td>
                    <td className="w-28 px-6 py-4 align-middle">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold ${isDark ? "bg-white/10 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                        {row.ip_address || "-"}
                      </span>
                    </td>
                    <td className="w-16 px-4 py-4 align-middle">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => onView(row)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm transition hover:bg-orange-600"
                          title="View detail"
                        >
                          <FiEye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className={`px-6 py-16 text-center ${muted}`}>
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

