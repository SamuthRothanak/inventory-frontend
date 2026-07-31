import React from "react";
import { FiActivity, FiEye } from "react-icons/fi";
import {
  actionLabel,
  actionTone,
  extractRefLabel,
  formatDateTime,
  formatJsonPreview,
  moduleLabel,
  refTableLabel,
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
        <table className="responsive-card-table min-w-[1320px] w-full text-left">
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
              <AuditLog3DLoading
                colSpan={7}
                isDark={isDark}
                border={border}
                muted={muted}
              />
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
                    <td data-label="ពេល / អ្នកប្រើ" className="w-40 px-6 py-4 align-middle">
                      <p className="whitespace-nowrap text-sm font-bold">
                        {formatDateTime(row.created_at)}
                      </p>
                      <p className={`mt-1 max-w-35 truncate text-xs ${muted}`}>
                        {row.user_name || "-"}
                      </p>
                    </td>
                    <td data-label="ផ្នែក" className="min-w-52 px-6 py-4 align-middle">
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
                    <td data-label="ឯកសារ" className="w-32 px-6 py-4 align-middle">
                      {row.ref_table ? (
                        <>
                          <p
                            className={`truncate text-xs font-semibold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
                          >
                            {refTableLabel(row.ref_table)}
                          </p>
                          <p className={`mt-1 text-xs ${muted}`}>
                            {extractRefLabel(row.description) || `#${row.ref_id}`}
                          </p>
                        </>
                      ) : (
                        <p className={`text-xs ${muted}`}>-</p>
                      )}
                    </td>
                    <td data-label="ពិពណ៌នា" className="w-64 px-6 py-4 align-middle">
                      <p className="line-clamp-2 text-sm leading-5">
                        {translateDescription(row.description)}
                      </p>
                    </td>
                    <td data-label="ផ្លាស់ប្ដូរ" className="w-44 px-6 py-4 align-middle">
                      <p className={`truncate text-xs ${muted}`}>
                        <span className="font-semibold">មុន: </span>
                        {formatJsonPreview(row.old_values)}
                      </p>
                      <p className={`mt-1 truncate text-xs ${muted}`}>
                        <span className="font-semibold">ក្រោយ: </span>
                        {formatJsonPreview(row.new_values)}
                      </p>
                    </td>
                    <td data-label="IP" className="w-20 px-1 py-4 align-middle">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold ${isDark ? "bg-white/10 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}
                      >
                        {row.ip_address || "-"}
                      </span>
                    </td>
                    <td data-label="សកម្មភាព" className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip label="មើលកំណត់ហេតុ">
                          <button
                            type="button"
                            onClick={() => onView(row)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
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

function AuditLog3DLoading({ colSpan, isDark, border, muted }) {
  return (
    <tr className={`border-t ${border}`}>
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
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-orange-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-amber-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-yellow-300 border-r-orange-500 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(154, 52, 18, 0.28), inset 4px 4px 10px rgba(255,255,255,0.38), inset -5px -7px 12px rgba(154,52,18,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiActivity className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-red-500 shadow-lg shadow-red-500/40" />
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            កំពុងរៀបចំបញ្ជីកំណត់ហេតុ
          </p>
        </div>
      </td>
    </tr>
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
