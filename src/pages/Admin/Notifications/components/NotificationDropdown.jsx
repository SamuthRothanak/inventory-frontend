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
        "absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl",
        isDark
          ? "border-white/10 bg-zinc-900 text-white shadow-black/40"
          : "border-zinc-200 bg-white text-zinc-900 shadow-black/15",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <div>
          <p className="text-sm font-extrabold">ការជូនដំណឹង</p>
          <p className={["mt-0.5 text-xs", isDark ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
            ការព្រមានស្តុកស្ទើរអស់ពីឃ្លាំង
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

      <div className="max-h-65 overflow-y-auto p-3">
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <FiCheckCircle className="text-xl" />
            </div>
            <p className="mt-3 text-sm font-bold">គ្មានទំនិញស្ទើរអស់</p>
            <p className={["mt-1 text-xs", isDark ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              ស្តុកទំនិញទាំងអស់នៅលើសកម្រិតអប្បបរមា។
            </p>
          </div>
        )}

        {!isLoading && !isError && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <NotificationItem
                key={`${alert.id}-${alert.variantCode}`}
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
