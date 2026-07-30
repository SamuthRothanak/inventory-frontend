import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";

import {
  getInventoryBatchesApi,
  getStockBalancesApi,
} from "../../../../services/inventory.service";
import NotificationDropdown from "./NotificationDropdown";
import {
  buildExpiryAlerts,
  buildInventoryAlerts,
  extractApiData,
  sortAlerts,
} from "../utils/notificationUtils";

export default function NotificationBell({ isDark }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);

  const stockBalancesQuery = useQuery({
    queryKey: ["notifications", "stock-balances"],
    queryFn: () => getStockBalancesApi({ per_page: 200 }),
    staleTime: 30_000,
  });

  const expiryCutoff = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  }, []);

  const inventoryBatchesQuery = useQuery({
    queryKey: ["notifications", "inventory-batches", expiryCutoff],
    queryFn: () =>
      getInventoryBatchesApi({
        per_page: 200,
        only_available: 1,
        expired_before: expiryCutoff,
      }),
    staleTime: 30_000,
  });

  const alerts = useMemo(
    () =>
      sortAlerts([
        ...buildExpiryAlerts(extractApiData(inventoryBatchesQuery.data)),
        ...buildInventoryAlerts(extractApiData(stockBalancesQuery.data)),
      ]),
    [inventoryBatchesQuery.data, stockBalancesQuery.data],
  );

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const goToInventory = (alert) => {
    setOpen(false);
    const query = alert?.variantCode
      ? `?search=${encodeURIComponent(alert.variantCode)}`
      : "";
    navigate(`/home/inventory${query}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-red-400/40 bg-gradient-to-br from-[#ff4655] via-[#ff3347] to-[#e91f37] text-white shadow-[4px_6px_14px_rgba(190,24,49,0.24),-2px_-2px_7px_rgba(255,255,255,0.7),inset_0_1px_1px_rgba(255,255,255,0.38),inset_0_-2px_4px_rgba(159,18,57,0.12)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[5px_9px_18px_rgba(190,24,49,0.3),-2px_-2px_8px_rgba(255,255,255,0.75),inset_0_1px_1px_rgba(255,255,255,0.42)] active:translate-y-px active:scale-[0.97] active:shadow-[2px_3px_8px_rgba(190,24,49,0.22),inset_0_2px_5px_rgba(127,29,29,0.16)] dark:shadow-[4px_7px_15px_rgba(0,0,0,0.36),-1px_-1px_5px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.32)]"
        // title="ការជូនដំណឹង"
        aria-label="ការជូនដំណឹង"
      >
        <span className="pointer-events-none absolute left-2 right-2 top-1 h-px rounded-full bg-white/45" />
        <FiBell className={`relative text-[19px] drop-shadow-[0_2px_2px_rgba(127,29,29,0.28)] transition-transform duration-300 ${open ? "rotate-12" : "group-hover:-rotate-12"}`} />

        {alerts.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[9px] font-extrabold leading-none text-white shadow-[1px_3px_7px_rgba(217,119,6,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:border-zinc-900">
            {alerts.length > 99 ? "99+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          alerts={alerts}
          isDark={isDark}
          isLoading={stockBalancesQuery.isLoading || inventoryBatchesQuery.isLoading}
          isError={stockBalancesQuery.isError || inventoryBatchesQuery.isError}
          onItemClick={goToInventory}
          onViewInventory={() => goToInventory()}
          onRefresh={() => {
            stockBalancesQuery.refetch();
            inventoryBatchesQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
