import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiCreditCard,
  FiMapPin,
  FiRefreshCcw,
  FiSave,
  FiSearch,
  FiSettings,
  FiShoppingCart,
  FiToggleLeft,
  FiToggleRight,
  FiTruck,
  FiUser,
} from "react-icons/fi";

const initialSettings = {
  shop: {
    shopName: "Hak Ly Mart",
    ownerName: "Admin",
    phone: "012345678",
    email: "admin@haklymart.com",
    address: "Phnom Penh, Cambodia",
    receiptFooter: "Thank you for shopping with us!",
  },

  sales: {
    defaultSaleType: "retail",
    allowWholesale: true,
    allowSplitPayment: true,
    allowSalesReturn: true,
    autoPrintReceipt: false,
    stockOutMethod: "fefo",
  },

  purchases: {
    defaultPaymentMode: "pay_after_check",
    allowPrepaid: true,
    allowPartialPrepaid: true,
    requireStockInConfirm: true,
    allowSupplierClaim: true,
  },

  inventory: {
    lowStockAlert: true,
    expiryAlert: true,
    expiryAlertDays: 30,
    allowNegativeStock: false,
    requireBatchForExpiryProduct: true,
    stockAdjustmentApproval: true,
  },
};

const settingSections = [
  {
    id: "shop",
    title: "Shop Profile",
    description: "Store information, receipt footer, and contact detail.",
    icon: FiUser,
  },
  {
    id: "sales",
    title: "Sales Settings",
    description: "POS, split payment, sales return, and stock-out behavior.",
    icon: FiShoppingCart,
  },
  {
    id: "purchases",
    title: "Purchase Settings",
    description: "Supplier purchase, prepaid, stock-in, and claim flow.",
    icon: FiTruck,
  },
  {
    id: "inventory",
    title: "Inventory Settings",
    description: "Low stock, expiry, batch, and stock adjustment rules.",
    icon: FiBox,
  },
];

export default function Setting() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [activeSection, setActiveSection] = useState("shop");
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState(initialSettings);
  const [savedMessage, setSavedMessage] = useState("");

  const theme = {
    pageTitle: isDark ? "text-white" : "text-zinc-900",

    card: isDark
      ? "border-white/10 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    muted: isDark ? "text-zinc-400" : "text-zinc-500",

    input: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",

    select: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",

    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-white",

    section: isDark
      ? "border-white/10 bg-[#18181b]"
      : "border-zinc-200 bg-white",
  };

  const filteredSections = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    if (!keyword) return settingSections;

    return settingSections.filter(
      (section) =>
        section.title.toLowerCase().includes(keyword) ||
        section.description.toLowerCase().includes(keyword)
    );
  }, [searchTerm]);

  const activeSectionInfo =
    settingSections.find((section) => section.id === activeSection) ||
    settingSections[0];

  const ActiveIcon = activeSectionInfo.icon;

  const updateSetting = (group, field, value) => {
    setSettings((previous) => ({
      ...previous,
      [group]: {
        ...previous[group],
        [field]: value,
      },
    }));

    setSavedMessage("");
  };

  const handleSave = () => {
    setSavedMessage("Settings saved successfully.");

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setSavedMessage("Settings reset to default.");
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.pageTitle}`}>
            Settings
          </h1>

          <p className={`mt-1 text-sm ${theme.muted}`}>
            Manage general behavior for your Mart/POS system.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {savedMessage && (
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <FiCheckCircle />
              {savedMessage}
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FiRefreshCcw />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            <FiSave />
            Save Settings
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SettingSummaryCard
          theme={theme}
          title="Shop"
          value={settings.shop.shopName}
          subtitle={settings.shop.phone}
          icon={<FiUser className="text-[32px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SettingSummaryCard
          theme={theme}
          title="Sales Return"
          value={settings.sales.allowSalesReturn ? "Enabled" : "Disabled"}
          subtitle="Refund / exchange flow"
          icon={<FiShoppingCart className="text-[32px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SettingSummaryCard
          theme={theme}
          title="Stock-In"
          value={
            settings.purchases.requireStockInConfirm ? "Confirm First" : "Auto"
          }
          subtitle="Purchase stock control"
          icon={<FiTruck className="text-[32px] text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <SettingSummaryCard
          theme={theme}
          title="Inventory"
          value={settings.inventory.allowNegativeStock ? "Flexible" : "Strict"}
          subtitle={
            settings.inventory.allowNegativeStock
              ? "Negative stock allowed"
              : "No negative stock"
          }
          icon={<FiBox className="text-[32px] text-purple-500" />}
          iconBg="bg-purple-500/10"
        />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
        {/* Setting sections */}
        <div className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <div className="relative mb-4">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search settings..."
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <div className="space-y-2">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-red-500 bg-red-500 text-white shadow-sm"
                      : `${theme.softCard} hover:border-red-300 dark:hover:border-red-500/40`
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold">{section.title}</p>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        isActive ? "text-white/80" : theme.muted
                      }`}
                    >
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div
                className={`rounded-2xl border p-4 text-center text-sm ${theme.softCard}`}
              >
                <p className={theme.muted}>No settings found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form content */}
        <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}>
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <ActiveIcon size={22} />
              </div>

              <div>
                <h2 className={`text-lg font-bold ${theme.pageTitle}`}>
                  {activeSectionInfo.title}
                </h2>

                <p className={`mt-1 text-sm ${theme.muted}`}>
                  {activeSectionInfo.description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {activeSection === "shop" && (
              <ShopSettings
                theme={theme}
                settings={settings.shop}
                onChange={(field, value) => updateSetting("shop", field, value)}
              />
            )}

            {activeSection === "sales" && (
              <SalesSettings
                theme={theme}
                settings={settings.sales}
                onChange={(field, value) => updateSetting("sales", field, value)}
              />
            )}

            {activeSection === "purchases" && (
              <PurchaseSettings
                theme={theme}
                settings={settings.purchases}
                onChange={(field, value) =>
                  updateSetting("purchases", field, value)
                }
              />
            )}

            {activeSection === "inventory" && (
              <InventorySettings
                theme={theme}
                settings={settings.inventory}
                onChange={(field, value) =>
                  updateSetting("inventory", field, value)
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Help */}
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <FiAlertTriangle size={20} />
          </div>

          <div>
            <h3 className={`text-base font-bold ${theme.pageTitle}`}>
              Note
            </h3>

            <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
              This page is for general system behavior only. Exchange Rate,
              Backup Data, and Audit Log should stay in their own pages from the
              left System menu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingSummaryCard({ theme, title, value, subtitle, icon, iconBg }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>

          <h3 className="mt-2 text-2xl font-bold leading-tight">{value}</h3>

          <p className={`mt-2 text-xs ${theme.muted}`}>{subtitle}</p>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ShopSettings({ theme, settings, onChange }) {
  return (
    <FormSection
      theme={theme}
      title="Shop Information"
      subtitle="Used on receipts, invoices, and reports."
      icon={<FiUser />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          theme={theme}
          label="Shop Name"
          value={settings.shopName}
          onChange={(value) => onChange("shopName", value)}
          icon={<FiSettings />}
        />

        <FormInput
          theme={theme}
          label="Owner / Admin Name"
          value={settings.ownerName}
          onChange={(value) => onChange("ownerName", value)}
          icon={<FiUser />}
        />

        <FormInput
          theme={theme}
          label="Phone"
          value={settings.phone}
          onChange={(value) => onChange("phone", value)}
          icon={<FiCreditCard />}
        />

        <FormInput
          theme={theme}
          label="Email"
          value={settings.email}
          onChange={(value) => onChange("email", value)}
          icon={<FiSettings />}
        />
      </div>

      <div className="mt-4">
        <FormTextarea
          theme={theme}
          label="Address"
          value={settings.address}
          onChange={(value) => onChange("address", value)}
          icon={<FiMapPin />}
        />
      </div>

      <div className="mt-4">
        <FormTextarea
          theme={theme}
          label="Receipt Footer"
          value={settings.receiptFooter}
          onChange={(value) => onChange("receiptFooter", value)}
          icon={<FiShoppingCart />}
        />
      </div>
    </FormSection>
  );
}

function SalesSettings({ theme, settings, onChange }) {
  return (
    <FormSection
      theme={theme}
      title="Sales & POS"
      subtitle="Control POS, payment, return, and stock-out behavior."
      icon={<FiShoppingCart />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          theme={theme}
          label="Default Sale Type"
          value={settings.defaultSaleType}
          onChange={(value) => onChange("defaultSaleType", value)}
          icon={<FiShoppingCart />}
          options={[
            { value: "retail", label: "Retail" },
            { value: "wholesale", label: "Wholesale" },
          ]}
        />

        <FormSelect
          theme={theme}
          label="Stock Out Method"
          value={settings.stockOutMethod}
          onChange={(value) => onChange("stockOutMethod", value)}
          icon={<FiBox />}
          options={[
            { value: "fefo", label: "FEFO - Expiry First" },
            { value: "fifo", label: "FIFO - First In First Out" },
          ]}
        />

        <ToggleRow
          theme={theme}
          label="Allow Wholesale"
          description="Enable wholesale sale type and customer pricing."
          checked={settings.allowWholesale}
          onChange={(value) => onChange("allowWholesale", value)}
        />

        <ToggleRow
          theme={theme}
          label="Allow Split Payment"
          description="Allow customers to pay with USD + KHR or multiple methods."
          checked={settings.allowSplitPayment}
          onChange={(value) => onChange("allowSplitPayment", value)}
        />

        <ToggleRow
          theme={theme}
          label="Allow Sales Return"
          description="Enable refund / exchange flow from sale invoices."
          checked={settings.allowSalesReturn}
          onChange={(value) => onChange("allowSalesReturn", value)}
        />

        <ToggleRow
          theme={theme}
          label="Auto Print Receipt"
          description="Automatically print receipt after completed sale."
          checked={settings.autoPrintReceipt}
          onChange={(value) => onChange("autoPrintReceipt", value)}
        />
      </div>
    </FormSection>
  );
}

function PurchaseSettings({ theme, settings, onChange }) {
  return (
    <FormSection
      theme={theme}
      title="Purchases"
      subtitle="Control supplier purchase, prepaid, stock-in, and claim flow."
      icon={<FiTruck />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          theme={theme}
          label="Default Payment Mode"
          value={settings.defaultPaymentMode}
          onChange={(value) => onChange("defaultPaymentMode", value)}
          icon={<FiCreditCard />}
          options={[
            { value: "pay_after_check", label: "Pay After Check" },
            { value: "prepaid", label: "Prepaid" },
            { value: "partial_prepaid", label: "Partial Prepaid" },
          ]}
        />

        <ToggleRow
          theme={theme}
          label="Allow Prepaid"
          description="Allow supplier purchases paid before goods arrive."
          checked={settings.allowPrepaid}
          onChange={(value) => onChange("allowPrepaid", value)}
        />

        <ToggleRow
          theme={theme}
          label="Allow Partial Prepaid"
          description="Allow partial payment before receiving goods."
          checked={settings.allowPartialPrepaid}
          onChange={(value) => onChange("allowPartialPrepaid", value)}
        />

        <ToggleRow
          theme={theme}
          label="Require Stock-In Confirm"
          description="Stock should update only after confirm stock-in."
          checked={settings.requireStockInConfirm}
          onChange={(value) => onChange("requireStockInConfirm", value)}
        />

        <ToggleRow
          theme={theme}
          label="Allow Supplier Claim"
          description="Track damaged goods with refund / replacement / credit."
          checked={settings.allowSupplierClaim}
          onChange={(value) => onChange("allowSupplierClaim", value)}
        />
      </div>
    </FormSection>
  );
}

function InventorySettings({ theme, settings, onChange }) {
  return (
    <FormSection
      theme={theme}
      title="Inventory"
      subtitle="Control stock, batch, expiry, and adjustment behavior."
      icon={<FiBox />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          theme={theme}
          label="Expiry Alert Days"
          type="number"
          value={settings.expiryAlertDays}
          onChange={(value) => onChange("expiryAlertDays", Number(value || 0))}
          icon={<FiAlertTriangle />}
        />

        <ToggleRow
          theme={theme}
          label="Low Stock Alert"
          description="Create notification when stock is below threshold."
          checked={settings.lowStockAlert}
          onChange={(value) => onChange("lowStockAlert", value)}
        />

        <ToggleRow
          theme={theme}
          label="Expiry Alert"
          description="Notify when inventory batch is near expiry."
          checked={settings.expiryAlert}
          onChange={(value) => onChange("expiryAlert", value)}
        />

        <ToggleRow
          theme={theme}
          label="Allow Negative Stock"
          description="Usually should be disabled for POS accuracy."
          checked={settings.allowNegativeStock}
          onChange={(value) => onChange("allowNegativeStock", value)}
        />

        <ToggleRow
          theme={theme}
          label="Require Batch for Expiry Product"
          description="Products with expiry must use batch and expired date."
          checked={settings.requireBatchForExpiryProduct}
          onChange={(value) => onChange("requireBatchForExpiryProduct", value)}
        />

        <ToggleRow
          theme={theme}
          label="Stock Adjustment Approval"
          description="Only approved adjustments can affect stock."
          checked={settings.stockAdjustmentApproval}
          onChange={(value) => onChange("stockAdjustmentApproval", value)}
        />
      </div>
    </FormSection>
  );
}

function FormSection({ theme, title, subtitle, icon, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>

        <div>
          <h3 className={`text-base font-bold ${theme.pageTitle}`}>{title}</h3>

          {subtitle && (
            <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
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
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
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
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>
    </label>
  );
}

function FormTextarea({ label, value, onChange, theme, icon }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`w-full resize-none rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>
    </label>
  );
}

function FormSelect({ label, value, onChange, options, theme, icon }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
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

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 ${theme.select}`}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        />
      </div>
    </label>
  );
}

function ToggleRow({ theme, label, description, checked, onChange }) {
  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold">{label}</p>

          <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`text-3xl transition ${
            checked
              ? "text-emerald-500"
              : "text-zinc-400 hover:text-zinc-500 dark:text-zinc-600"
          }`}
        >
          {checked ? <FiToggleRight /> : <FiToggleLeft />}
        </button>
      </div>
    </div>
  );
}