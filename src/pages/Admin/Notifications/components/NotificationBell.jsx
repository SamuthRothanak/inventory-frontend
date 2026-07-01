import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";

import { getStockBalancesApi } from "../../../../services/inventory.service";
import NotificationDropdown from "./NotificationDropdown";
import {
  buildInventoryAlerts,
  extractApiData,
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

  const alerts = useMemo(
    () => buildInventoryAlerts(extractApiData(stockBalancesQuery.data)),
    [stockBalancesQuery.data],
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
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
        // title="ការជូនដំណឹង"
        aria-label="ការជូនដំណឹង"
      >
        <FiBell className="text-[18px]" />

        {alerts.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[10px] font-extrabold leading-none text-white dark:border-zinc-900">
            {alerts.length > 99 ? "99+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          alerts={alerts}
          isDark={isDark}
          isLoading={stockBalancesQuery.isLoading}
          isError={stockBalancesQuery.isError}
          onItemClick={goToInventory}
          onViewInventory={() => goToInventory()}
          onRefresh={() => stockBalancesQuery.refetch()}
        />
      )}
    </div>
  );
}
