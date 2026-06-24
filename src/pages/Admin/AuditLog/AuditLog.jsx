import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiActivity,
  FiDatabase,
  FiFilter,
  FiLayers,
  FiRefreshCcw,
  FiSearch,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import AuditLogDetailModal from "./components/AuditLogDetailModal";
import AuditLogFilterSelect from "./components/AuditLogFilterSelect";
import AuditLogSummaryCard from "./components/AuditLogSummaryCard";
import AuditLogTable from "./components/AuditLogTable";
import { auditLogActions, auditLogModules, pageSizeOptions } from "./utils/auditLogData";
import { getActivityLogsApi } from "../../../services/auditLog.service";

export default function AuditLog() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activity-logs", { search, moduleFilter, actionFilter, perPage, page }],
    queryFn: () =>
      getActivityLogsApi({
        search:   search.trim() || undefined,
        module:   moduleFilter !== "all" ? moduleFilter : undefined,
        action:   actionFilter !== "all" ? actionFilter : undefined,
        per_page: perPage,
        page,
      }),
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    return (data?.data ?? []).map((row) => ({
      ...row,
      user_name: row.user?.name ?? `User #${row.user_id ?? "-"}`,
    }));
  }, [data]);

  const meta       = data?.meta ?? {};
  const total      = meta.total ?? 0;
  const lastPage   = meta.last_page ?? 1;

  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayCount   = rows.filter((r) => String(r.created_at).startsWith(todayStr)).length;
  const criticalCount = rows.filter((r) => ["deleted", "cancelled", "void"].includes(String(r.action).toLowerCase())).length;
  const moduleCount  = new Set(rows.map((r) => r.module)).size;

  const pageText  = isDark ? "text-white" : "text-zinc-950";
  const inputClass = isDark
    ? "border-white/10 bg-[#18181b] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
    : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:ring-red-500/20";

  const handleModuleChange = (value) => { setModuleFilter(value); setPage(1); };
  const handleActionChange = (value) => { setActionFilter(value); setPage(1); };
  const handlePerPageChange = (value) => { setPerPage(value); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className={`space-y-6 px-5 pb-8 pt-6 ${pageText}`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AuditLogSummaryCard
          title="Total Activities"
          value={isLoading ? "..." : total}
          caption="All modules"
          icon={<FiActivity />}
          tone="red"
          isDark={isDark}
        />
        <AuditLogSummaryCard
          title="Today"
          value={isLoading ? "..." : todayCount}
          caption="Latest system actions"
          icon={<FiShield />}
          tone="emerald"
          isDark={isDark}
        />
        <AuditLogSummaryCard
          title="Modules"
          value={isLoading ? "..." : moduleCount}
          caption="Tracked areas"
          icon={<FiLayers />}
          tone="blue"
          isDark={isDark}
        />
        <AuditLogSummaryCard
          title="Critical Actions"
          value={isLoading ? "..." : criticalCount}
          caption="Delete / cancel / void"
          icon={<FiRefreshCcw />}
          tone="amber"
          isDark={isDark}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_0.9fr_0.9fr_0.7fr]">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-zinc-400" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search activity, user, module, reference..."
            className={`h-14 w-full rounded-2xl border pl-14 pr-4 text-sm outline-none transition focus:ring-4 ${inputClass}`}
          />
        </div>
        <AuditLogFilterSelect
          icon={<FiDatabase />}
          value={moduleFilter}
          onChange={handleModuleChange}
          options={auditLogModules}
          isDark={isDark}
          searchable
        />
        <AuditLogFilterSelect
          icon={<FiFilter />}
          value={actionFilter}
          onChange={handleActionChange}
          options={auditLogActions}
          isDark={isDark}
        />
        <AuditLogFilterSelect
          icon={<span className="font-extrabold">#</span>}
          value={perPage}
          onChange={handlePerPageChange}
          options={pageSizeOptions}
          isDark={isDark}
        />
      </div>

      <AuditLogTable
        rows={rows}
        isDark={isDark}
        onView={setSelectedLog}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
      />

      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Page {meta.current_page} of {lastPage} — {total} records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <FiChevronLeft />
            </button>
            {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, lastPage - 4)) + i;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition ${
                    p === page
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      <AuditLogDetailModal log={selectedLog} isDark={isDark} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
