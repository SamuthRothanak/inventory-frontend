import React from "react";
import { FiEye } from "react-icons/fi";
import {
  actionLabel,
  actionTone,
  extractRefLabel,
  formatDateTime,
  formatJsonPreview,
  moduleLabel,
  translateDescription,
} from "../utils/auditLogFormat";

function badgeClass(tone, isDark) {
  const tones = {
    emerald: isDark
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-emerald-50 text-emerald-700",
    blue: isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700",
    red: isDark ? "bg-red-500/15 text-red-300" : "bg-red-50 text-red-700",
    purple: isDark
      ? "bg-purple-500/15 text-purple-300"
      : "bg-purple-50 text-purple-700",
    amber: isDark
      ? "bg-amber-500/15 text-amber-300"
      : "bg-amber-50 text-amber-700",
  };

  return tones[tone] || tones.amber;
}

export default function AuditLogTable({
  rows = [],
  isDark = false,
  onView,
  isLoading = false,
  isError = false,
}) {
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const border = isDark ? "border-white/10" : "border-zinc-200";

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${border} ${isDark ? "bg-[#18181b]" : "bg-white"}`}
    >
      <div className="p-5">
        <h2 className="text-xl font-extrabold">បញ្ជីកំណត់ហេតុ</h2>
        <p className={`mt-1 text-sm ${muted}`}>
          បង្ហាញ {rows.length} កំណត់ត្រាសកម្មភាព
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1320px] w-full text-left">
          <thead>
            <tr className="bg-red-600 text-sm font-bold text-white">
              <th className="px-6 py-4">ពេល / អ្នកប្រើ</th>
              <th className="px-6 py-4">ផ្នែក</th>
              <th className="px-6 py-4">ឯកសារ</th>
              <th className="px-6 py-4">ពិពណ៌នា</th>
              <th className="px-6 py-4">ផ្លាស់ប្ដូរ</th>
              <th className="px-6 py-4">IP</th>
              <th className="px-6 py-4 text-center">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={`border-t ${border}`}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-6 py-5">
                      <div
                        className={`h-4 w-full animate-pulse rounded-lg ${isDark ? "bg-white/10" : "bg-zinc-100"}`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="font-semibold text-red-500">
                    មិនអាចផ្ទុកកំណត់ហេតុបានទេ។
                  </p>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => {
                const tone = actionTone(row.action);
                return (
                  <tr
                    key={row.id}
                    className={`border-t transition ${border} ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-zinc-50"}`}
                  >
                    <td className="w-40 px-6 py-4 align-middle">
                      <p className="whitespace-nowrap text-sm font-bold">
                        {formatDateTime(row.created_at)}
                      </p>
                      <p className={`mt-1 max-w-35 truncate text-xs ${muted}`}>
                        {row.user_name || "-"}
                      </p>
                    </td>
                    <td className="min-w-52 px-6 py-4 align-middle">
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <p className="text-sm font-bold">
                          {moduleLabel(row.module)}
                        </p>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${badgeClass(tone, isDark)}`}
                        >
                          {actionLabel(row.action)}
                        </span>
                      </div>
                    </td>
                    <td className="w-32 px-6 py-4 align-middle">
                      {row.ref_table ? (
                        <>
                          <p
                            className={`truncate text-xs font-semibold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
                          >
                            {row.ref_table}
                          </p>
                          <p className={`mt-1 text-xs ${muted}`}>
                            {extractRefLabel(row.description) || `#${row.ref_id}`}
                          </p>
                        </>
                      ) : (
                        <p className={`text-xs ${muted}`}>-</p>
                      )}
                    </td>
                    <td className="w-64 px-6 py-4 align-middle">
                      <p className="line-clamp-2 text-sm leading-5">
                        {translateDescription(row.description)}
                      </p>
                    </td>
                    <td className="w-44 px-6 py-4 align-middle">
                      <p className={`truncate text-xs ${muted}`}>
                        <span className="font-semibold">មុន: </span>
                        {formatJsonPreview(row.old_values)}
                      </p>
                      <p className={`mt-1 truncate text-xs ${muted}`}>
                        <span className="font-semibold">ក្រោយ: </span>
                        {formatJsonPreview(row.new_values)}
                      </p>
                    </td>
                    <td className="w-20 px-1 py-4 align-middle">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold ${isDark ? "bg-white/10 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}
                      >
                        {row.ip_address || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip label="មើលកំណត់ហេតុ">
                          <button
                            type="button"
                            onClick={() => onView(row)}
                             className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                          >
                            <FiEye size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className={`px-6 py-16 text-center ${muted}`}>
                  រកមិនឃើញកំណត់ហេតុទេ។
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// function Tooltip({ label, children }) {
//   return (
//     <div className="group relative inline-flex">
//       {children}
//       <span className="pointer-events-none absolute right-full top-1/2 z-20 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
//         {label}
//         <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-zinc-800 dark:border-l-zinc-700" />
//       </span>
//     </div>
//   );
// }
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
