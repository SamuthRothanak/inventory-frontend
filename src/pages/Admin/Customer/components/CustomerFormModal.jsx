import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiCheckCircle,
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
import CustomerDropdown from "./CustomerDropdown";

const sanitizeInputValue = (value, mode) => {
  if (mode === "number") return String(value || "").replace(/[^0-9]/g, "");
  if (mode === "phone") return String(value || "").replace(/[^0-9+\-\s(),/]/g, "");
  if (mode === "shopName") return String(value || "").replace(/[^\p{L}\p{M}\p{N}\s&.,'()/-]/gu, "");
  if (mode === "text") return String(value || "").replace(/[^\p{L}\p{M}\s]/gu, "");
  return value;
};

export function ModalShell({ title, subtitle, theme, onClose, children, footer }) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:px-4 sm:py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-dvh max-h-dvh w-full max-w-[760px] flex-col overflow-hidden border-0 shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border ${theme.modal}`}
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
              aria-label="បិទផ្ទាំង"
              className="table-icon-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
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
  serverMessage = "",
}) {
  const title = mode === "add" ? "បន្ថែមអតិថិជន" : "កែអតិថិជន";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
      subtitle="រក្សាទុកតែអតិថិជនដែលត្រូវការកត់ត្រាសម្រាប់ការលក់ វិក្កយបត្រ និងការដឹកជញ្ជូន។"
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>

          <button
            type="submit"
            form="customer-form"
            disabled={isSaving}
            className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiSave />
            {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកអតិថិជន"}
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
          title="ព័ត៌មានមូលដ្ឋាន"
          subtitle="ព័ត៌មានចាំបាច់សម្រាប់គ្រប់គ្រងអតិថិជន។"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          {serverMessage && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
              {serverMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "edit" && (
              <FormInput
                label="លេខកូដអតិថិជន"
                error={errors.customerCode?.message}
                register={register("customerCode")}
                theme={theme}
                placeholder="CUS-001"
                icon={<FiHash />}
              />
            )}

            <FormInput
                label="ឈ្មោះហាង"
              required
              error={errors.shopName?.message}
              register={register("shopName")}
              theme={theme}
              placeholder="ដារ៉ា មីនីម៉ាត"
              icon={<FiShoppingBag />}
              sanitize="shopName"
            />

            <FormInput
              label="ឈ្មោះអ្នកទំនាក់ទំនង"
              required
              error={errors.contactName?.message}
              register={register("contactName")}
              theme={theme}
              placeholder="ដារ៉ា"
              icon={<FiUser />}
              sanitize="text"
            />

            <FormInput
              label="លេខទូរស័ព្ទ"
              required
              error={errors.phone?.message}
              register={register("phone")}
              theme={theme}
              placeholder="012345678 / 098765432"
              icon={<FiPhone />}
              sanitize="phone"
            />

            <FormSelect
              label="ស្ថានភាព"
              value={status}
              onChange={(value) => setValue("status", value, { shouldValidate: true })}
              register={register("status")}
              options={[
                { value: "Active", label: "ដំណើរការ" },
                { value: "Inactive", label: "មិនដំណើរការ" },
              ]}
              theme={theme}
              icon={status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiFileText />}
          title="ព័ត៌មានបន្ថែម"
          subtitle="អាសយដ្ឋាន និងចំណាំបន្ថែមសម្រាប់អតិថិជននេះ។"
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <FormTextarea
            label="អាសយដ្ឋាន"
            register={register("address")}
            theme={theme}
            placeholder="អាសយដ្ឋានហាងអតិថិជន"
            icon={<FiMapPin />}
          />

          <div className="mt-4">
            <FormTextarea
              label="ចំណាំ"
              register={register("note")}
              theme={theme}
              placeholder="ចំណាំអំពីអតិថិជន..."
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
      <div className="summary-icon-3d mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
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
  sanitize = "",
}) {
  const inputProps = {
    ...register,
    onChange: (event) => {
      event.target.value = sanitizeInputValue(event.target.value, sanitize);
      register?.onChange?.(event);
    },
  };

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
          {...inputProps}
          inputMode={sanitize === "number" ? "numeric" : sanitize === "phone" ? "tel" : undefined}
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

function FormSelect({ label, required = false, register, options, theme, icon, value, onChange }) {
  const mappedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );
  const handleChange = (nextValue) => {
    if (onChange) {
      onChange(nextValue);
      return;
    }

    register?.onChange?.({
      target: {
        name: register.name,
        value: nextValue,
      },
    });
  };

  return (
    <CustomerDropdown
      label={label}
      required={required}
      theme={theme}
      icon={icon}
      value={value}
      onChange={handleChange}
      options={mappedOptions}
      searchable={mappedOptions.length > 6}
      heightClass="h-11"
      roundedClass="rounded-xl"
    />
  );
}
