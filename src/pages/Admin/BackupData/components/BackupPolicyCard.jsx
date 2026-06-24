import { FiClock, FiHardDrive, FiShield } from "react-icons/fi";

export default function BackupPolicyCard({ theme }) {
  const policies = [
    {
      icon: <FiClock />,
      title: "Schedule",
      value: "Daily at 10:00 PM",
      text: "Auto backup can run after shop closing time.",
    },
    {
      icon: <FiHardDrive />,
      title: "Storage",
      value: "Local + external copy",
      text: "Keep one copy outside the server for safer recovery.",
    },
    {
      icon: <FiShield />,
      title: "Permission",
      value: "Admin only",
      text: "Restore and delete backup should be restricted.",
    },
  ];

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold">Recommended Backup Policy</h2>
        <p className={`mt-1 text-sm ${theme.muted}`}>Simple standard for a real Mart/POS project.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {policies.map((policy) => (
          <div key={policy.title} className={`rounded-2xl border p-5 ${theme.softCard}`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-2xl text-red-500">
              {policy.icon}
            </div>
            <p className={`text-sm font-semibold ${theme.muted}`}>{policy.title}</p>
            <h3 className="mt-1 font-extrabold">{policy.value}</h3>
            <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>{policy.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

