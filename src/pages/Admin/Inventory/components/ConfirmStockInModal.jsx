import { useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { formatUsdTwoDigits, ModalShell } from "./InventoryCommon";

const getStockInItemIdentity = (item, index) => {
  if (item.purchaseReturnItemId) return `return-${item.purchaseReturnItemId}`;
  if (item.purchaseItemId) return `purchase-${item.purchaseItemId}`;

  return [
    item.productVariantUnitId,
    item.productVariantId,
    item.variantCode,
    item.variantName,
    item.expiredDate,
    index,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join("-");
};

const getLotInputKey = (purchaseId, item, index) =>
  `${purchaseId}-${getStockInItemIdentity(item, index)}-lot`;

const getStockInRowKey = (purchaseId, item, index) =>
  `${purchaseId}-${getStockInItemIdentity(item, index)}-row`;

export default function ConfirmStockInModal({
  pendingPurchases = [],
  theme,
  onClose,
  onConfirm,
  isConfirming = false,
}) {
  const [lotNumbers, setLotNumbers] = useState({});
  const [confirmingPurchase, setConfirmingPurchase] = useState(null);
  const wasConfirmingRef = useRef(false);

  useEffect(() => {
    if (wasConfirmingRef.current && !isConfirming) {
      setConfirmingPurchase(null);
    }
    wasConfirmingRef.current = isConfirming;
  }, [isConfirming]);

  const getConfirmPayload = (purchase) => ({
    items: purchase.items.map((item, index) => ({
      purchase_item_id: item.purchaseItemId,
      purchase_return_item_id: item.purchaseReturnItemId || null,
      lot_no:
        lotNumbers[getLotInputKey(purchase.id, item, index)]?.trim() || null,
      expired_date:
        item.expiredDate && item.expiredDate !== "-" ? item.expiredDate : null,
    })),
  });

  return (
    <>
      <ModalShell
        title="បញ្ជាក់ស្តុកចូល"
        subtitle="បញ្ជាក់ទំនិញទិញដែលទទួលបានមុននឹងបន្ថែមទៅ Batch ស្តុក ចលនាស្តុក និងសមតុល្យ"
        theme={theme}
        onClose={onClose}
        width="max-w-6xl"
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
        {pendingPurchases.length === 0 ? (
          <div
            className={`rounded-2xl border p-8 text-center ${theme.section}`}
          >
            <FiCheckCircle className="mx-auto text-5xl text-emerald-500" />

            <p className="mt-4 text-sm font-semibold">
              គ្មានការទិញរង់ចាំស្តុកចូល
            </p>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              នៅពេលការទិញត្រៀមទទួល វានឹងបង្ហាញនៅទីនេះ
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">
                        {purchase.purchaseNo}
                      </h3>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {purchase.status}
                      </span>
                    </div>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      {purchase.supplierName} · {purchase.purchaseDate} ·{" "}
                      {purchase.totalItems} ទំនិញ
                    </p>

                    {purchase.note && (
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {purchase.note}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={() => setConfirmingPurchase(purchase)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConfirming ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiCheckCircle />
                    )}
                    {isConfirming ? "កំពុងបញ្ជាក់..." : "បញ្ជាក់ស្តុកចូល"}
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                  <table className="w-full min-w-[1080px] text-sm">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left">ផលិតផល / ប្រភេទ</th>
                        <th className="px-3 py-3 text-left">ប្រភេទ</th>
                        <th className="px-3 py-3 text-left">ខ្នាតទិញ</th>
                        <th className="px-3 py-3 text-left">ចំនួនទទួល</th>
                        <th className="px-3 py-3 text-left">ចំនួនមូលដ្ឋាន</th>
                        <th className="px-3 py-3 text-left">តម្លៃខ្នាត</th>
                        <th className="px-3 py-3 text-left">Lot</th>
                        <th className="px-3 py-3 text-left">ថ្ងៃផុតកំណត់</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Do not merge by expiry date. Different purchase lines can share the same expired date. */}
                      {purchase.items.map((item, index) => {
                        const conversionQty = Number(item.conversionQty || 1);
                        const baseDisplayUnit = item.baseUnit || "";
                        const rawVariantName =
                          item.variantName || item.productName || "-";
                        const variantDisplayName =
                          baseDisplayUnit &&
                          rawVariantName !== "-" &&
                          !rawVariantName
                            .toLowerCase()
                            .includes(baseDisplayUnit.toLowerCase())
                            ? `${rawVariantName} ${baseDisplayUnit.charAt(0).toUpperCase()}${baseDisplayUnit.slice(1)}`
                            : rawVariantName;
                        const conversionText =
                          item.unitName && item.baseUnit
                            ? `${item.unitName} = ${conversionQty.toLocaleString()} ${item.baseUnit}`
                            : "គ្មានការបំប្លែងខ្នាត";
                        const unitBadge = baseDisplayUnit
                          ? `${baseDisplayUnit.charAt(0).toUpperCase()}${baseDisplayUnit.slice(1)}`
                          : "Unit";
                        const lotInputKey = getLotInputKey(
                          purchase.id,
                          item,
                          index,
                        );

                        return (
                          <tr
                            key={getStockInRowKey(purchase.id, item, index)}
                            className="border-t border-zinc-200 dark:border-white/10"
                          >
                            <td className="px-3 py-3">
                              <p className="font-semibold">
                                {variantDisplayName}
                              </p>

                              {item.variantCode && (
                                <span className="mt-1 inline-flex max-w-full rounded-full border border-zinc-300 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                                  <span className="truncate">
                                    {item.variantCode}
                                  </span>
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-3">
                              <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500">
                                {unitBadge}
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`text-xs font-semibold ${theme.muted}`}
                              >
                                {conversionText}
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              {Number(item.qty).toLocaleString()}{" "}
                              {item.unitName}
                            </td>

                            <td className="px-3 py-3">
                              {Number(item.baseQty).toLocaleString()}{" "}
                              {item.baseUnit || "ខ្នាតមូលដ្ឋាន"}
                            </td>

                            <td className="px-3 py-3">
                              {formatUsdTwoDigits(item.unitCostBase)}
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={lotNumbers[lotInputKey] || ""}
                                onChange={(event) =>
                                  setLotNumbers((previous) => ({
                                    ...previous,
                                    [lotInputKey]: event.target.value,
                                  }))
                                }
                                placeholder="ស្រេចចិត្ត"
                                className={`h-10 w-40 rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
                              />
                            </td>

                            <td className="px-3 py-3">
                              {item.expiredDate || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalShell>

      {(confirmingPurchase || isConfirming) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isConfirming && setConfirmingPurchase(null)}
          />
          <div
            className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${theme.card}`}
          >
            {isConfirming && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/40 backdrop-blur-sm">
                <FiRefreshCw className="animate-spin text-3xl text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">
                  កំពុងដំណើរការ...
                </p>
              </div>
            )}

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <FiAlertTriangle className="text-2xl text-emerald-500" />
            </div>
            <h3 className="text-base font-bold">បញ្ជាក់ស្តុកចូល</h3>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              ស្តុក{" "}
              <span className="font-semibold text-emerald-500">
                {confirmingPurchase?.purchaseNo}
              </span>{" "}
              នឹងត្រូវបន្ថែមទៅស្តុក។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={isConfirming}
                onClick={() => setConfirmingPurchase(null)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:opacity-80 disabled:opacity-40 ${theme.card}`}
              >
                <FiX /> បោះបង់
              </button>
              <button
                type="button"
                disabled={isConfirming}
                onClick={() =>
                  onConfirm(
                    confirmingPurchase,
                    getConfirmPayload(confirmingPurchase),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {isConfirming ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiCheckCircle />
                )}
                {isConfirming ? "កំពុងបញ្ជាក់..." : "បញ្ជាក់"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
