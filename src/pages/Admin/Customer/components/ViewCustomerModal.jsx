import {
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiHash,
  FiInfo,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import { ModalShell } from "./CustomerFormModal";

export default function ViewCustomerModal({ customer, theme, onClose, onEdit }) {
  return (
    <ModalShell
      title={customer.shopName}
      subtitle={`${customer.customerCode} · អតិថិជនសម្រាប់កត់ត្រាការលក់`}
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
            កែអតិថិជន
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionTitle
          icon={<FiInfo />}
          title="ព័ត៌មានអតិថិជន"
          subtitle="ព័ត៌មានសំខាន់ និងស្ថានភាពបច្ចុប្បន្ន។"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBox
              theme={theme}
              label="លេខកូដអតិថិជន"
              value={customer.customerCode}
              icon={<FiHash />}
            />

            <InfoBox
              theme={theme}
              label="ឈ្មោះហាង"
              value={customer.shopName}
              icon={<FiShoppingBag />}
            />

            <InfoBox
              theme={theme}
              label="ឈ្មោះអ្នកទំនាក់ទំនង"
              value={customer.contactName || "-"}
              icon={<FiUser />}
            />

            <InfoBox
              theme={theme}
              label="លេខទូរស័ព្ទ"
              value={customer.phone || "-"}
              icon={<FiPhone />}
            />

            <InfoBox
              theme={theme}
              label="ស្ថានភាព"
              value={customer.status === "Active" ? "ដំណើរការ" : "មិនដំណើរការ"}
              icon={
                customer.status === "Active" ? <FiCheckCircle /> : <FiXCircle />
              }
            />

            <InfoBox
              theme={theme}
              label="បង្កើតនៅ"
              value={customer.createdAt}
              icon={<FiFileText />}
            />

            <InfoBox
              theme={theme}
              label="បានកែនៅ"
              value={customer.updatedAt}
              icon={<FiFileText />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiMapPin />}
          title="អាសយដ្ឋាន និងចំណាំ"
          subtitle="ព័ត៌មានបន្ថែមសម្រាប់ដឹកជញ្ជូន ឬកត់សម្គាល់។"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <DetailBlock
            theme={theme}
            label="អាសយដ្ឋាន"
            value={customer.address || "-"}
            icon={<FiMapPin />}
          />

          <div className="mt-5">
            <DetailBlock
              theme={theme}
              label="ចំណាំ"
              value={customer.note || "-"}
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
        {icon && <span className="table-icon-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">{icon}</span>}
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
        {icon && <span className="table-icon-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">{icon}</span>}
        <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      </div>

      <p className="mt-2 text-sm leading-6">{value || "-"}</p>
    </div>
  );
}
