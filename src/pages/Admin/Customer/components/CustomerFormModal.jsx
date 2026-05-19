import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiCheckCircle,
  FiChevronDown,
  FiFileText,
  FiHash,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShoppingBag,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  customerSchema,
  defaultCustomerValues,
} from "../schemas/customerSchema";

export function ModalShell({ title, subtitle, theme, onClose, children, footer }) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-auto max-h-[90dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
      >
        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>

              {subtitle && (
                <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <div
          className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${theme.modalBody}`}
        >
          {children}
        </div>

        {footer && (
          <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerFormModal({
  mode,
  customer,
  theme,
  onClose,
  onSubmit,
  isSaving,
}) {
  const title = mode === "add" ? "Add Customer" : "Edit Customer";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultCustomerValues,
  });

  const status = watch("status");

  useEffect(() => {
    if (mode === "edit" && customer) {
      reset({
        customerCode: customer.customerCode || "",
        shopName: customer.shopName || "",
        contactName: customer.contactName || "",
        phone: customer.phone || "",
        address: customer.address || "",
        note: customer.note || "",
        status: customer.status || "Active",
      });
      return;
    }

    reset(defaultCustomerValues);
  }, [mode, customer, reset]);

  return (
    <ModalShell
      title={title}
      subtitle="Only wholesale / reseller customers should be saved here. Walk-in customers are not stored."
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="customer-form"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save Customer"}
          </button>
        </>
      }
    >
      <form
        id="customer-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <SectionTitle
          icon={<FiUser />}
          title="Basic Information"
          subtitle="Required customer details for customer management."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "edit" && (
              <FormInput
                label="Customer Code"
                required
                error={errors.customerCode?.message}
                register={register("customerCode")}
                theme={theme}
                placeholder="CUS-001"
                icon={<FiHash />}
              />
            )}

            <FormInput
              label="Shop Name"
              required
              error={errors.shopName?.message}
              register={register("shopName")}
              theme={theme}
              placeholder="Dara Mini Mart"
              icon={<FiShoppingBag />}
            />

            <FormInput
              label="Contact Name"
              error={errors.contactName?.message}
              register={register("contactName")}
              theme={theme}
              placeholder="Dara"
              icon={<FiUser />}
            />

            <FormInput
              label="Phone"
              error={errors.phone?.message}
              register={register("phone")}
              theme={theme}
              placeholder="012345678"
              icon={<FiPhone />}
            />

            <FormSelect
              label="Status"
              register={register("status")}
              options={["Active", "Inactive"]}
              theme={theme}
              icon={status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiFileText />}
          title="Additional Information"
          subtitle="Optional address and note for this customer."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <FormTextarea
            label="Address"
            register={register("address")}
            theme={theme}
            placeholder="Customer shop address"
            icon={<FiMapPin />}
          />

          <div className="mt-4">
            <FormTextarea
              label="Note"
              register={register("note")}
              theme={theme}
              placeholder="Any customer note..."
              icon={<FiFileText />}
            />
          </div>
        </div>
      </form>
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

function FormInput({
  label,
  required = false,
  register,
  theme,
  error = "",
  type = "text",
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
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
          placeholder={placeholder}
          {...register}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormTextarea({ label, register, theme, placeholder = "", icon }) {
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
          placeholder={placeholder}
          rows={3}
          {...register}
          className={`w-full resize-none rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${
            theme.input
          }`}
        />
      </div>
    </label>
  );
}

function FormSelect({ label, register, options, theme, icon }) {
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
          {...register}
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 ${theme.select}`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
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