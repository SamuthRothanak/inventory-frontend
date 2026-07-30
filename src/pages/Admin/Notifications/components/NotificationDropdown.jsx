import { FiCheckCircle, FiRefreshCw } from "react-icons/fi";

import NotificationItem from "./NotificationItem";

export default function NotificationDropdown({
  alerts,
  isDark,
  isLoading,
  isError,
  onItemClick,
  onViewInventory,
  onRefresh,
}) {
  return (
    <div
      className={[
        "fixed inset-x-2 top-[4.75rem] isolate z-[9999] w-auto overflow-hidden rounded-2xl border shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(420px,calc(100vw-2rem))]",
        isDark
          ? "border-white/10 bg-zinc-900 text-white shadow-black/40"
          : "border-zinc-200 bg-white text-zinc-900 shadow-black/15",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <div>
          <p className="text-sm font-extrabold">ការជូនដំណឹង</p>
          <p className={["mt-0.5 text-xs", isDark ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
            ស្តុកស្ទើរអស់ និងទំនិញជិតផុតកំណត់
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
            isDark ? "hover:bg-white/10" : "hover:bg-zinc-100",
          ].join(" ")}
          title="Refresh"
        >
          <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain p-3 sm:max-h-80">
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={[
                  "h-[74px] animate-pulse rounded-xl",
                  isDark ? "bg-white/5" : "bg-zinc-100",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-500">
            មិនអាចផ្ទុកការជូនដំណឹងបានទេ។
          </div>
        )}

        {!isLoading && !isError && alerts.length === 0 && (
          <div className="relative z-0 flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center dark:border-white/10 dark:bg-zinc-900">
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <FiCheckCircle className="text-xl" />
            </div>
            <p className="mt-3 text-sm font-bold">គ្មានការជូនដំណឹង</p>
            <p className={["mt-1 text-xs", isDark ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              មិនមានស្តុកស្ទើរអស់ ឬទំនិញជិតផុតកំណត់ទេ។
            </p>
          </div>
        )}

        {!isLoading && !isError && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <NotificationItem
                key={`${alert.type}-${alert.id}-${alert.variantCode || alert.batchNo || ""}`}
                alert={alert}
                isDark={isDark}
                onClick={() => onItemClick(alert)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-white/10">
        <button
          type="button"
          onClick={onViewInventory}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white transition hover:bg-red-600"
        >
          បើកឃ្លាំង
        </button>
      </div>
    </div>
  );
}
