import { useState } from "react";
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiHash,
  FiInfo,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTruck,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import { ModalShell } from "./SupplierFormModal";

function formatCurrencyPair(usd, khr) {
  return `$${Number(usd || 0).toFixed(2)} / ៛${Number(khr || 0).toLocaleString()}`;
}

// Multiple damaged items claimed+resolved as credit_note together (same claim, same source
// purchase) each get their own SupplierCredit ledger row on the backend — needed there for
// per-item traceability/consumption, but showing them as separate rows here reads as if they
// were unrelated incidents. Merge purely for display: one row per source purchase, amounts
// summed, so the history matches "this purchase gave this much credit in total."
function groupCreditsBySourcePurchase(credits) {
  const groups = new Map();
  credits.forEach((credit) => {
    const key = credit.source_purchase_id ?? `standalone-${credit.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        sourcePurchaseNo: credit.source_purchase?.purchase_no,
        amountUsd: 0,
        amountKhr: 0,
        remainingUsd: 0,
        remainingKhr: 0,
        usedPurchaseNos: new Set(),
        allCancelled: true,
        latestCreatedAt: credit.created_at,
      });
    }
    const group = groups.get(key);
    group.amountUsd += Number(credit.amount_usd || 0);
    group.amountKhr += Number(credit.amount_khr || 0);
    group.remainingUsd += Number(credit.remaining_usd || 0);
    group.remainingKhr += Number(credit.remaining_khr || 0);
    if (credit.status !== "cancelled") group.allCancelled = false;
    if (credit.status === "used" && (credit.used_purchase?.purchase_no || credit.used_purchase_id)) {
      group.usedPurchaseNos.add(credit.used_purchase?.purchase_no || `#${credit.used_purchase_id}`);
    }
    if (credit.created_at > group.latestCreatedAt) group.latestCreatedAt = credit.created_at;
  });
  return Array.from(groups.values()).sort((a, b) => (a.latestCreatedAt < b.latestCreatedAt ? 1 : -1));
}

export default function ViewSupplierModal({ supplier, theme, onClose, onEdit, creditBalance, creditBalanceLoading = false }) {
  const availableUsd = Number(creditBalance?.available_usd || 0);
  const availableKhr = Number(creditBalance?.available_khr || 0);
  const hasAvailableCredit = availableUsd > 0 || availableKhr > 0;
  const credits = Array.isArray(creditBalance?.credits) ? creditBalance.credits : [];
  const groupedCredits = groupCreditsBySourcePurchase(credits);
  const creditsTotalCount = Number(creditBalance?.credits_total_count ?? credits.length);
  const hasMoreCreditHistory = creditsTotalCount > credits.length;
  // Collapsed by default — the history list can grow long, and it's reference info someone
  // checks occasionally, not something that needs to push the rest of this modal down every time.
  const [isCreditHistoryExpanded, setIsCreditHistoryExpanded] = useState(false);
  return (
    <ModalShell
      title={supplier.name}
      subtitle={`${supplier.supplierCode} · Supplier / Distributor`}
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បិទ
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <FiEdit2 />
            កែអ្នកផ្គត់ផ្គង់
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionTitle
          icon={<FiInfo />}
          title="ព័ត៌មានអ្នកផ្គត់ផ្គង់"
          subtitle="ព័ត៌មានសំខាន់ និងស្ថានភាពបច្ចុប្បន្ន។"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBox
              theme={theme}
              label="លេខកូដះអនកផ្គត់ផ្គង់"
              value={supplier.supplierCode}
              icon={<FiHash />}
            />

            <InfoBox
              theme={theme}
              label="ឈ្មោះអ្នកផ្គត់ផ្គង់"
              value={supplier.name}
              icon={<FiTruck />}
            />

            <InfoBox
              theme={theme}
              label="ឈ្មោះអ្នកទំនាក់ទំនង"
              value={supplier.contactPerson || "-"}
              icon={<FiUser />}
            />

            <InfoBox
              theme={theme}
              label="លេខទូរស័ព្ទ"
              value={supplier.phone || "-"}
              icon={<FiPhone />}
            />

            <InfoBox
              theme={theme}
              label="អ៊ីម៉ែល"
              value={supplier.email || "-"}
              icon={<FiMail />}
            />

            <InfoBox
              theme={theme}
              label="ស្ថានភាព"
              value={supplier.status === "Active" ? "ដំណើរការ" : "មិនដំណើរការ"}
              icon={
                supplier.status === "Active" ? <FiCheckCircle /> : <FiXCircle />
              }
            />

            <InfoBox
              theme={theme}
              label="បង្កើតនៅ"
              value={supplier.createdAt}
              icon={<FiFileText />}
            />

            <InfoBox
              theme={theme}
              label="បានកែនៅ"
              value={supplier.updatedAt}
              icon={<FiFileText />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiCreditCard />}
          title="សមតុល្យលុយកាត់លើកក្រោយ"
          subtitle="លុយដែលចេញពីការទាមទារខូចខាតដោះស្រាយជាកាត់លុយលើកក្រោយ — អាចយកទៅកាត់ការទិញលើកក្រោយបាន។"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          {creditBalanceLoading ? (
            <p className={`text-sm ${theme.muted}`}>កំពុងផ្ទុក...</p>
          ) : (
            <>
              <div className={`rounded-xl border p-4 ${hasAvailableCredit ? "border-emerald-300 dark:border-emerald-500/30" : theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>លុយកាត់លើកក្រោយនៅសល់ដែលអាចប្រើបាន</p>
                <p className={`mt-1 text-xl font-bold ${hasAvailableCredit ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                  {formatCurrencyPair(availableUsd, availableKhr)}
                </p>
              </div>

              {credits.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreditHistoryExpanded((previous) => !previous)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <p className={`text-xs font-semibold ${theme.muted}`}>
                      ប្រវត្តិលុយកាត់លើកក្រោយ
                      {hasMoreCreditHistory && ` (${credits.length} ចុងក្រោយ ក្នុងចំណោមសរុប ${creditsTotalCount})`}
                    </p>
                    {isCreditHistoryExpanded ? (
                      <FiChevronUp className={theme.muted} />
                    ) : (
                      <FiChevronDown className={theme.muted} />
                    )}
                  </button>
                  {/* Collapsed by default, and capped/scrollable once expanded — a supplier that
                      accumulates credit history over time would otherwise make this popup grow
                      without limit every time someone just wants to check the total. */}
                  {isCreditHistoryExpanded && (
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {groupedCredits.map((group) => {
                    const isAvailable = group.remainingUsd > 0 || group.remainingKhr > 0;
                    const isFullyUsed = !isAvailable && !group.allCancelled;
                    const isPartial = isAvailable && (group.remainingUsd !== group.amountUsd || group.remainingKhr !== group.amountKhr);
                    const usedPurchaseNos = Array.from(group.usedPurchaseNos);
                    return (
                      <div key={group.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${theme.softCard}`}>
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <FiCheckCircle className="text-emerald-500" />
                          ) : isFullyUsed ? (
                            <FiClock className="text-zinc-400" />
                          ) : (
                            <FiXCircle className="text-zinc-400" />
                          )}
                          <div>
                            <p className="text-sm font-semibold">
                              {formatCurrencyPair(group.amountUsd, group.amountKhr)}
                            </p>
                            <p className={`text-xs ${theme.muted}`}>
                              {group.sourcePurchaseNo ? `ពីការទិញ #${group.sourcePurchaseNo}` : ""}
                              {isAvailable
                                ? " · នៅសល់ ប្រើប្រាស់បាន"
                                : isFullyUsed
                                  ? ` · ${usedPurchaseNos.length === 1 ? `បានប្រើលើការទិញ #${usedPurchaseNos[0]}` : "ប្រើអស់ហើយ"}`
                                  : " · បានលុបចោល"}
                            </p>
                          </div>
                        </div>
                        {isPartial && (
                          <p className="text-xs font-semibold text-amber-600">
                            នៅសល់ {formatCurrencyPair(group.remainingUsd, group.remainingKhr)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  )}
                </div>
              )}

              {credits.length === 0 && (
                <p className={`mt-3 text-xs ${theme.muted}`}>អ្នកផ្គត់ផ្គង់នេះមិនទាន់មានលុយកាត់លើកក្រោយណាមួយនៅឡើយទេ។</p>
              )}
            </>
          )}
        </div>

        <SectionTitle
          icon={<FiMapPin />}
          title="អាសយដ្ឋាន និងចំណាំ"
          subtitle="ទីតាំងដឹកជញ្ជូន និងកំណត់សម្គាល់របស់អ្នកផ្គត់ផ្គង់"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <DetailBlock
            theme={theme}
            label="អាសយដ្ឋាន"
            value={supplier.address || "-"}
            icon={<FiMapPin />}
          />

          <div className="mt-5">
            <DetailBlock
              theme={theme}
              label="ចំណាំ"
              value={supplier.note || "-"}
              icon={<FiFileText />}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function SectionTitle({ icon, title, subtitle, theme }) {
  return (
    <div className="flex items-start gap-3">
      <div className="summary-icon-3d mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function InfoBox({ label, value, theme, icon }) {
  return (
    <div className={`rounded-xl border p-3 ${theme.softCard}`}>
      <div className="flex items-center gap-2">
        {icon && (
          <span className={`table-icon-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500`}>
            {icon}
          </span>
        )}
        <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      </div>

      <p className="mt-2 text-sm font-semibold leading-6">{value || "-"}</p>
    </div>
  );
}

function DetailBlock({ label, value, theme, icon }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && (
          <span className="table-icon-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            {icon}
          </span>
        )}
        <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      </div>

      <p className="mt-2 text-sm leading-6">{value || "-"}</p>
    </div>
  );
}
