import { FiFileText, FiPackage } from "react-icons/fi";
import { FormSection, InfoLine, ModalShell, SummaryMiniBox } from "./SaleModalShared";

const STATUS_LABEL      = { pending_approval: "រង់ចាំអនុម័ត", approved: "ចាំទំនិញចូលស្តុក", completed: "បញ្ចប់ហើយ", rejected: "បដិសេធ" };
const RESOLUTION_LABEL  = { refund: "សងប្រាក់ជូនអតិថិជន", replacement: "ដូរទំនិញ", store_credit: "ប្រាក់ credit ហាង" };
const RETURN_TYPE_LABEL = { full: "ត្រឡប់ទាំងអស់", partial: "ត្រឡប់មួយចំណែក" };
const VERIFICATION_LABEL = { receipt: "វិក្កយបត្រ", system_lookup: "ស្វែងរកប្រព័ន្ធ", verbal: "មាត់", photo: "រូបថត" };
const CONDITION_LABEL   = { good: "ល្អ", damaged: "ខូច", defective: "មានបញ្ហា", expired: "ផុតកំណត់" };
const CONDITION_COLOR   = { good: "text-emerald-600", damaged: "text-red-500", defective: "text-red-500", expired: "text-amber-600" };
const STOCK_ACTION_LABEL = { restock: "ដាក់ស្តុកត្រឡប់", damaged_write_off: "លុបបំណុលស្តុក", discard: "បោះចោល" };

const fmtUsd = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtKhr = (n) => `៛${Number(n || 0).toLocaleString("en-US")}`;

export default function ViewPendingReturnModal({ theme, salesReturn, onClose }) {
  if (!salesReturn) return null;
  const ret = salesReturn;

  return (
    <ModalShell
      mobileFullScreen
      title={ret.sales_return_no}
      subtitle={`${ret.original_sale_no_snapshot} · ${ret.customer_name_snapshot || "អតិថិជនទូទៅ"} · ${STATUS_LABEL[ret.status] || ret.status}`}
      theme={theme}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoLine label="ប្រភេទដំណោះស្រាយ" value={RESOLUTION_LABEL[ret.resolution_type] || ret.resolution_type} />
          <InfoLine label="ប្រភេទត្រឡប់" value={RETURN_TYPE_LABEL[ret.return_type] || ret.return_type} />
          <InfoLine label="ការផ្ទៀងផ្ទាត់" value={VERIFICATION_LABEL[ret.verification_type] || ret.verification_type} />
          <InfoLine label="ដាក់ស្នើដោយ" value={ret.creator?.name || "-"} />
          <InfoLine label="ដាក់ស្នើនៅ" value={String(ret.created_at || "").slice(0, 16).replace("T", " ")} />
        </div>

        <FormSection title="ទំនិញត្រឡប់" icon={<FiPackage />} theme={theme}>
          <div className="space-y-2">
            {(ret.items || []).map((item) => (
              <div key={item.id} className={`rounded-xl border p-3 ${theme.softCard}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">
                      {item.variant_name_snapshot || item.product_name_snapshot}
                    </p>
                    <p className={`mt-0.5 text-xs ${theme.muted}`}>
                      {item.product_name_snapshot} · {item.unit_name_snapshot} × {Number(item.qty || 0)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{fmtUsd(item.line_total_usd)}</p>
                    <p className={`text-xs ${theme.muted}`}>{fmtKhr(item.line_total_khr)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className={`font-semibold ${CONDITION_COLOR[item.item_condition] || theme.muted}`}>
                    មូលហេតុ: {CONDITION_LABEL[item.item_condition] || item.item_condition}
                  </span>
                  <span className={theme.muted}>
                    ការចាត់ការស្តុក: {STOCK_ACTION_LABEL[item.stock_action] || item.stock_action}
                  </span>
                </div>
                {item.note && (
                  <p className={`mt-1.5 text-xs italic ${theme.muted}`}>{item.note}</p>
                )}
              </div>
            ))}
          </div>
        </FormSection>

        {ret.reason && (
          <FormSection title="មូលហេតុត្រឡប់" icon={<FiFileText />} theme={theme}>
            <p className="text-sm leading-6">{ret.reason}</p>
          </FormSection>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryMiniBox
            theme={theme}
            label="ចំនួនទឹកប្រាក់សរុប"
            value={fmtUsd(ret.total_amount_usd)}
            subValue={fmtKhr(ret.total_amount_khr)}
            strong
          />
        </div>
      </div>
    </ModalShell>
  );
}
