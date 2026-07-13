import { FiClock, FiHardDrive, FiShield } from "react-icons/fi";

export default function BackupPolicyCard({ theme }) {
  const policies = [
    {
      icon: <FiClock />,
      title: "កាលវិភាគ",
      value: "តាមការចាំបាច់",
      text: "ណែនាំបង្កើតទិន្នន័យបម្រុងទុករៀងរាល់ថ្ងៃ ឬនៅពេលមានការប្រែប្រួលទិន្នន័យធំ។",
    },
    {
      icon: <FiHardDrive />,
      title: "ទំហំផ្ទុក",
      value: "ក្នុងម៉ាស៊ីន + ច្បាប់ចម្លងខាងក្រៅ",
      text: "រក្សាទុកច្បាប់ចម្លងមួយនៅក្រៅ server ដើម្បីសុវត្ថិភាព។",
    },
    {
      icon: <FiShield />,
      title: "សិទ្ធិប្រើប្រាស់",
      value: "Admin តែប៉ុណ្ណោះ",
      text: "ការស្ដារ និងលុបទិន្នន័យបម្រុងទុកគួរតែដាក់កម្រិតសម្រាប់ Admin។",
    },
  ];

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold">គោលការណ៍បម្រុងទុកដែលណែនាំ</h2>
        <p className={`mt-1 text-sm ${theme.muted}`}>ស្តង់ដារសាមញ្ញសម្រាប់គម្រោង Mart/POS ពិតប្រាកដ។</p>
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

