import { FiClock, FiDollarSign, FiLayers, FiPackage, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { InfoLine, InventoryThumb, ModalShell, SectionTitle, StockStatusBadge } from "./InventoryCommon";
import { formatMovementTypeKh } from "./StockMovementTable";
export default function ViewInventoryModal({
    item,
    theme,
    getStatusClass,
    getVariantStockBreakdown,
    onClose,
  }) {
    const stockBreakdown = getVariantStockBreakdown(item);

    return (
      <ModalShell
        title={item.variantName}
        subtitle={`${item.variantCode} · ${item.productName} · ${item.category}`}
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
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
            <InventoryThumb item={item} size="large" />

            <div className="mt-4 space-y-3 text-sm">
              <InfoLine label="ផលិតផល" value={item.productName} />
              <InfoLine label="កូដប្រភេទ" value={item.variantCode} />
              <InfoLine label="ប្រភេទ" value={item.category} />
              <InfoLine label="ខ្នាតមូលដ្ឋាន" value={item.baseUnit} />
              <InfoLine
                label="ជូនដំណឹងស្តុកទាប"
                value={thresholdBreakdown?.baseText}
              />
              {thresholdBreakdown?.convertedTexts?.length > 0 && (
                <InfoLine
                  label="ការគ្រប់គ្រងដែនកំណត់"
                  value={thresholdBreakdown.convertedTexts.map((converted) => converted.text).join(" / ")}
                />
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-bold">ស្តុកបច្ចុប្បន្ន</h3>

                  <p className={`mt-1 text-sm ${theme.muted}`}>
                    ស្តុករក្សាទុកតាមខ្នាតមូលដ្ឋាន
                  </p>
                </div>

                <StockStatusBadge
                  status={item.status}
                  getStatusClass={getStatusClass}
                />
              </div>

              <p className="mt-4 text-3xl font-bold">
                {stockBreakdown.baseText}
              </p>

              {stockBreakdown.convertedTexts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {stockBreakdown.convertedTexts.map((converted) => (
                    <span
                      key={converted.unitName}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      ≈ {converted.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiLayers />}
                title="ខ្នាត"
                subtitle="ខ្នាតបំប្លែងសម្រាប់ទំនិញស្តុកនេះ"
                theme={theme}
              />

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {item.units.map((unit) => (
                  <div
                    key={unit.unitName}
                    className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                  >
                    <p className="font-semibold">
                      {unit.unitName} = {unit.conversionQty} {item.baseUnit}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {unit.isBaseUnit ? "ខ្នាតមូលដ្ឋាន" : "ខ្នាតបំប្លែង"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiPackage />}
                title="Batch ស្តុក"
                subtitle="តាមដាន Batch ស្តុក និងថ្ងៃផុតកំណត់"
                theme={theme}
              />

              <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left">Batch</th>
                      <th className="px-3 py-3 text-left">Lot</th>
                      <th className="px-3 py-3 text-left">ថ្ងៃផុតកំណត់</th>
                      <th className="px-3 py-3 text-left">នៅសល់</th>
                      <th className="px-3 py-3 text-left">តម្លៃ</th>
                      <th className="px-3 py-3 text-left">ស្ថានភាព</th>
                    </tr>
                  </thead>

                  <tbody>
                    {item.batches.length > 0 ? (
                      item.batches.map((batch) => (
                        <tr
                          key={batch.id || batch.batchNo}
                          className="border-t border-zinc-200 dark:border-white/10"
                        >
                          <td className="px-3 py-3">{batch.batchNo}</td>
                          <td className="px-3 py-3">{batch.lotNo || "-"}</td>
                          <td className="px-3 py-3">
                            {batch.expiredDate || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {Number(batch.qtyRemainingBase).toLocaleString()} {item.baseUnit}
                          </td>
                          <td className="px-3 py-3">
                            ${Number(batch.unitCostBase).toFixed(3)}
                          </td>
                          <td className="px-3 py-3 capitalize">{batch.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-3 py-8 text-center text-zinc-500">
                          គ្មាន Batch ដំណើរការ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiClock />}
                title="ចលនាស្តុកថ្មីៗ"
                subtitle="ស្តុកចូល ស្តុកចេញ និងការកែតម្រូវចុងក្រោយ"
                theme={theme}
              />

              <div className="mt-4 space-y-3">
                {item.movements.length > 0 ? (
                  item.movements.map((movement, index) => (
                    <div
                      key={`${movement.type}-${index}`}
                      className={`flex items-start justify-between gap-4 rounded-xl border p-3 ${theme.softCard}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                          <FiClock />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {formatMovementTypeKh(movement.type)}
                          </p>

                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            {movement.note || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {Number(movement.qtyBase).toLocaleString()} {item.baseUnit}
                        </p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {movement.createdAt}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${theme.muted}`}>
                    គ្មានចលនាស្តុកនៅឡើយ
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }


