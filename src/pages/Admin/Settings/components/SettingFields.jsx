import {
  FiAlertTriangle,
  FiBox,
  FiChevronDown,
  FiCreditCard,
  FiMapPin,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";

export function ShopSettings({ theme, settings, onChange }) {
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

export function SalesSettings({ theme, settings, onChange }) {
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

export function PurchaseSettings({ theme, settings, onChange }) {
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

export function InventorySettings({ theme, settings, onChange }) {
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
    <div>
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
    <div className={`rounded-xl border p-4 transition ${theme.softCard}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold">{label}</p>

          <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            checked
              ? "bg-emerald-500"
              : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition ${
              checked ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
