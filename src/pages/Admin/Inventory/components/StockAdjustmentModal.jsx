import { FiClipboard, FiFileText, FiHash, FiInfo, FiLayers, FiPackage, FiSave, FiTag, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { stockInReasons, stockOutReasons } from "../utils/inventoryConstants";
import { FormInput, FormSelect, FormTextarea, ModalShell, SectionTitle } from "./InventoryCommon";
export default function StockAdjustmentModal({
    mode,
    inventory,
    selectedItem,
    form,
    errors,
    theme,
    onChange,
    onClose,
    onSave,
    isSaving = false,
  }) {
    const isStockIn = mode === "adjustment_in";
    const title = isStockIn ? "ការកែតម្រូវស្តុក" : "ស្តុកចេញ";
    const reasonOptions = isStockIn ? stockInReasons : stockOutReasons;
    const subtitle = isStockIn
      ? "ប្រើសម្រាប់រាប់ស្តុក ឬការកែតម្រូវ — មិនមែនស្តុកចូលពីការទិញទេ។"
      : "ប្រើសម្រាប់ទំនិញខូច, ផុតកំណត់, ដកប្រើប្រាស់ខ្លួនឯង, បាត់ ឬការកែតម្រូវ។";

    const activeItem =
      selectedItem ||
      inventory.find((item) => String(item.id) === String(form.inventoryId));

    const selectedUnit = activeItem?.units.find(
      (unit) => unit.unitName === form.unitName
    );

    const previewBaseQty =
      Number(form.qty || 0) * Number(selectedUnit?.conversionQty || 1);

    const truncateBatchNo = (batchNo) => {
      if (!batchNo) return "-";
      const parts = String(batchNo).split("-");
      if (parts.length <= 4) return batchNo;
      return `${parts.slice(0, 3).join("-")}-…${parts[parts.length - 1]}`;
    };
    const REASON_EXAMPLE = {
      stock_count: {
        title: "រាប់ស្តុកពិតប្រាកដ — របៀបប្រើ",
        desc: "ចូលឃ្លាំង រាប់ចំនួនដោយដៃ ហើយប្រៀបជាមួយប្រព័ន្ធ។",
        steps: [
          "① ប្រព័ន្ធបង្ហាញ: 2,699 កំប៉ុង",
          "② រាប់ឃ្លាំងពិតប្រាកដ: 2,650 កំប៉ុង",
          "③ ប្រព័ន្ធលើស 49 → បញ្ចូល −49",
        ],
      },
      correction: {
        title: "ការកែតម្រូវ — របៀបប្រើ",
        desc: "ប្រើពេលការបញ្ចូលក្នុងប្រព័ន្ធខុស ហើយចង់កែត្រឡប់ឲត្រូវ។",
        steps: [
          "① ការទិញបញ្ចូល +1,000 ខុស (គួរជា +100)",
          "② ស្តុកលើស 900 → កែ −900",
          "③ មូលហេតុ: ការកែតម្រូវ + កំណត់ចំណាំ: ពន្យល់ការបញ្ចូលខុស",
        ],
      },
      damaged: {
        title: "ខូចខាត — របៀបប្រើ",
        desc: "ប្រើពេលទំនិញខូច ឬប្រើប្រាស់មិនបាន ត្រូវដកចេញពីស្តុក។",
        steps: [
          "① ដប 10 ធ្លាក់ខូចពីការដឹកជញ្ជូន",
          "② បញ្ចូល −10 + មូលហេតុ: ខូចខាត",
          "③ កំណត់ចំណាំ: ដប 10 ខូច — ដឹកជញ្ជូន 23/06/2026",
        ],
      },
      expired: {
        title: "ផុតកំណត់ — របៀបប្រើ",
        desc: "ប្រើពេលបាច់ណាមួយផុតកំណត់ ហើយត្រូវដកចេញពីស្តុក។",
        steps: [
          "① បាច់ B2024 ផុតថ្ងៃ 01/01/2025 — មាន 50 ដប",
          "② ជ្រើសបាច់ត្រឹមត្រូវ → បញ្ចូល −50",
          "③ កំណត់ចំណាំ: បាច់ B2024 ផុតកំណត់",
        ],
      },
      internal_use: {
        title: "ដកប្រើប្រាស់ខ្លួនឯង — របៀបប្រើ",
        desc: "ប្រើពេលក្រុមហ៊ុនដកទំនិញប្រើប្រាស់ខ្លួនឯង (មិនមែនលក់)។",
        steps: [
          "① ប្រជុំ — ដកស្រា 10 ដបប្រើក្នុងការិយាល័យ",
          "② បញ្ចូល −10 + មូលហេតុ: ដកប្រើប្រាស់ខ្លួនឯង",
          "③ កំណត់ចំណាំ: ប្រើក្នុងប្រជុំ ថ្ងៃ 23/06/2026",
        ],
      },
      lost: {
        title: "បាត់ — របៀបប្រើ",
        desc: "ប្រើពេលទំនិញបាត់ក្នុងឃ្លាំង ឬកំឡុងការដឹក ស្វែងរកមិនឃើញ។",
        steps: [
          "① ត្រួតពិនិត្យឃ្លាំង — ស្រា 5 ដបបាត់",
          "② បញ្ចូល −5 + មូលហេតុ: បាត់",
          "③ កំណត់ចំណាំ: ត្រួតពិនិត្យ កាមេរ៉ាសុវត្ថិភាព + របាយការណ៍ធ្វើហើយ",
        ],
      },
      other: {
        title: "ផ្សេងទៀត — របៀបប្រើ",
        desc: "ប្រើពេលហេតុផលខុសពីប្រភេទទាំងអស់ខាងលើ។",
        steps: [
          "① ពន្យល់ច្បាស់ក្នុងប្រអប់ កំណត់ចំណាំ",
          "② អ្នកគ្រប់គ្រងនឹងពិនិត្យ ហើយអនុម័ត",
        ],
      },
    };

    const NOTE_PLACEHOLDER = {
      stock_count: "ឧ. រាប់ស្តុកថ្ងៃទី 23/06/2026 — ឃើញ 2,650 កំប៉ុង តែប្រព័ន្ធបង្ហាញ 2,699",
      correction: "ឧ. កែការបញ្ចូលខុស — បានបញ្ចូលចំនួន 100 ខុស គួរជា 10",
      damaged: "ឧ. ទំនិញខូចខាតពីការដឹកជញ្ជូន — ធ្លាក់ 10 ដប",
      expired: "ឧ. ផុតកំណត់ប្រើប្រាស់ — បាច់ B2024 ផុតថ្ងៃ 01/01/2025",
      internal_use: "ឧ. ដកប្រើប្រាស់ក្នុងការិយាល័យ — ប្រជុំថ្ងៃទី 20 មិថុនា",
      lost: "ឧ. ទំនិញបាត់ក្នុងឃ្លាំង — ត្រួតពិនិត្យ កាមេរ៉ាសុវត្ថិភាព រួចហើយ",
      other: "ឧ. ពន្យល់ពីហេតុផលនៃការកែតម្រូវ...",
    };
    const notePlaceholder = NOTE_PLACEHOLDER[form.reason] || "មូលហេតុ ឬកំណត់ចំណាំ...";

    const batchOptions = [
      { value: "", label: "គ្មានបាច់" },
      ...(activeItem?.batches || [])
        .filter((batch) => Number(batch.qtyRemainingBase || 0) > 0)
        .map((batch) => ({
          value: batch.id,
          label: `${truncateBatchNo(batch.batchNo)} · ${Number(batch.qtyRemainingBase).toLocaleString()} ${activeItem.baseUnit} · Exp: ${batch.expiredDate || "-"}`,
        })),
    ];

    return (
      <ModalShell
        title={title}
        subtitle={subtitle}
        theme={theme}
        onClose={onClose}
        width="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              បោះបង់
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm ${
                isStockIn
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-500 hover:bg-red-600"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <FiSave />
              {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SectionTitle
            icon={isStockIn ? <FiTrendingUp /> : <FiTrendingDown />}
            title="ព័ត៌មានការកែតម្រូវ"
            subtitle="បង្កើតការកែតម្រូវស្តុក និងចលនាស្តុកដោយស្វ័យប្រវត្តិ។"
            theme={theme}
          />

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="ទំនិញស្តុក"
                value={form.inventoryId}
                error={errors.inventoryId}
                onChange={(value) => {
                  const item = inventory.find(
                    (inventoryItem) => String(inventoryItem.id) === String(value)
                  );

                  onChange("inventoryId", value);
                  onChange("unitName", item?.baseUnit || "");
                  onChange("inventoryBatchId", "");
                }}
                theme={theme}
                icon={<FiPackage />}
                options={[
                  { value: "", label: "ជ្រើសទំនិញ" },
                  ...inventory.map((item) => ({
                    value: item.id,
                    label: item.variantName,
                  })),
                ]}
                disabled={Boolean(selectedItem)}
                searchable={!selectedItem}
              />

              <FormSelect
                label="មូលហេតុ"
                value={form.reason}
                error={errors.reason}
                onChange={(value) => onChange("reason", value)}
                theme={theme}
                icon={<FiTag />}
                options={reasonOptions}
                searchable={reasonOptions.length > 6}
              />

              <FormSelect
                label="ខ្នាតទំនិញ"
                value={form.unitName}
                error={errors.unitName}
                onChange={(value) => onChange("unitName", value)}
                theme={theme}
                icon={<FiLayers />}
                options={
                  activeItem
                    ? activeItem.units.map((unit) => ({
                        value: unit.unitName,
                        label: unit.unitName,
                      }))
                    : [{ value: "", label: "ជ្រើសខ្នាតទំនិញ" }]
                }
                searchable={Number(activeItem?.units?.length || 0) > 6}
              />

              <FormInput
                label="ចំនួន"
                type="number"
                value={form.qty}
                error={errors.qty}
                onChange={(value) => onChange("qty", value)}
                theme={theme}
                placeholder="បញ្ចូលចំនួន"
                icon={<FiHash />}
              />

              <FormSelect
                label="បាច់ / លេខបាច់"
                value={form.inventoryBatchId}
                onChange={(value) => onChange("inventoryBatchId", value)}
                theme={theme}
                icon={<FiClipboard />}
                options={batchOptions}
                searchable
              />

              <div className={`rounded-xl border p-3 text-sm ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>
                  ចំនួនគណនាជាមូលដ្ឋាន
                </p>
                <p className="mt-1 text-lg font-bold">
                  {Number(previewBaseQty || 0).toLocaleString()} {activeItem?.baseUnit || "មូលដ្ឋាន"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <FormTextarea
                label="កំណត់ចំណាំ"
                value={form.note}
                onChange={(value) => onChange("note", value)}
                theme={theme}
                placeholder={notePlaceholder}
                icon={<FiFileText />}
              />
            </div>
          </div>

          {form.reason && REASON_EXAMPLE[form.reason] && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <FiInfo size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    {REASON_EXAMPLE[form.reason].title}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-300">
                    {REASON_EXAMPLE[form.reason].desc}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {REASON_EXAMPLE[form.reason].steps.map((step, i) => (
                      <li key={i} className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeItem && (
            <>
              <SectionTitle
                icon={<FiInfo />}
                title="មើលស្តុកបច្ចុប្បន្ន"
                subtitle="ពិនិត្យស្តុកមុនពេលរក្សាទុក។"
                theme={theme}
              />

              <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
                <p className="text-sm font-semibold">{activeItem.variantName}</p>

                <p className="mt-2 text-3xl font-bold">
                  {Number(activeItem.stockBaseQty).toLocaleString()} {activeItem.baseUnit}
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  ស្ថានភាពបច្ចុប្បន្ន: {activeItem.status}
                </p>
              </div>
            </>
          )}
        </div>
      </ModalShell>
    );
  }


