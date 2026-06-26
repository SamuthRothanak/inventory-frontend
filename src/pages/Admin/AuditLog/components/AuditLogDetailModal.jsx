import React from "react";
import { FiActivity, FiDatabase, FiMonitor, FiUser, FiX } from "react-icons/fi";
import { actionLabel, actionTone, formatDateTime, moduleLabel, translateDescription } from "../utils/auditLogFormat";

function JsonPanel({ title, value, isDark }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111113]" : "border-zinc-200 bg-zinc-50"}`}>
      <p className={`mb-3 text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>{title}</p>
      <pre className={`max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-6 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
        {value ? JSON.stringify(value, null, 2) : "-"}
      </pre>
    </div>
  );
}

export default function AuditLogDetailModal({ log, isDark = false, onClose }) {
  if (!log) return null;

  const tone = actionTone(log.action);
  const toneClass = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    red: "bg-red-500/10 text-red-500",
    purple: "bg-purple-500/10 text-purple-500",
    amber: "bg-amber-500/10 text-amber-500",
  }[tone];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className={`flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${isDark ? "border-white/10 bg-[#18181b] text-white" : "border-zinc-200 bg-white text-zinc-950"}`}>
        <div className={`flex items-start justify-between gap-4 border-b p-6 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <div>
            <h2 className="text-2xl font-extrabold">ព័ត៌មានលម្អិត #{log.id}</h2>
            <p className={`mt-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>ព័ត៌មានកំណត់ហេតុ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm transition ${isDark ? "bg-white text-zinc-900 hover:bg-zinc-200" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
          >
            <FiX />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <FiUser className="mb-3 text-2xl text-red-500" />
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>អ្នកប្រើ</p>
              <p className="mt-1 font-bold">{log.user_name || `User #${log.user_id || "-"}`}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <FiActivity className={`mb-3 text-2xl ${toneClass}`} />
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>ផ្នែក / សកម្មភាព</p>
              <p className="mt-1 font-bold">{moduleLabel(log.module)} / {actionLabel(log.action)}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <FiDatabase className="mb-3 text-2xl text-blue-500" />
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>ឯកសារ</p>
              <p className="mt-1 font-bold">{log.ref_table || "-"} #{log.ref_id || "-"}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <FiMonitor className="mb-3 text-2xl text-emerald-500" />
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>IP / ពេលវេលា</p>
              <p className="mt-1 font-bold">{log.ip_address || "-"}</p>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{formatDateTime(log.created_at)}</p>
            </div>
          </div>

          <div className={`mt-5 rounded-2xl border p-5 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
            <p className={`text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>ការពិពណ៌នា</p>
            <p className="mt-2 leading-7">{translateDescription(log.description)}</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <JsonPanel title="តម្លៃមុន" value={log.old_values} isDark={isDark} />
            <JsonPanel title="តម្លៃក្រោយ" value={log.new_values} isDark={isDark} />
          </div>
        </div>

        <div className={`flex justify-end border-t p-5 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-red-600 px-8 py-3 font-bold text-white shadow-sm transition hover:bg-red-700"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
}

