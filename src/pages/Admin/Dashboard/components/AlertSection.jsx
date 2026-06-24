import { useState } from "react";

const DETAIL_KH = {
  "received · needs confirm": "បានទទួល · ត្រូវបញ្ជាក់",
  "received · confirmed":     "បានទទួល · បានបញ្ជាក់",
  "pending":                  "រង់ចាំ",
  "received":                 "បានទទួល",
  "confirmed":                "បានបញ្ជាក់",
  "partially paid":           "បង់ប្រាក់មួយផ្នែក",
  "unpaid":                   "មិនទាន់បង់",
  "needs confirm":            "ត្រូវបញ្ជាក់",
  "expiring soon":            "ជិតផុតកំណត់",
};
const translateDetail = (s) => DETAIL_KH[String(s ?? "").toLowerCase()] ?? s;

export default function AlertSection({ alert, theme, isDark }) {
  const [open, setOpen] = useState(true);
  const Icon = alert.icon;
  return (
    <div className={`rounded-xl border ${theme.softCard}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:opacity-80`}
      >
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${alert.bg} ${alert.color}`}>
            <Icon />
          </span>
          <span className={`text-sm font-bold ${theme.pageTitle}`}>{alert.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${alert.bg} ${alert.color}`}>
            {alert.items.length}
          </span>
        </div>
        <span className={`text-xs ${theme.muted}`}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-1 px-4 pb-3">
          {alert.items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${isDark ? "bg-white/4" : "bg-zinc-50"}`}>
              <span className={`font-semibold ${theme.pageTitle}`}>{item.name}</span>
              <span className={theme.muted}>{translateDetail(item.detail)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


