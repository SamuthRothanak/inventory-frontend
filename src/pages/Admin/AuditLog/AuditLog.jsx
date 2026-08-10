import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiActivity,
  FiCalendar,
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

// Same truncated-window pagination shape used elsewhere in the app (e.g. Purchases.jsx's
// ListPagination) — shows all pages up to 7, otherwise compresses to first/last + a window
// around the current page with "..." in between, instead of always showing a fixed run of 5.
function getPageNumbers(currentPage, totalPages) {
  const current = Number(currentPage || 1);
  const total = Number(totalPages || 1);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function AuditLog() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickDate, setQuickDate] = useState("all");

  const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleQuickDate = (value) => {
    setQuickDate(value);
    setPage(1);
    const today = new Date();
    if (value === "all") {
      setDateFrom(""); setDateTo("");
    } else if (value === "today") {
      setDateFrom(fmtDate(today)); setDateTo(fmtDate(today));
    } else if (value === "week") {
      const from = new Date(today); from.setDate(today.getDate() - 6);
      setDateFrom(fmtDate(from)); setDateTo(fmtDate(today));
    } else if (value === "month") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(fmtDate(from)); setDateTo(fmtDate(today));
    }
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activity-logs", { search, moduleFilter, actionFilter, perPage, page, dateFrom, dateTo }],
    queryFn: () =>
      getActivityLogsApi({
        search:     search.trim() || undefined,
        module:     moduleFilter !== "all" ? moduleFilter : undefined,
        action:     actionFilter !== "all" ? actionFilter : undefined,
        date_from:  dateFrom || undefined,
        date_to:    dateTo || undefined,
        per_page:   perPage,
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

  // fmtDate (local calendar day, not UTC) — matches the "quick date" filter buttons above and
  // avoids miscounting entries made 00:00-07:00 local time as "yesterday" (still UTC's previous
  // day at that hour, since Cambodia is UTC+7).
  const todayStr     = fmtDate(new Date());
  const todayCount   = rows.filter((r) => fmtDate(new Date(r.created_at)) === todayStr).length;
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

  const dateInputClass = isDark
    ? "border-white/10 bg-[#18181b] text-white focus:border-red-500 focus:ring-red-500/20"
    : "border-zinc-200 bg-white text-zinc-900 focus:border-red-500 focus:ring-red-500/20";

  const QUICK_DATES = [
    { label: "ទាំងអស់", value: "all" },
    { label: "ថ្ងៃនេះ", value: "today" },
    { label: "៧ ថ្ងៃ",  value: "week" },
    { label: "ខែនេះ",   value: "month" },
  ];

  return (
    <div className={`space-y-4 pb-6 sm:space-y-6 sm:pb-8 ${pageText}`}>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <AuditLogSummaryCard
          title="សកម្មភាពសរុប"
          value={isLoading ? "..." : total}
          caption="គ្រប់ម៉ូឌុល"
          icon={<FiActivity />}
          tone="red"
          isDark={isDark}
        />
        <AuditLogSummaryCard
          title="ថ្ងៃនេះ"
          value={isLoading ? "..." : todayCount}
          caption="សកម្មភាពប្រព័ន្ធថ្មីៗ"
          icon={<FiShield />}
          tone="emerald"
          isDark={isDark}
        />
        <AuditLogSummaryCard
          title="ផ្នែក"
          value={isLoading ? "..." : moduleCount}
          caption="ផ្នែកដែលមានសកម្មភាព"
          icon={<FiLayers />}
          tone="blue"
          isDark={isDark}
        />
        <AuditLogSummaryCard
          title="សកម្មភាពសំខាន់"
          value={isLoading ? "..." : criticalCount}
          caption="លុប / បោះបង់ / void"
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
            placeholder="ស្វែងរកសកម្មភាព អ្នកប្រើ ម៉ូឌុល យោង..."
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

      <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#18181b]" : "border-zinc-200 bg-white"}`}>
        <FiCalendar className="shrink-0 text-lg text-zinc-400" />
        <div className="flex flex-wrap gap-2">
          {QUICK_DATES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleQuickDate(opt.value)}
              className={`h-9 rounded-xl px-4 text-sm font-semibold transition border ${
                quickDate === opt.value
                  ? "bg-red-600 text-white border-red-600"
                  : isDark
                    ? "border-white/10 text-zinc-300 hover:bg-white/10"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setQuickDate("custom"); setPage(1); }}
            className={`h-9 rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${dateInputClass}`}
          />
          <span className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-400"}`}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setQuickDate("custom"); setPage(1); }}
            className={`h-9 rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${dateInputClass}`}
          />
        </div>
      </div>

      <AuditLogTable
        rows={rows}
        isDark={isDark}
        onView={setSelectedLog}
        isLoading={isLoading}
        isError={isError}
      />

      {lastPage > 1 && (
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-1 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            ទំព័រ {meta.current_page} នៃ {lastPage} — {total} កំណត់ត្រា
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <FiChevronLeft /> មុន
            </button>
            {getPageNumbers(page, lastPage).map((item) => item === "..." ? (
              <span key={item} className={`px-2 text-sm font-semibold ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 ${
                  item === page
                    ? "quick-action-icon-3d bg-red-600 text-white"
                    : "table-icon-3d border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              បន្ទាប់ <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      <AuditLogDetailModal log={selectedLog} isDark={isDark} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
