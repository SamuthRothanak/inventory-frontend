import {
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiLink,
  FiTag,
  FiXCircle,
} from "react-icons/fi";

import CategoryImage from "./CategoryImage";
import ModalShell from "./ModalShell";

export default function CategoryViewModal({ category, theme, onClose, onEdit }) {
  const isActive = category.status === "Active";

  return (
    <ModalShell
      title="ព័ត៌មានលម្អិតប្រភេទ"
      subtitle="មើលរូបភាព ស្ថានភាព និងព័ត៌មានបន្ថែម។"
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បិទ
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiEdit2 />
            កែប្រភេទ
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div
          className={`overflow-hidden rounded-[28px] border shadow-sm ${theme.section}`}
        >
          <div className="relative bg-zinc-100 p-4 dark:bg-[#202024]">
            <CategoryImage
              image={category.imagePath}
              name={category.name}
              size="hero"
              fit="contain"
            />

            <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-b-[24px] bg-gradient-to-t from-black/60 to-transparent p-5">
              <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    ប្រភេទ
                  </p>

                  <h3 className="mt-1 truncate text-2xl font-bold text-white">
                    {category.name || "-"}
                  </h3>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {isActive ? <FiCheckCircle /> : <FiXCircle />}
                  {isActive ? "ដំណើរការ" : "មិនដំណើរការ"}
                </span>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-3 p-4 ${category.hasBeenUpdated ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <MiniInfoCard
              theme={theme}
              label="ឈ្មោះ"
              value={category.name}
              icon={<FiTag />}
            />

            <MiniInfoCard
              theme={theme}
              label="បានបង្កើត"
              value={category.createdAt}
              icon={<FiFileText />}
            />

            {category.hasBeenUpdated && (
              <MiniInfoCard
                theme={theme}
                label="ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ"
                value={category.updatedAt}
                icon={<FiFileText />}
              />
            )}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <SectionTitle
            icon={<FiFileText />}
            title="ការពិពណ៌នា"
            subtitle="ព័ត៌មានបន្ថែមសម្រាប់ grouping ផលិតផល ឬ POS។"
            theme={theme}
          />

          <div
            className={`mt-4 rounded-2xl border p-4 shadow-inner ${theme.softCard}`}
          >
            <p
              className={`text-sm leading-7 ${
                category.description ? theme.title : theme.muted
              }`}
            >
              {category.description || "គ្មានការពិពណ៌នា។"}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <SectionTitle
            icon={<FiLink />}
            title="ប្រភពរូបភាព"
            subtitle="ទីតាំងរូបភាពបច្ចុប្បន្នដែលប្រើដោយប្រភេទនេះ។"
            theme={theme}
          />

          <div className={`mt-4 rounded-2xl border p-4 ${theme.softCard}`}>
            <p className={`break-all text-sm leading-6 ${theme.muted}`}>
              {category.imagePath || "គ្មានរូបភាព។"}
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function MiniInfoCard({ label, value, theme, icon }) {
  return (
    <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
      <div className="flex items-center gap-2">
        <span className={theme.muted}>{icon}</span>
        <p
          className={`text-xs font-bold uppercase tracking-wide ${theme.muted}`}
        >
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-bold">{value || "-"}</p>
    </div>
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
