import { FiUser, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function UserStats({
  totalUsers,
  activeUsers,
  inactiveUsers,
  theme,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <SummaryCard
        theme={theme}
        title="អ្នកប្រើប្រាស់សរុប"
        value={totalUsers}
        icon={<FiUser className="text-[44px] text-red-500" />}
        iconBg="bg-red-500/10"
      />

      <SummaryCard
        theme={theme}
        title="អ្នកប្រើប្រាស់ដំណើរការ"
        value={activeUsers}
        icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
        iconBg="bg-emerald-500/10"
      />

      <SummaryCard
        theme={theme}
        title="អ្នកប្រើប្រាស់មិនដំណើរការ"
        value={inactiveUsers}
        icon={<FiXCircle className="text-[44px] text-red-500" />}
        iconBg="bg-red-500/10"
      />
    </div>
  );
}

function SummaryCard({ theme, icon, iconBg, title, value }) {
  return (
    <div className={`rounded-2xl border px-6 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-2 text-4xl font-semibold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}