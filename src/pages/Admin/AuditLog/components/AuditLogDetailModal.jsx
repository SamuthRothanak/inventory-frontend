import React from "react";
import { FiActivity, FiDatabase, FiMinus, FiMonitor, FiPlus, FiUser, FiX } from "react-icons/fi";
import { actionLabel, actionTone, changeFieldLabel, extractRefLabel, formatAuditValue, formatDateTime, moduleLabel, refTableLabel, translateDescription } from "../utils/auditLogFormat";
import { getPermissionLabel } from "../../../../utils/permissionLabels";

// old_values/new_values can differ in raw type (e.g. "40" vs 40, or 1 vs true) without
// representing a real change, so compare their string form rather than the raw values.
function valuesEqual(a, b) {
  return String(a ?? "") === String(b ?? "");
}

function getChangedKeys(oldValues, newValues) {
  const oldObj = oldValues && typeof oldValues === "object" ? oldValues : {};
  const newObj = newValues && typeof newValues === "object" ? newValues : {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const changed = new Set();
  keys.forEach((key) => {
    if (!valuesEqual(oldObj[key], newObj[key])) changed.add(key);
  });
  return changed;
}

// The generic array formatter (formatAuditValue) shows any array as just "N items" — accurate
// enough for line-item arrays (sale/purchase items, which have their own record to inspect
// elsewhere) but useless for a permissions array, where this modal is the ONLY place the change
// is visible. Compute an actual added/removed diff instead so editing a role's permissions shows
// what changed, not just a before/after count.
function getPermissionsDiff(oldValues, newValues) {
  const oldPerms = Array.isArray(oldValues?.permissions) ? oldValues.permissions : null;
  const newPerms = Array.isArray(newValues?.permissions) ? newValues.permissions : null;
  if (!oldPerms && !newPerms) return null;

  const oldSet = new Set(oldPerms ?? []);
  const newSet = new Set(newPerms ?? []);
  const added = (newPerms ?? []).filter((p) => !oldSet.has(p));
  const removed = (oldPerms ?? []).filter((p) => !newSet.has(p));

  return { added, removed };
}

function PermissionsDiff({ diff, isDark }) {
  if (!diff || (diff.added.length === 0 && diff.removed.length === 0)) return null;

  return (
    <div className={`mt-2 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111113]" : "border-zinc-200 bg-zinc-50"}`}>
      <p className={`mb-3 text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>ការផ្លាស់ប្តូរសិទ្ធិប្រើប្រាស់</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-bold text-emerald-500">
            <FiPlus size={12} /> បានបន្ថែម ({diff.added.length})
          </p>
          {diff.added.length === 0 ? (
            <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>-</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {diff.added.map((name) => (
                <span key={name} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {getPermissionLabel(name)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
            <FiMinus size={12} /> បានដក ({diff.removed.length})
          </p>
          {diff.removed.length === 0 ? (
            <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>-</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {diff.removed.map((name) => (
                <span key={name} className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  {getPermissionLabel(name)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JsonPanel({ title, value, isDark, changedKeys, hideKeys }) {
  const keys = value && typeof value === "object" ? Object.keys(value).filter((k) => !hideKeys?.includes(k)) : [];

  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111113]" : "border-zinc-200 bg-zinc-50"}`}>
      <p className={`mb-3 text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>{title}</p>
      {keys.length === 0 ? (
        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>-</p>
      ) : (
        <div className="space-y-1 text-xs leading-6">
          {keys.map((key) => {
            const fieldValue = value[key];
            const displayValue = formatAuditValue(key, fieldValue);
            const isChanged = changedKeys?.has(key);
            return (
              <div
                key={key}
                className={`flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 ${
                  isChanged ? (isDark ? "bg-amber-500/10" : "bg-amber-50") : ""
                }`}
              >
                <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>{changeFieldLabel(key)}</span>
                <span
                  className={`font-semibold ${
                    isChanged
                      ? isDark
                        ? "text-amber-400"
                        : "text-amber-700"
                      : isDark
                        ? "text-zinc-200"
                        : "text-zinc-700"
                  }`}
                >
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AuditLogDetailModal({ log, isDark = false, onClose }) {
  if (!log) return null;

  const changedKeys = getChangedKeys(log.old_values, log.new_values);
  const permissionsDiff = getPermissionsDiff(log.old_values, log.new_values);
  const tone = actionTone(log.action);
  const toneClass = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    red: "bg-red-500/10 text-red-500",
    purple: "bg-purple-500/10 text-purple-500",
    amber: "bg-amber-500/10 text-amber-500",
  }[tone];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className={`flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${isDark ? "border-white/10 bg-[#18181b] text-white" : "border-zinc-200 bg-white text-zinc-950"}`}>
        <div className={`flex items-start justify-between gap-4 border-b p-4 sm:p-6 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <div>
            <h2 className="text-2xl font-extrabold">ព័ត៌មានលម្អិត #{log.id}</h2>
            <p className={`mt-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>ព័ត៌មានកំណត់ហេតុ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`table-icon-3d flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition hover:-translate-y-0.5 ${isDark ? "bg-white/10 text-zinc-200 hover:bg-white/15" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
          >
            <FiX />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <div className="table-icon-3d mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-xl text-red-500">
                <FiUser />
              </div>
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>អ្នកប្រើ</p>
              <p className="mt-1 font-bold">{log.user_name || `User #${log.user_id || "-"}`}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <div className={`table-icon-3d mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${toneClass}`}>
                <FiActivity />
              </div>
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>ផ្នែក / សកម្មភាព</p>
              <p className="mt-1 font-bold">{moduleLabel(log.module)} / {actionLabel(log.action)}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <div className="table-icon-3d mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-500">
                <FiDatabase />
              </div>
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>ឯកសារ</p>
              <p className="mt-1 font-bold">{log.ref_table ? refTableLabel(log.ref_table) : "-"} {extractRefLabel(log.description) || `#${log.ref_id || "-"}`}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
              <div className="table-icon-3d mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-500">
                <FiMonitor />
              </div>
              <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>IP / ពេលវេលា</p>
              <p className="mt-1 font-bold">{log.ip_address || "-"}</p>
              <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{formatDateTime(log.created_at)}</p>
            </div>
          </div>
          <div className={`mt-5 rounded-2xl border p-5 ${isDark ? "border-white/10 bg-[#202023]" : "border-zinc-200 bg-white"}`}>
            <p className={`text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>ការពិពណ៌នា</p>
            <p className="mt-2 leading-7">{translateDescription(log.description)}</p>
          </div>
          {changedKeys.size > 0 && (
            <p className={`mt-5 text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              <span className={`mr-1 inline-block h-2 w-2 rounded-full align-middle ${isDark ? "bg-amber-400" : "bg-amber-500"}`} />
              បន្ទាត់ពណ៌លឿង គឺជាទិន្នន័យដែលពិតជាបានផ្លាស់ប្តូរ
            </p>
          )}
          <PermissionsDiff diff={permissionsDiff} isDark={isDark} />
          <div className={`grid gap-4 md:grid-cols-2 ${changedKeys.size > 0 ? "mt-2" : "mt-5"}`}>
            <JsonPanel title="តម្លៃមុន" value={log.old_values} isDark={isDark} changedKeys={changedKeys} hideKeys={permissionsDiff ? ["permissions"] : []} />
            <JsonPanel title="តម្លៃក្រោយ" value={log.new_values} isDark={isDark} changedKeys={changedKeys} hideKeys={permissionsDiff ? ["permissions"] : []} />
          </div>
        </div>
        <div className={`flex justify-end border-t p-4 sm:p-5 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <button
            type="button"
            onClick={onClose}
            className="quick-action-icon-3d h-11 w-full rounded-xl bg-red-600 px-8 font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0 sm:w-auto"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
}
