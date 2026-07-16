import { useMemo, useState } from "react";
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
  FiFileText,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPrinter,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";

export function ProfileSettings({
  theme,
  profile,
  user,
  onChange,
  onSave,
  isSaving,
}) {
  const initials = getInitials(profile.name || user?.name || "HL");

  return (
    <FormSection
      theme={theme}
      title="ព័ត៌មានគណនី"
      subtitle="កែព័ត៌មានអ្នកប្រើប្រាស់ដែលបង្ហាញក្នុងប្រព័ន្ធ។"
      icon={<FiUser />}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_230px]">
        <div className={`rounded-xl border p-5 shadow-sm ${theme.softCard}`}>
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
            <div className="md:col-span-2">
              <FormInput
                theme={theme}
                label="លេខទូរស័ព្ទ"
                value={profile.phone}
                onChange={(v) => onChange("phone", v)}
                icon={<FiPhone />}
                placeholder="0xx xxx xxx"
              />
            </div>
          </div>

          <div className={`mt-5 flex justify-end border-t pt-4 ${theme.divider}`}>
            <PrimaryButton
              onClick={onSave}
              disabled={isSaving}
              icon={<FiSave size={15} />}
            >
              {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
            </PrimaryButton>
          </div>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm ${theme.softCard}`}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500 text-lg font-extrabold text-white shadow-sm">
              {initials}
            </div>
            <h4 className={`mt-3 text-base font-extrabold ${theme.pageTitle}`}>
              {profile.name || "Hak Ley Mart"}
            </h4>
            <p className={`mt-1 text-xs ${theme.muted}`}>
              {profile.email || "មិនទាន់មានអ៊ីម៉ែល"}
            </p>
          </div>

          <div className={`mt-4 space-y-2.5 border-t pt-4 ${theme.divider}`}>
            <MiniInfo
              theme={theme}
              label="Role"
              value={user?.roles?.[0]?.name ?? user?.role ?? "Admin"}
            />
            <MiniInfo
              theme={theme}
              label="Phone"
              value={profile.phone || "—"}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}

export function PasswordSettings({ theme, onSave, isSaving }) {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

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
      title="សុវត្ថិភាពគណនី"
      subtitle="ប្រើពាក្យសម្ងាត់ដែលពិបាកទាយ និងកុំប្រើដូចគណនីផ្សេង។"
      icon={<FiLock />}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className={`rounded-xl border p-5 shadow-sm ${theme.softCard}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-xs font-semibold ${theme.muted}`}>
                កម្លាំងពាក្យសម្ងាត់
              </span>
              <span className={`text-xs font-bold ${strength.textClass}`}>
                {strength.label}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 rounded-full ${item <= strength.score ? strength.barClass : theme.strengthTrack}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">
              {error}
            </p>
          )}

          <div className={`mt-5 flex justify-end border-t pt-5 ${theme.divider}`}>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={isSaving || !form.password || !form.confirm}
              icon={<FiLock size={15} />}
            >
              {isSaving ? "កំពុងរក្សាទុក..." : "ផ្លាស់ប្ដូរពាក្យសម្ងាត់"}
            </PrimaryButton>
          </div>
        </div>

        <GuidancePanel
          theme={theme}
          title="គន្លឹះសុវត្ថិភាព"
          items={[
            "ប្រើយ៉ាងហោចណាស់ ៨ តួអក្សរ បើអាចធ្វើបាន។",
            "បញ្ចូលអក្សរធំ អក្សរតូច លេខ និងសញ្ញាពិសេស។",
            "កុំប្រើលេខទូរស័ព្ទ ឬឈ្មោះហាងជាពាក្យសម្ងាត់។",
          ]}
        />
      </div>
    </FormSection>
  );
}

export function ExchangeRateInfo({ theme, rate, onManage }) {
  const roundingLabels = {
    ceil: "បង្គត់ឡើង",
    round: "បង្គត់ជិតបំផុត",
    floor: "បង្គត់ចុះ",
    none: "តម្លៃពិត",
  };

  return (
    <FormSection
      theme={theme}
      title="អត្រាប្ដូររូបិយប័ណ្ណ"
      subtitle="អត្រាដែលប្រើក្នុង POS ការលក់ ការទិញ និងរបាយការណ៍។"
      icon={<FiDollarSign />}
    >
      {rate ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl bg-red-500 p-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-white/75">
              អត្រាបច្ចុប្បន្ន
            </p>
            <div className="mt-5">
              <p className="text-sm text-white/75">1 USD</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {Number(rate.usd_to_khr_rate).toLocaleString()} ៛
              </p>
            </div>
            <button
              type="button"
              onClick={onManage}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-red-500 transition hover:bg-red-50"
            >
              គ្រប់គ្រងអត្រា
              <FiArrowRight />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow
              theme={theme}
              label="ការបង្គត់ប្រាក់រៀល"
              value={roundingLabels[rate.khr_rounding] ?? rate.khr_rounding}
            />
            <InfoRow
              theme={theme}
              label="ថ្ងៃចូលជាធរមាន"
              value={rate.rate_date ?? "—"}
            />
            <InfoRow
              theme={theme}
              label="ស្ថានភាព"
              value={rate.status === "active" ? "សកម្ម" : "អសកម្ម"}
              highlight={rate.status === "active"}
            />
            <InfoRow
              theme={theme}
              label="ការប្រើប្រាស់"
              value="POS / ការលក់ / ការទិញ / របាយការណ៍"
            />
          </div>
        </div>
      ) : (
        <EmptyState
          theme={theme}
          title="មិនទាន់មានអត្រាប្ដូរសកម្ម"
          description="សូមបន្ថែម ឬកំណត់អត្រាមួយឲ្យសកម្ម ដើម្បីប្រើក្នុង POS និងរបាយការណ៍។"
          action="បន្ថែមអត្រាថ្មី"
          onAction={onManage}
        />
      )}
    </FormSection>
  );
}

export function ShopInfoSettings({
  theme,
  shopInfo,
  onChange,
  onSave,
  onManageExchange,
}) {
  return (
    <FormSection
      theme={theme}
      title="ព័ត៌មានហាង និងវិក្កយបត្រ"
      subtitle="កំណត់ព័ត៌មានដែលបង្ហាញលើ POS receipt, invoice និងរបាយការណ៍។"
      icon={<FiPrinter />}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`rounded-xl border p-5 shadow-sm ${theme.softCard}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              theme={theme}
              label="ឈ្មោះហាងជាភាសាអង់គ្លេស"
              value={shopInfo.name}
              onChange={(value) => onChange("name", value)}
              icon={<FiPrinter />}
              placeholder="Hak Ley Mart"
            />
            <FormInput
              theme={theme}
              label="ឈ្មោះហាងជាភាសាខ្មែរ"
              value={shopInfo.khmerName}
              onChange={(value) => onChange("khmerName", value)}
              icon={<FiPrinter />}
              placeholder="ហាក់ ឡេ ម៉ាត"
            />

            <FormInput
              theme={theme}
              label="លេខទូរស័ព្ទហាង"
              value={shopInfo.phone}
              onChange={(value) => onChange("phone", value)}
              icon={<FiPhone />}
              placeholder="0xx xxx xxx"
            />
            <FormInput
              theme={theme}
              label="អាសយដ្ឋាន"
              value={shopInfo.address}
              onChange={(value) => onChange("address", value)}
              icon={<FiMapPin />}
              placeholder="ផ្លូវ, សង្កាត់, ខណ្ឌ, ភ្នំពេញ"
            />

            <div className="md:col-span-2">
              <FormInput
                theme={theme}
                label="អត្ថបទខាងក្រោមវិក្កយបត្រ"
                value={shopInfo.receiptFooter}
                onChange={(value) => onChange("receiptFooter", value)}
                icon={<FiFileText />}
                placeholder="សូមអរគុណសម្រាប់ការជាវ។"
              />
            </div>
          </div>

          <div className={`mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between ${theme.divider}`}>
            <button
              type="button"
              onClick={onManageExchange}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition ${theme.outlineButton}`}
            >
              <FiDollarSign />
              អត្រាប្តូរប្រាក់
            </button>
            <PrimaryButton onClick={onSave} icon={<FiSave size={15} />}>
              រក្សាទុកព័ត៌មានហាង
            </PrimaryButton>
          </div>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm ${theme.softCard}`}>
          <div className={`rounded-xl border border-dashed p-4 text-center ${theme.receiptPreview}`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-lg font-extrabold text-white">
              {getInitials(shopInfo.name || "HL")}
            </div>
            <h4 className="mt-3 text-base font-extrabold">
              {shopInfo.name || "Hak Ley Mart"}
            </h4>
            <p className="mt-1 text-xs text-zinc-500">
              {shopInfo.phone || "លេខទូរស័ព្ទហាង"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {shopInfo.khmerName || "ឈ្មោះហាងជាភាសាខ្មែរ"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {shopInfo.address || "អាសយដ្ឋានហាង"}
            </p>
            <div className={`my-4 border-t border-dashed ${theme.dashedDivider}`} />
            <div className="space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span>តម្លៃមុនបញ្ចុះ</span>
                <span>$12.50</span>
              </div>
              <div className="flex justify-between">
                <span>បញ្ចុះតម្លៃ</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-extrabold">
                <span>សរុប</span>
                <span>$12.50</span>
              </div>
            </div>
            <div className={`my-4 border-t border-dashed ${theme.dashedDivider}`} />
            <p className="text-xs font-semibold text-zinc-500">
              {shopInfo.receiptFooter || "សូមអរគុណសម្រាប់ការជាវ។"}
            </p>
          </div>
        </div>
      </div>
    </FormSection>
  );

}

export function SalesRulesSettings({ theme }) {
  return (
    <FormSection
      theme={theme}
      title="ការលក់ និងម៉ាស៊ីនគិតលុយ"
      subtitle="គោលការណ៍សំខាន់ៗនៅពេលលក់ បង់ប្រាក់ និងបង្វិលទំនិញ។"
      icon={<FiShoppingCart />}
      compact
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RuleCard
          theme={theme}
          title="បង់ប្រាក់ច្រើនវិធី"
          description="ទទួលសាច់ប្រាក់ ផ្ទេរតាមធនាគារ ឬបង់ចម្រុះច្រើនវិធីក្នុងវិក្កយបត្រតែមួយ។"
          tone="emerald"
        />
        <RuleCard
          theme={theme}
          title="បោះពុម្ពបង្កាន់ដៃ"
          description="ការលក់រាយប្រើបង្កាន់ដៃ ហើយអាចបោះពុម្ពវិក្កយបត្របានពេលអតិថិជនស្នើសុំ។"
          tone="blue"
        />
        <RuleCard
          theme={theme}
          title="ការបង្វិលទំនិញ"
          description="ទំនិញបង្វិលត្រូវឆ្លងកាត់ return flow ដើម្បីកែស្តុក និងរក្សាប្រវត្តិ។"
          tone="amber"
        />
        <RuleCard
          theme={theme}
          title="ការដឹកជញ្ជូន"
          description="រក្សាជម្រើសដឹកជញ្ជូន ថ្លៃដឹក អាសយដ្ឋាន និងស្ថានភាពជាមួយការលក់នីមួយៗ។"
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
      subtitle="គោលការណ៍គ្រប់គ្រងស្តុក ការជូនដំណឹង និងប្រវត្តិចលនាទំនិញ។"
      icon={<FiBell />}
      compact
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RuleCard
          theme={theme}
          title="មិនអនុញ្ញាតស្តុកអវិជ្ជមាន"
          description="POS អនុញ្ញាតឲ្យលក់តែទំនិញដែលមានស្តុកគ្រប់គ្រាន់។"
          tone="emerald"
        />
        <RuleCard
          theme={theme}
          title="ស្តុកជិតអស់"
          description="ប្រើកម្រិតស្តុកអប្បបរមារបស់មុខទំនិញ ដើម្បីជូនដំណឹងពេលស្តុកជិតអស់។"
          tone="amber"
        />
        <RuleCard
          theme={theme}
          title="ជិតផុតកំណត់"
          description="ទំនិញមានថ្ងៃផុតកំណត់ត្រូវជូនដំណឹងជាមុន ដើម្បីងាយរៀបចំលក់ ឬដកចេញ។"
          tone="red"
        />
        <RuleCard
          theme={theme}
          title="ប្រវត្តិចលនាស្តុក"
          description="រាល់ការចូល និងចេញស្តុកត្រូវរក្សាទុក ដើម្បីតាមដានប្រភព និងប្រវត្តិបាន។"
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
      title: "ទំនិញដែលបានទទួលយក",
      description:
        "ទំនិញដែលពិនិត្យត្រឹមត្រូវអាចបញ្ចូលស្តុកសិន ដើម្បីយកទៅលក់បាន។",
    },
    {
      step: 2,
      tone: "amber",
      icon: <FiAlertTriangle />,
      title: "ទំនិញខូច",
      description:
        "ទំនិញខូចត្រូវបង្កើតសំណើទៅអ្នកផ្គត់ផ្គង់ សម្រាប់ប្ដូរ សងប្រាក់ ឬទូទាត់ជាឥណទាន។",
    },
    {
      step: 3,
      tone: "blue",
      icon: <FiRefreshCw />,
      title: "ទំនិញដែលបានប្ដូរជំនួស",
      description:
        "ទំនិញដែលអ្នកផ្គត់ផ្គង់ប្ដូរមកវិញត្រូវរង់ចាំបញ្ជាក់ មុនបញ្ចូលទៅក្នុងស្តុក។",
    },
  ];

  return (
    <FormSection
      theme={theme}
      title="ការទិញចូល និងបញ្ចូលស្តុក"
      subtitle="លំហូរទិញចូលបំបែកច្បាស់រវាងទទួលយក ខូច និងដំណោះស្រាយពីអ្នកផ្គត់ផ្គង់។"
      icon={<FiTruck />}
      compact
    >
      <div className="space-y-2">
        {steps.map((item, index) => (
          <div key={item.step}>
            <StepCard theme={theme} item={item} />
            {index < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <FiArrowDown className={`text-base ${theme.muted}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </FormSection>
  );
}

export function SystemToolsSettings({ theme, onGoBackup, onGoAudit }) {
  return (
    <FormSection
      theme={theme}
      title="ឧបករណ៍ប្រព័ន្ធ"
      subtitle="គ្រប់គ្រងសុវត្ថិភាពទិន្នន័យ និងពិនិត្យប្រវត្តិសកម្មភាព។"
      icon={<FiDatabase />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ToolCard
          theme={theme}
          icon={<FiDatabase />}
          title="បម្រុងទុកទិន្នន័យ"
          description="បង្កើត ទាញយក និងស្ដារទិន្នន័យបម្រុងទុក។"
          action="បើកទិន្នន័យបម្រុង"
          onClick={onGoBackup}
        />
        <ToolCard
          theme={theme}
          icon={<FiShield />}
          title="កំណត់ហេតុប្រព័ន្ធ"
          description="ពិនិត្យប្រវត្តិសកម្មភាព និងការផ្លាស់ប្ដូររបស់អ្នកប្រើប្រាស់។"
          action="បើកកំណត់ហេតុ"
          onClick={onGoAudit}
        />
      </div>
    </FormSection>
  );
}

function FormSection({
  theme,
  title,
  subtitle,
  icon,
  children,
  compact = false,
}) {
  return (
    <section
      className={
        compact ? `rounded-xl border p-5 shadow-sm ${theme.softCard}` : ""
      }
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>
        <div>
          <h3
            className={`text-base font-extrabold leading-6 ${theme.pageTitle}`}
          >
            {title}
          </h3>
          {subtitle && (
            <p className={`mt-0.5 text-sm leading-5 ${theme.muted}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  theme,
  type = "text",
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-bold ${theme.muted}`}>
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
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

function PasswordInput({ theme, label, value, show, onToggle, onChange }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-bold ${theme.muted}`}>
        {label}
      </span>
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        >
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

function PrimaryButton({ children, onClick, disabled, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {children}
    </button>
  );
}

function InfoRow({ theme, label, value, highlight = false }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${theme.softCard}`}>
      <p
        className={`mb-1.5 text-[11px] font-bold uppercase tracking-wide ${theme.muted}`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-extrabold ${highlight ? "text-emerald-500" : theme.pageTitle}`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ theme, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs font-semibold ${theme.muted}`}>{label}</span>
      <span className={`truncate text-sm font-bold ${theme.pageTitle}`}>
        {value}
      </span>
    </div>
  );
}

function GuidancePanel({ theme, title, items }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${theme.softCard}`}>
      <p className={`mb-3 text-sm font-extrabold ${theme.pageTitle}`}>
        {title}
      </p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              {index + 1}
            </span>
            <span className={`text-sm leading-6 ${theme.muted}`}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ theme, title, description, action, onAction }) {
  return (
    <div
      className={`rounded-xl border p-8 text-center shadow-sm ${theme.softCard}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 text-2xl text-red-500">
        <FiDollarSign />
      </div>
      <h4 className={`mt-4 text-base font-extrabold ${theme.pageTitle}`}>
        {title}
      </h4>
      <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${theme.muted}`}>
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
      >
        {action}
        <FiArrowRight />
      </button>
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
    <div className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${theme.softCard}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
        >
          <FiCheckCircle />
        </span>
        <div>
          <p className={`text-sm font-extrabold ${theme.pageTitle}`}>{title}</p>
          <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ theme, item }) {
  const toneMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm ${theme.softCard}`}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${toneMap[item.tone]}`}
        >
          {item.icon}
        </div>
        <span className={`text-[10px] font-extrabold ${theme.muted}`}>
          #{item.step}
        </span>
      </div>
      <div className="min-w-0 pt-1">
        <p className={`text-sm font-extrabold ${theme.pageTitle}`}>
          {item.title}
        </p>
        <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
          {item.description}
        </p>
      </div>
    </div>
  );
}

function ToolCard({ theme, icon, title, description, action, onClick }) {
  return (
    <div
      className={`flex min-h-44 flex-col justify-between rounded-xl border p-4 shadow-sm ${theme.softCard}`}
    >
      <div>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-xl text-red-500">
          {icon}
        </div>
        <p className={`text-base font-extrabold ${theme.pageTitle}`}>{title}</p>
        <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-600"
      >
        {action}
        <FiArrowRight />
      </button>
    </div>
  );
}

function getInitials(name) {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();

  return initials || "HL";
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return {
      score: 0,
      label: "មិនទាន់បញ្ចូល",
      textClass: "text-zinc-400",
      barClass: "bg-zinc-300",
    };
  }
  if (score <= 1) {
    return {
      score: 1,
      label: "ខ្សោយ",
      textClass: "text-red-500",
      barClass: "bg-red-500",
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: "មធ្យម",
      textClass: "text-amber-500",
      barClass: "bg-amber-500",
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: "ល្អ",
      textClass: "text-blue-500",
      barClass: "bg-blue-500",
    };
  }
  return {
    score: 4,
    label: "រឹងមាំ",
    textClass: "text-emerald-500",
    barClass: "bg-emerald-500",
  };
}
