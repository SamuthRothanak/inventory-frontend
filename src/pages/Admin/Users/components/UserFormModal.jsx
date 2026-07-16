import { useState } from "react";
import { useEffect, useRef } from "react";
import {
  FiCheck,
  FiX,
  FiSave,
  FiUser,
  FiLock,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiPhone,
  FiHash,
  FiChevronDown,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const sanitizePhone = (value) =>
  String(value || "").replace(/[^0-9+\-\s(),/]/g, "");

export default function UserFormModal({
  isEdit,
  register,
  watch,
  setValue,
  handleSubmit,
  onSubmit,
  errors,
  serverMessage,
  closeModal,
  createMutation,
  updateMutation,
  resetPasswordMutation,
  theme,
}) {
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    (resetPasswordMutation?.isPending ?? false);

  return (
    <div
      onMouseDown={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
      >
        {/* Header */}
        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">
                {isEdit ? "កែអ្នកប្រើប្រាស់" : "បន្ថែមអ្នកប្រើប្រាស់"}
              </h2>

              <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                {isEdit
                  ? "កែព័ត៌មានអ្នកប្រើប្រាស់ និងតួនាទី ។"
                  : "បង្កើតគណនីអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ ។"}
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="បិទផ្ទាំង"
              disabled={isSaving}
              className="
                flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
                border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm
                transition hover:bg-zinc-200 hover:text-zinc-950
                disabled:cursor-not-allowed disabled:opacity-70
                dark:border-white/10 dark:bg-white/5 dark:text-zinc-300
                dark:hover:bg-white/10 dark:hover:text-white
              "
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* IMPORTANT: form must be flex-col + min-h-0 */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scroll body */}
          <div
            className={`
              min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5
              [scroll-behavior:smooth] [scrollbar-gutter:stable]
              ${theme.modalBody}
            `}
          >
            <input type="hidden" {...register("id", { valueAsNumber: true })} />
            <input type="hidden" {...register("isEdit")} />

            <div className="space-y-5 pb-2">
              {serverMessage && (
                <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <span>{serverMessage}</span>
                </div>
              )}

              <FormSection
                title="១. ព័ត៌មានអ្នកប្រើប្រាស់"
                subtitle="ព័ត៌មានផ្ទាល់ខ្លួននិងទំនាក់ទំនង ។"
                icon={<FiUser />}
                theme={theme}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormInput
                    label="ឈ្មោះពេញ"
                    required
                    register={register("name")}
                    error={errors.name}
                    placeholder="ឈ្មោះពេញ"
                    theme={theme}
                    icon={<FiUser />}
                  />

                  <FormInput
                    label="ឈ្មោះអ្នកប្រើ"
                    required
                    register={register("username")}
                    error={errors.username}
                    placeholder="បញ្ចូលឈ្មោះអ្នកប្រើ"
                    theme={theme}
                    icon={<FiHash />}
                  />

                  <FormInput
                    label="អ៊ីមែល"
                    required
                    type="email"
                    register={register("email")}
                    error={errors.email}
                    placeholder="example@gmail.com"
                    theme={theme}
                    icon={<FiMail />}
                  />

                  <FormInput
                    label="ទូរស័ព្ទ"
                    register={register("phone")}
                    error={errors.phone}
                    placeholder="012345678 / 098765432"
                    theme={theme}
                    icon={<FiPhone />}
                    sanitize={sanitizePhone}
                  />
                </div>
              </FormSection>

              <FormSection
                title={isEdit ? "២. ផ្លាស់ប្ដូរលេខសម្ងាត់" : "២. លេខសម្ងាត់"}
                subtitle={
                  isEdit
                    ? "ទុកទំនេរដើម្បីរក្សាលេខសម្ងាត់ចាស់ ។"
                    : "កំណត់លេខសម្ងាត់សម្រាប់ចូលប្រព័ន្ធ ។"
                }
                icon={<FiLock />}
                theme={theme}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <PasswordInput
                    label={isEdit ? "លេខសម្ងាត់ថ្មី" : "លេខសម្ងាត់"}
                    required={!isEdit}
                    register={register("password")}
                    error={errors.password}
                    placeholder={isEdit ? "ទុកទំនេរដើម្បីរក្សាលេខសម្ងាត់ចាស់" : "យ៉ាងតិច 6 តួអក្សរ"}
                    autoComplete="new-password"
                    theme={theme}
                  />

                  <PasswordInput
                    label="បញ្ជាក់លេខសម្ងាត់"
                    required={!isEdit}
                    register={register("password_confirmation")}
                    error={errors.password_confirmation}
                    placeholder="បញ្ជាក់លេខសម្ងាត់"
                    autoComplete="new-password"
                    theme={theme}
                  />
                </div>
              </FormSection>

              <FormSection
                title={isEdit ? "៣. តួនាទី & ស្ថានភាព" : "៣. តួនាទី & សិទ្ធិ"}
                subtitle={isEdit ? "កែតួនាទីនិងស្ថានភាពគណនី ។" : "តួនាទីកំណត់សិទ្ធិចូលប្រើប្រព័ន្ធ ។"}
                icon={<FiShield />}
                theme={theme}
              >
                <div className={`grid gap-4 ${isEdit ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                  <FormSelect
                    label="តួនាទី"
                    required
                    register={register("role")}
                    value={watch("role")}
                    onChange={(value) => setValue("role", value, { shouldValidate: true, shouldDirty: true })}
                    error={errors.role}
                    theme={theme}
                    icon={<FiShield />}
                    options={[
                      { value: "staff",   label: "បុគ្គលិក" },
                      { value: "admin",   label: "អ្នកគ្រប់គ្រង" },
                      { value: "cashier", label: "អ្នកគិតលុយ" },
                    ]}
                  />

                  {isEdit && (
                    <FormSelect
                      label="ស្ថានភាព"
                      required
                      register={register("status")}
                      value={watch("status")}
                      onChange={(value) => setValue("status", value, { shouldValidate: true, shouldDirty: true })}
                      error={errors.status}
                      theme={theme}
                      icon={watch("status") === "active" ? <FiCheckCircle /> : <FiXCircle />}
                      options={[
                        { value: "active",   label: "ដំណើរការ" },
                        { value: "inactive", label: "មិនដំណើរការ" },
                      ]}
                    />
                  )}
                </div>
              </FormSection>
            </div>
          </div>

          {/* Footer */}
          <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="
                  h-11 rounded-xl border border-zinc-300 bg-white px-5
                  text-sm font-semibold text-zinc-700 shadow-sm transition
                  hover:bg-zinc-100 hover:text-zinc-950
                  disabled:cursor-not-allowed disabled:opacity-70
                  dark:border-white/10 dark:bg-white/5 dark:text-zinc-200
                  dark:hover:bg-white/10 dark:hover:text-white
                "
              >
                បោះបង់
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="
                  inline-flex h-11 items-center justify-center gap-2 rounded-xl
                  bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm
                  transition hover:bg-emerald-600
                  disabled:cursor-not-allowed disabled:opacity-70
                "
              >
                <FiSave />
                {isSaving ? "កំពុងរក្សាទុក..." : isEdit ? "កែអ្នកប្រើប្រាស់" : "រក្សាទុក"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold">{title}</h3>

          {subtitle && (
            <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
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
  required = false,
  register,
  error,
  theme,
  type = "text",
  placeholder = "",
  icon,
  sanitize,
}) {
  const inputProps = sanitize
    ? {
        ...register,
        onChange: (event) => {
          event.target.value = sanitize(event.target.value);
          register?.onChange?.(event);
        },
      }
    : register;

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
          {...inputProps}
          placeholder={placeholder}
          inputMode={sanitize === sanitizePhone ? "tel" : undefined}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
    </label>
  );
}

function PasswordInput({ label, required = false, register, error, theme, placeholder = "", autoComplete = "new-password" }) {
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
          <FiLock />
        </span>

        <input
          type={show ? "text" : "password"}
          {...register}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border pl-10 pr-10 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-base transition hover:opacity-70 ${theme.muted}`}
          tabIndex={-1}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
    </label>
  );
}

function FormSelect({
  label,
  required = false,
  register,
  value,
  onChange,
  error,
  theme,
  options,
  icon,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];
  const themeText = [theme.select, theme.input, theme.modal, theme.section].join(" ");
  const isDark = Boolean(theme.isDark) || themeText.includes("bg-[#") || themeText.includes("bg-zinc-900") || themeText.includes("text-white");
  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <label className="block" ref={wrapperRef}>
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        <input type="hidden" {...register} />

        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className={`flex h-11 w-full items-center justify-between rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-3 text-left text-sm outline-none transition focus:ring-4 ${
            theme.select || theme.input
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          <span className="truncate">{selectedOption?.label || ""}</span>
          <FiChevronDown
            className={`ml-2 shrink-0 text-base transition ${theme.muted} ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className={`absolute z-50 mt-2 w-full overflow-hidden rounded-xl border ${dropdownClass}`}>
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((option) => {
                const isActive = String(option.value) === String(value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-red-500/10 font-semibold text-red-500 dark:text-red-400"
                        : isDark
                        ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isActive && <FiCheck className="ml-2 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
    </label>
  );
} 
