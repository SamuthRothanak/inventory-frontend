import { useState } from "react";
import { FiArrowDown, FiArrowUp, FiChevronDown, FiChevronRight, FiClock, FiDollarSign, FiLayers, FiPackage } from "react-icons/fi";
import {
  ExpiryBadge,
  formatUsdTwoDigits,
  InfoLine,
  InventoryThumb,
  ModalShell,
  SectionTitle,
  StockStatusBadge,
} from "./InventoryCommon";
import { formatMovementTypeKh, translateNote } from "./StockMovementTable";
import { getExpiryInfo, getNearestExpiryInfo } from "../utils/inventoryExpiry";
export default function InventoryDetailModal({
    item,
    theme,
    getStatusClass,
    getVariantStockBreakdown,
    getLowStockThresholdBreakdown,
    onClose,
  }) {
    const stockBreakdown = getVariantStockBreakdown(item);
    const thresholdBreakdown = getLowStockThresholdBreakdown(item);
    const variantType =
      item.baseUnit && !String(item.variantName || "").toLowerCase().includes(String(item.baseUnit).toLowerCase())
        ? `${item.baseUnit.charAt(0).toUpperCase()}${item.baseUnit.slice(1)}`
        : item.baseUnit || "Unit";
    const displayName =
      item.baseUnit && !String(item.variantName || "").toLowerCase().includes(String(item.baseUnit).toLowerCase())
        ? `${item.variantName} ${variantType}`
        : item.variantName;
    const [showDepleted, setShowDepleted] = useState(false);
    const batches = Array.isArray(item.batches) ? item.batches : [];
    const movements = Array.isArray(item.movements) ? item.movements : [];
    const getBatchExpirySortValue = (batch) => {
      if (!batch?.expiredDate || batch.expiredDate === "-") return Number.POSITIVE_INFINITY;
      const time = new Date(batch.expiredDate).getTime();
      return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
    };
    const sortBatchesByFifo = (list) =>
      [...list].sort(
        (a, b) =>
          getBatchExpirySortValue(a) - getBatchExpirySortValue(b) ||
          Number(a.id || 0) - Number(b.id || 0)
      );
    const activeBatches = sortBatchesByFifo(batches.filter((b) => Number(b.qtyRemainingBase) > 0));
    const depletedBatches = sortBatchesByFifo(batches.filter((b) => Number(b.qtyRemainingBase) <= 0));
    const nearestExpiry = getNearestExpiryInfo(activeBatches);
    const nearestExpiryBatch = nearestExpiry?.batch || activeBatches[0] || batches[0];
    const totalRemaining = batches.reduce(
      (total, batch) => total + Number(batch.qtyRemainingBase || 0),
      0
    );
    const baseUnitLabel = item.baseUnit || "base unit";
    const formatUsd = formatUsdTwoDigits;
    const truncateBatchNo = (batchNo) => {
      if (!batchNo) return "-";
      const parts = String(batchNo).split("-");
      if (parts.length <= 4) return batchNo;
      return `${parts.slice(0, 3).join("-")}-…${parts[parts.length - 1]}`;
    };
    const formatUnitCost = (value) => `${formatUsdTwoDigits(value)} / ${baseUnitLabel}`;

    return (
      <ModalShell
        title={displayName}
        subtitle={`${item.variantCode || "គ្មានកូដ"} - ${item.productName || "គ្មានផលិតផល"}${item.category && item.category !== "-" ? ` - ${item.category}` : ""}`}
        theme={theme}
        onClose={onClose}
        footer={
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បិទ
          </button>
        }
      >
        <div className="space-y-5">
          <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <InventoryThumb item={item} />

                <div className="min-w-0">
                  <p className="text-lg font-bold">{displayName}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                      {item.variantCode || "គ្មានកូដ"}
                    </span>

                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500">
                      {variantType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4 xl:min-w-[560px]">
                <InfoLine label="ផលិតផល" value={item.productName} />
                <InfoLine label="ប្រភេទ" value={item.category || "-"} />
                <InfoLine label="ខ្នាតមូលដ្ឋាន" value={item.baseUnit} />
                <InfoLine
                  label="ជូនដំណឹងស្តុក"
                  value={
                    thresholdBreakdown.convertedTexts.length > 0
                      ? thresholdBreakdown.convertedTexts.map((c) => c.text).join(" / ")
                      : thresholdBreakdown.baseText
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
                <p className={`text-xs font-semibold uppercase ${theme.muted}`}>ស្តុកបច្ចុប្បន្ន</p>
                <p className="mt-2 text-2xl font-bold">{stockBreakdown.baseText}</p>

                <div className="mt-3">
                  <StockStatusBadge status={item.status} getStatusClass={getStatusClass} />
                </div>
              </div>

              <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
                <p className={`text-xs font-semibold uppercase ${theme.muted}`}>Batch មានស្តុក</p>
                <p className="mt-2 text-2xl font-bold">
                  {Number(totalRemaining).toLocaleString()} {item.baseUnit}
                </p>

                <p className={`mt-2 text-xs ${theme.muted}`}>
                  {activeBatches.length} Batch មានស្តុក
                </p>
              </div>

              <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
                <p className={`text-xs font-semibold uppercase ${theme.muted}`}>ថ្ងៃផុតកំណត់ជិតបំផុត</p>
                <p className="mt-2 text-2xl font-bold">{nearestExpiryBatch?.expiredDate || "-"}</p>

                <div className="mt-2">
                  <ExpiryBadge info={nearestExpiry?.info} showAll />
                </div>

                <p className={`mt-2 text-xs ${theme.muted}`}>
                  តម្លៃខ្នាត {formatUnitCost(item.unitCostBase || nearestExpiryBatch?.unitCostBase || 0)}
                </p>
              </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
            <SectionTitle
              icon={<FiLayers />}
              title="ខ្នាត"
              subtitle="ការបំប្លែងខ្នាតទិញ និងខ្នាតមូលដ្ឋានសម្រាប់ប្រភេទនេះ"
              theme={theme}
            />

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {item.units.map((unit) => (
                <div
                  key={unit.unitName}
                  className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                >
                  <p className={`text-xs font-semibold uppercase ${theme.muted}`}>
                    {unit.isBaseUnit ? "ខ្នាតមូលដ្ឋាន" : "ខ្នាតបំប្លែង"}
                  </p>

                  <p className="mt-2 font-bold">
                    {unit.unitName} = {unit.conversionQty} {item.baseUnit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiPackage />}
                title="Batch ស្តុក"
                subtitle="តាមដាន Batch ស្តុកតាមលំដាប់ថ្ងៃផុតកំណត់"
                theme={theme}
              />

              {/* Active Batches */}
              <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-white/10 dark:bg-white/5">
                  <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    Batch មានស្តុក
                  </span>
                  <span className={`text-xs font-semibold ${theme.muted}`}>{activeBatches.length} Batch</span>
                </div>
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="w-[44%] px-4 py-3 text-left">Batch</th>
                      <th className="w-[18%] px-4 py-3 text-left">ថ្ងៃផុតកំណត់</th>
                      <th className="w-[18%] px-4 py-3 text-left">នៅសល់</th>
                      <th className="w-[20%] px-4 py-3 text-left">តម្លៃ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatches.length > 0 ? activeBatches.map((batch) => (
                      <tr key={batch.id || batch.batchNo} className="border-t border-zinc-200 dark:border-white/10">
                        <td className="px-4 py-4">
                          <p className="font-semibold" title={batch.batchNo}>{truncateBatchNo(batch.batchNo)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className={`truncate text-xs ${theme.muted}`}>Lot {batch.lotNo || "-"}</p>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">ដំណើរការ</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p>{batch.expiredDate || "-"}</p>
                          <div className="mt-1.5">
                            <ExpiryBadge info={getExpiryInfo(batch.expiredDate)} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{Number(batch.qtyRemainingBase).toLocaleString()}</p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>{baseUnitLabel}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{formatUsdTwoDigits(batch.unitCostBase)}</p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>ក្នុង {baseUnitLabel} · {formatUsd(Number(batch.qtyRemainingBase || 0) * Number(batch.unitCostBase || 0))}</p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className={`px-4 py-6 text-center text-sm ${theme.muted}`}>គ្មាន Batch ដំណើរការ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Depleted Batches — collapsed by default */}
              {depletedBatches.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowDepleted((prev) => !prev)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:opacity-80 ${theme.softCard}`}
                  >
                    <div className="flex items-center gap-2">
                      {showDepleted ? <FiChevronDown className="text-sm" /> : <FiChevronRight className="text-sm" />}
                      <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                        Batch អស់ស្តុក
                      </span>
                    </div>
                    <span className={`rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[11px] font-semibold ${theme.muted}`}>
                      {depletedBatches.length} Batch
                    </span>
                  </button>

                  {showDepleted && (
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-zinc-600 text-white">
                        <tr>
                          <th className="w-[44%] px-4 py-3 text-left">Batch</th>
                          <th className="w-[18%] px-4 py-3 text-left">ថ្ងៃផុតកំណត់</th>
                          <th className="w-[18%] px-4 py-3 text-left">នៅសល់</th>
                          <th className="w-[20%] px-4 py-3 text-left">តម្លៃ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depletedBatches.map((batch) => (
                          <tr key={batch.id || batch.batchNo} className={`border-t border-zinc-200 opacity-60 dark:border-white/10`}>
                            <td className="px-4 py-4">
                              <p className="font-semibold" title={batch.batchNo}>{truncateBatchNo(batch.batchNo)}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <p className={`truncate text-xs ${theme.muted}`}>Lot {batch.lotNo || "-"}</p>
                                <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">អស់ស្តុក</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">{batch.expiredDate || "-"}</td>
                            <td className="px-4 py-4">
                              <p className="font-semibold">0</p>
                              <p className={`mt-1 text-xs ${theme.muted}`}>{baseUnitLabel}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold">{formatUsdTwoDigits(batch.unitCostBase)}</p>
                              <p className={`mt-1 text-xs ${theme.muted}`}>ក្នុង {baseUnitLabel} · $0.00</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiClock />}
                title="ចលនាស្តុកថ្មីៗ"
                subtitle="ស្តុកចូល ស្តុកចេញ និងការកែតម្រូវចុងក្រោយ"
                theme={theme}
              />

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {movements.length > 0 ? (
                  movements.slice(0, 6).map((movement, index) => {
                    const isIn = Number(movement.qtyBase) >= 0;
                    const iconBg = isIn ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500";
                    const qtyColor = isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-500";
                    const d = movement.createdAt ? new Date(String(movement.createdAt).replace(" ", "T")) : null;
                    const dateStr = d && !isNaN(d) ? d.toLocaleDateString("en-CA") : movement.createdAt || "-";
                    const timeStr = d && !isNaN(d) ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) : "";
                    return (
                      <div key={`${movement.type}-${index}`} className={`rounded-xl border p-3 ${theme.softCard}`}>
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                            {isIn ? <FiArrowUp /> : <FiArrowDown />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 text-sm font-semibold leading-5">
                                {formatMovementTypeKh(movement.type)}
                              </p>
                              <p className={`shrink-0 text-sm font-bold ${qtyColor}`}>
                                {isIn ? "+" : ""}{Number(movement.qtyBase).toLocaleString()} {baseUnitLabel}
                              </p>
                            </div>

                            <p className={`mt-1 text-xs ${theme.muted}`}>
                              {dateStr}{timeStr && <span className="ml-1">{timeStr}</span>}
                            </p>

                            <p className="mt-2 inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-semibold text-purple-500">
                              {(() => {
                                const ref = movement.referenceLabel || movement.refType || "";
                                const translated = ref.replace(/^purchase\s+#(\d+)$/i, "ការទិញ #$1").replace(/^sale\s+#(\d+)$/i, "ការលក់ #$1").replace(/^adjustment\s+#(\d+)$/i, "ការកែតម្រូវ #$1");
                                return translated || "គ្មានតំណភ្ជាប់";
                              })()}
                              {movement.sourcePurchaseNo ? ` · ${movement.sourcePurchaseNo}` : ""}
                            </p>

                            {(movement.batchNo || movement.lotNo) && (
                              <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>
                                Batch: {truncateBatchNo(movement.batchNo)}
                                {movement.lotNo ? ` · Lot ${movement.lotNo}` : ""}
                              </p>
                            )}

                            <p className={`mt-2 line-clamp-2 text-xs leading-5 ${theme.muted}`}>
                              {translateNote(movement.note) || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={`rounded-xl border border-dashed p-6 text-center text-sm lg:col-span-2 ${theme.softCard}`}>
                    <p className={theme.muted}>គ្មានចលនាស្តុកនៅឡើយ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }


