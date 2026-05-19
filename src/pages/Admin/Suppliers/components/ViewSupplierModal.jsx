import {
  FiCheckCircle,
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

export default function ViewSupplierModal({ supplier, theme, onClose, onEdit }) {
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
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiEdit2 />
            Edit Supplier
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionTitle
          icon={<FiInfo />}
          title="Supplier Information"
          subtitle="Main supplier profile and current status."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBox
              theme={theme}
              label="Supplier Code"
              value={supplier.supplierCode}
              icon={<FiHash />}
            />

            <InfoBox
              theme={theme}
              label="Supplier Name"
              value={supplier.name}
              icon={<FiTruck />}
            />

            <InfoBox
              theme={theme}
              label="Contact Person"
              value={supplier.contactPerson || "-"}
              icon={<FiUser />}
            />

            <InfoBox
              theme={theme}
              label="Phone"
              value={supplier.phone || "-"}
              icon={<FiPhone />}
            />

            <InfoBox
              theme={theme}
              label="Email"
              value={supplier.email || "-"}
              icon={<FiMail />}
            />

            <InfoBox
              theme={theme}
              label="Status"
              value={supplier.status}
              icon={
                supplier.status === "Active" ? <FiCheckCircle /> : <FiXCircle />
              }
            />

            <InfoBox
              theme={theme}
              label="Created At"
              value={supplier.createdAt}
              icon={<FiFileText />}
            />

            <InfoBox
              theme={theme}
              label="Updated At"
              value={supplier.updatedAt}
              icon={<FiFileText />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiMapPin />}
          title="Address & Note"
          subtitle="Delivery location and supplier remarks."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <DetailBlock
            theme={theme}
            label="Address"
            value={supplier.address || "-"}
            icon={<FiMapPin />}
          />

          <div className="mt-5">
            <DetailBlock
              theme={theme}
              label="Note"
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
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
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
        {icon && <span className={theme.muted}>{icon}</span>}
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
        {icon && <span className={theme.muted}>{icon}</span>}
        <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      </div>

      <p className="mt-2 text-sm leading-6">{value || "-"}</p>
    </div>
  );
}