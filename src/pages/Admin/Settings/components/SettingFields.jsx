import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowRight,
  FiBell,
  FiCheckCircle,
  FiDatabase,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiPrinter,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import { useState } from "react";

export function ProfileSettings({ theme, profile, onChange }) {
  return (
    <FormSection
      theme={theme}
      title="ព័ត៌មានគណនី"
      subtitle="ផ្លាស់ប្ដូរនឹងមានប្រសិទ្ធភាពភ្លាមៗ។"
      icon={<FiUser />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          theme={theme}
          label="ឈ្មោះ"
          value={profile.name}
          onChange={(v) => onChange("name", v)}
          icon={<FiUser />}
          placeholder="ឈ្មោះពេញ"
        />
        <FormInput
          theme={theme}
          label="អ៊ីម៉ែល"
          type="email"
          value={profile.email}
          onChange={(v) => onChange("email", v)}
          icon={<FiMail />}
          placeholder="example@email.com"
        />
        <FormInput
          theme={theme}
          label="លេខទូរស័ព្ទ"
          value={profile.phone}
          onChange={(v) => onChange("phone", v)}
          icon={<FiPhone />}
          placeholder="0xx xxx xxx"
        />
      </div>
    </FormSection>
  );
}

export function PasswordSettings({ theme, onSave, isSaving }) {
  const [form, setForm]       = useState({ password: "", confirm: "" });
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [error, setError]     = useState("");

  function handleSubmit() {
    if (form.password.length < 6) {
      setError("ពាក្យសម្ងាត់ត្រូវតែមាន ៦ តួអក្សរ ឬច្រើនជាងនេះ។");
      return;
    }
    if (form.password !== form.confirm) {
      setError("ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នា។");
      return;
    }
    setError("");
    onSave(form.password, () => setForm({ password: "", confirm: "" }));
  }

  return (
    <FormSection
      theme={theme}
      title="ផ្លាស់ប្ដូរពាក្យសម្ងាត់"
      subtitle="ពាក្យសម្ងាត់ថ្មីត្រូវតែមានយ៉ាងហោចណាស់ ៦ តួអក្សរ។"
      icon={<FiLock />}
    >
      <div className="max-w-md space-y-4">
        <PasswordInput
          theme={theme}
          label="ពាក្យសម្ងាត់ថ្មី"
          value={form.password}
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
          onChange={(v) => setForm((p) => ({ ...p, password: v }))}
        />
        <PasswordInput
          theme={theme}
          label="បញ្ជាក់ពាក្យសម្ងាត់"
          value={form.confirm}
          show={showCf}
          onToggle={() => setShowCf((v) => !v)}
          onChange={(v) => setForm((p) => ({ ...p, confirm: v }))}
        />

        {error && (
          <p className="text-sm font-semibold text-red-500">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !form.password || !form.confirm}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiLock size={15} />
          {isSaving ? "កំពុងរក្សាទុក..." : "ផ្លាស់ប្ដូរពាក្យសម្ងាត់"}
        </button>
      </div>
    </FormSection>
  );
}

export function ExchangeRateInfo({ theme, rate, onManage }) {
  const roundingLabels = {
    ceil:  "បូក (ceil)",
    floor: "ដក (floor)",
    round: "ជិតបំផុត (round)",
    none:  "ពិតប្រាកដ (none)",
  };

  return (
    <FormSection
      theme={theme}
      title="អត្រាប្ដូររូបិយប័ណ្ណ"
      subtitle="អត្រាដែលប្រើក្នុង POS ការលក់ និងរបាយការណ៍។"
      icon={<FiDollarSign />}
    >
      {rate ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow
              theme={theme}
              label="អត្រាប្ដូរ"
              value={`1 USD = ${Number(rate.usd_to_khr_rate).toLocaleString()} ៛`}
            />
            <InfoRow
              theme={theme}
              label="វិធីបន្ទាប់ KHR"
              value={roundingLabels[rate.khr_rounding] ?? rate.khr_rounding}
            />
            <InfoRow
              theme={theme}
              label="ថ្ងៃចូលជាធរមាន"
              value={rate.rate_date}
            />
            <InfoRow
              theme={theme}
              label="ស្ថានភាព"
              value={rate.status === "active" ? "សកម្ម" : "អសកម្ម"}
              highlight={rate.status === "active"}
            />
          </div>

          <div className={`mt-2 rounded-xl border p-4 text-sm ${theme.softCard}`}>
            <p className={theme.muted}>
              ដើម្បីផ្លាស់ប្ដូរអត្រា ឬបន្ថែមអត្រាថ្មី សូមចូលទំព័រគ្រប់គ្រងអត្រាប្ដូររូបិយប័ណ្ណ។
            </p>
          </div>

          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 h-11 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            គ្រប់គ្រងអត្រា
            <FiArrowRight />
          </button>
        </div>
      ) : (
        <div className={`rounded-xl border p-6 text-center ${theme.softCard}`}>
          <p className={`text-sm ${theme.muted}`}>
            មិនទាន់មានអត្រាប្ដូររូបិយប័ណ្ណសកម្មទេ។
          </p>
          <button
            type="button"
            onClick={onManage}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 h-11 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            បន្ថែមអត្រាថ្មី
            <FiArrowRight />
          </button>
        </div>
      )}
    </FormSection>
  );
}

export function ShopInfoSettings({ theme, user, onManageExchange }) {
  return (
    <FormSection
      theme={theme}
      title="ព័ត៌មានហាង និងបង្កាន់ដៃ"
      subtitle="ផ្នែកនេះជួយឲ្យអ្នកដឹងថាព័ត៌មានណាត្រូវប្រើលើ POS, invoice, receipt និងរបាយការណ៍។"
      icon={<FiPrinter />}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoRow theme={theme} label="ឈ្មោះហាង" value="Hak Ley Mart" />
        <InfoRow theme={theme} label="អ្នកគ្រប់គ្រង" value={user?.name ?? "—"} />
        <InfoRow theme={theme} label="អ៊ីម៉ែល" value={user?.email ?? "—"} />
      </div>

      <GuidanceBox
        theme={theme}
        title="ណែនាំសម្រាប់ប្រើប្រាស់ពិត"
        items={[
          "Receipt/Invoice គួរបង្ហាញឈ្មោះហាង លេខទូរស័ព្ទ អាសយដ្ឋាន និងអត្ថបទអរគុណ។",
          "បើថ្ងៃក្រោយត្រូវកែ logo ឬ footer ជាញឹកញាប់ អាចបន្ថែម API setting ពេលក្រោយបាន។",
          "បច្ចុប្បន្នអាចរក្សា page នេះជាកន្លែងមើល summary និងកែគណនី admin សិន។",
        ]}
      />

      <ActionLink
        label="គ្រប់គ្រងអត្រាប្តូរប្រាក់"
        onClick={onManageExchange}
        icon={<FiDollarSign />}
      />
    </FormSection>
  );
}

export function SalesRulesSettings({ theme }) {
  return (
    <FormSection
      theme={theme}
      title="ការលក់ និង POS"
      subtitle="Rules ទាំងនេះគួរតែជាគោលការណ៍ប្រើប្រាស់ក្នុង POS ពិត ប៉ុន្តែមិនរក្សាទុក setting ថ្មីនៅ database នៅពេលនេះទេ។"
      icon={<FiShoppingCart />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RuleCard
          theme={theme}
          title="បង់ប្រាក់ច្រើនវិធី"
          description="គាំទ្រ cash, bank transfer និង split payment ដោយប្រើ payments table ដែលមានស្រាប់។"
          tone="emerald"
        />
        <RuleCard
          theme={theme}
          title="បោះពុម្ពបង្កាន់ដៃ"
          description="Retail គួរប្រើ Receipt; Wholesale ឬអតិថិជនស្នើសុំ អាចប្រើ Invoice។"
          tone="blue"
        />
        <RuleCard
          theme={theme}
          title="ការបង្វិលទំនិញ"
          description="Sales return គួរប្រើ flow ដាច់ដោយឡែក ដើម្បីបញ្ចូល stock back និងរក្សា audit trail។"
          tone="amber"
        />
        <RuleCard
          theme={theme}
          title="ការដឹកជញ្ជូន"
          description="រក្សា delivery option, fee, address និង status នៅ sales table ដែលមានរួច។"
          tone="red"
        />
      </div>
    </FormSection>
  );
}

export function InventoryRulesSettings({ theme }) {
  return (
    <FormSection
      theme={theme}
      title="ស្តុក និងការជូនដំណឹង"
      subtitle="ផ្នែកនេះបង្ហាញគោលការណ៍ស្តុកដែលសមស្របសម្រាប់ Mart និង POS។"
      icon={<FiBell />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RuleCard
          theme={theme}
          title="មិនអនុញ្ញាតស្តុកអវិជ្ជមាន"
          description="POS គួរលក់តែទំនិញដែលមាន stock ដើម្បីកុំឲ្យ stock ខុស។"
          tone="emerald"
        />
        <RuleCard
          theme={theme}
          title="Low Stock Alert"
          description="ប្រើ low stock threshold នៅ product variant ដើម្បីបង្ហាញ notification ទំនិញជិតអស់។"
          tone="amber"
        />
        <RuleCard
          theme={theme}
          title="Expiry Alert"
          description="ទំនិញមាន expiry គួរមានការជូនដំណឹងមុនផុតកំណត់ ដើម្បីងាយរៀបចំលក់ ឬដកចេញ។"
          tone="red"
        />
        <RuleCard
          theme={theme}
          title="Stock Movement Audit"
          description="ការចូល និងចេញស្តុកគួរត្រូវរក្សាទុកក្នុង stock movements ដើម្បី trace ប្រវត្តិ។"
          tone="blue"
        />
      </div>
    </FormSection>
  );
}

export function PurchaseRulesSettings({ theme }) {
  const steps = [
    {
      step: 1,
      tone: "emerald",
      icon: <FiCheckCircle />,
      title: "ទទួលទំនិញ (Accepted)",
      description: "ទំនិញ accepted អាចបញ្ចូល stock-in សិន ដើម្បីយកទៅលក់បាន។",
    },
    {
      step: 2,
      tone: "amber",
      icon: <FiAlertTriangle />,
      title: "ទំនិញខូច (Damaged)",
      description: "ទំនិញ damaged ត្រូវបង្កើត supplier claim សម្រាប់ replacement, refund ឬ credit។",
    },
    {
      step: 3,
      tone: "blue",
      icon: <FiRefreshCw />,
      title: "ការជំនួស (Replacement)",
      description: "Replacement ដែលមកពី supplier ត្រូវចូល pending stock-in ម្ដងទៀត មុនបញ្ចូល stock។",
    },
  ];

  const toneMap = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500", border: "border-emerald-500/20" },
    amber:   { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",   badge: "bg-amber-500",   border: "border-amber-500/20"   },
    blue:    { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-500",    border: "border-blue-500/20"    },
  };

  return (
    <FormSection
      theme={theme}
      title="ការទិញចូល និង Stock-In"
      subtitle="លំហូរ purchase ត្រូវបំបែកច្បាស់រវាងទំនិញទទួលបាន ទំនិញខូច និង supplier claim។"
      icon={<FiTruck />}
    >
      <div className="space-y-2">
        {steps.map((item, index) => {
          const t = toneMap[item.tone];
          return (
            <div key={item.step}>
              <div className={`flex items-start gap-4 rounded-xl border p-4 ${t.border} ${theme.softCard}`}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${t.bg} ${t.text}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-bold ${t.text}`}>#{item.step}</span>
                </div>
                <div className="min-w-0 pt-1">
                  <p className={`text-sm font-bold ${theme.pageTitle}`}>{item.title}</p>
                  <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{item.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <FiArrowDown className={`text-base ${theme.muted}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}

export function SystemToolsSettings({ theme, onGoBackup, onGoAudit, onGoExchange }) {
  return (
    <FormSection
      theme={theme}
      title="ឧបករណ៍ប្រព័ន្ធ"
      subtitle="Settings មិនគួរផ្ទុក table ធំៗទេ។ គួរជា shortcut ទៅ module ដែលមានស្រាប់។"
      icon={<FiDatabase />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ToolCard
          theme={theme}
          icon={<FiDatabase />}
          title="បម្រុងទុកទិន្នន័យ"
          description="បង្កើត ទាញយក និង restore backup។"
          action="ទៅ Backup"
          onClick={onGoBackup}
        />
        <ToolCard
          theme={theme}
          icon={<FiShield />}
          title="កំណត់ហេតុប្រព័ន្ធ"
          description="ពិនិត្យសកម្មភាពអ្នកប្រើ និង audit trail។"
          action="ទៅ Audit Log"
          onClick={onGoAudit}
        />
        <ToolCard
          theme={theme}
          icon={<FiRefreshCw />}
          title="អត្រាប្តូរប្រាក់"
          description="គ្រប់គ្រង USD ទៅ KHR សម្រាប់ POS។"
          action="ទៅ Exchange Rate"
          onClick={onGoExchange}
        />
      </div>
    </FormSection>
  );
}

function InfoRow({ theme, label, value, highlight = false }) {
  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <p className={`mb-1.5 text-[11px] font-bold uppercase tracking-wide ${theme.muted}`}>{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-emerald-500" : theme.pageTitle}`}>{value}</p>
    </div>
  );
}

function GuidanceBox({ theme, title, items }) {
  return (
    <div className={`mt-4 rounded-xl border p-4 ${theme.softCard}`}>
      <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${theme.muted}`}>{title}</p>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={item} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {i + 1}
            </span>
            <span className={`text-sm leading-6 ${theme.muted}`}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleCard({ theme, title, description, tone = "red" }) {
  const toneClass = {
    red: "bg-red-500/10 text-red-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <FiCheckCircle />
        </span>
        <div>
          <p className={`text-sm font-bold ${theme.pageTitle}`}>{title}</p>
          <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ theme, icon, title, description, action, onClick }) {
  return (
    <div className={`flex min-h-45 flex-col justify-between rounded-xl border p-4 ${theme.softCard}`}>
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>
        <p className={`text-sm font-bold ${theme.pageTitle}`}>{title}</p>
        <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600"
      >
        {action}
        <FiArrowRight />
      </button>
    </div>
  );
}

function ActionLink({ label, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
    >
      {icon}
      {label}
      <FiArrowRight />
    </button>
  );
}

function FormSection({ theme, title, subtitle, icon, children }) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>
        <div>
          <h3 className={`text-base font-bold ${theme.pageTitle}`}>{title}</h3>
          {subtitle && (
            <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function PasswordInput({ theme, label, value, show, onToggle, onChange }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="relative">
        <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
          <FiLock />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full rounded-xl border pl-10 pr-10 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted} hover:opacity-80`}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </label>
  );
}

function FormInput({ label, value, onChange, theme, type = "text", placeholder = "", icon }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="relative">
        {icon && (
          <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>
    </label>
  );
}
