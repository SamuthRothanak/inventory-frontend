import {
  FiCheckCircle,
  FiHash,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import { getRoleLabel } from "../utils/userUtils";

export default function UserViewModal({ user, theme, onClose }) {
  const isActive = user.status === "Active";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-view-title"
        className={`flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="min-w-0">
            <h2 id="user-view-title" className="text-xl font-bold tracking-tight">
              ព័ត៌មានអ្នកប្រើប្រាស់
            </h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              ព័ត៌មានគណនី តួនាទី និងទំនាក់ទំនង។
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-6 ${theme.modalBody}`}>
          <div className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${theme.section}`}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <FiUser size={30} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-bold">{user.name || "-"}</h3>
              <p className={`mt-1 text-sm ${theme.muted}`}>@{user.username || "-"}</p>
            </div>
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-500 dark:text-red-400"
              }`}
            >
              {isActive ? <FiCheckCircle /> : <FiXCircle />}
              {isActive ? "ដំណើរការ" : "មិនដំណើរការ"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoItem icon={<FiHash />} label="លេខសម្គាល់" value={user.id} theme={theme} />
            <InfoItem icon={<FiShield />} label="តួនាទី" value={getRoleLabel(user.role)} theme={theme} />
            <InfoItem icon={<FiMail />} label="អ៊ីមែល" value={user.email} theme={theme} />
            <InfoItem icon={<FiPhone />} label="លេខទូរស័ព្ទ" value={user.phone} theme={theme} />
          </div>
        </div>

        <div className={`flex justify-end border-t px-6 py-4 ${theme.modalHeader}`}>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, theme }) {
  return (
    <div className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 ${theme.softCard}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium ${theme.muted}`}>{label}</p>
        <p className="mt-1 break-words text-sm font-semibold">{value || "-"}</p>
      </div>
    </div>
  );
}
