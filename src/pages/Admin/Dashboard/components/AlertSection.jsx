import { useState } from "react";
import { Link } from "react-router-dom";

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

const ROW_ACCENT = {
  low_stock: "border-l-red-500",
  pending_stock_in: "border-l-violet-500",
  unpaid: "border-l-amber-500",
  expiring_soon: "border-l-orange-500",
};

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
          <span className={`table-icon-3d flex h-7 w-7 items-center justify-center rounded-lg text-sm ${alert.bg} ${alert.color}`}>
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
        <div className="space-y-2 px-3 pb-3">
          {alert.items.map((item, i) => {
            const RowTag = alert.to ? Link : "div";
            const rowProps = alert.to ? { to: alert.to } : {};
            return (
              <RowTag
                key={`${item.id ?? item.name ?? "alert"}-${i}`}
                {...rowProps}
                className={`flex min-w-0 items-start gap-3 rounded-lg border border-l-4 px-3 py-2.5 text-xs transition ${ROW_ACCENT[alert.type] ?? "border-l-zinc-400"} ${alert.to ? "cursor-pointer" : ""} ${isDark ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold ${alert.bg} ${alert.color}`}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block break-words font-bold leading-5 ${theme.pageTitle}`}>{item.name}</span>
                  <span className={`mt-0.5 block break-words leading-5 ${theme.muted}`}>
                    {translateDetail(item.detail) || "-"}
                  </span>
                </span>
              </RowTag>
            );
          })}
        </div>
      )}
    </div>
  );
}
