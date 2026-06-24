import { FiAlertTriangle, FiArchive } from "react-icons/fi";

import { formatQty } from "../utils/notificationUtils";

export default function NotificationItem({ alert, isDark, onClick }) {
  const isOut = alert.status === "out";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
        isDark
          ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          : "border-zinc-200 bg-white hover:bg-zinc-50",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isOut
            ? "bg-red-500/10 text-red-500"
            : "bg-amber-500/10 text-amber-500",
        ].join(" ")}
      >
        {isOut ? <FiAlertTriangle /> : <FiArchive />}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block truncate text-sm font-bold",
            isDark ? "text-white" : "text-zinc-900",
          ].join(" ")}
        >
          {alert.variantName}
        </span>
        <span
          className={[
            "mt-0.5 block truncate text-xs",
            isDark ? "text-zinc-400" : "text-zinc-500",
          ].join(" ")}
        >
          {alert.variantCode || alert.productName}
        </span>
        <span
          className={[
            "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold",
            isOut
              ? "bg-red-500/10 text-red-500"
              : "bg-amber-500/10 text-amber-600",
          ].join(" ")}
        >
          {isOut ? "អស់ស្តុក" : "ស្តុកស្ទើរអស់"}: {formatQty(alert.stockQty)}{" "}
          {alert.baseUnit}
        </span>
      </span>
    </button>
  );
}
