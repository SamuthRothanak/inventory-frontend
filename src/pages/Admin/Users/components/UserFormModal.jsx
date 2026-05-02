import {
  FiX,
  FiSave,
  FiUser,
  FiLock,
  FiShield,
  FiMail,
  FiPhone,
  FiHash,
  FiChevronDown,
  FiAlertCircle,
} from "react-icons/fi";

export default function UserFormModal({
  isEdit,
  register,
  handleSubmit,
  onSubmit,
  errors,
  serverMessage,
  closeModal,
  createMutation,
  updateMutation,
  theme,
}) {
  const isSaving = createMutation.isPending || updateMutation.isPending;

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
                {isEdit ? "Update User" : "Add User"}
              </h2>

              <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                {isEdit
                  ? "Update user information and role."
                  : "Create a new system user with login credentials."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
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
                title="1. User Information"
                subtitle="Basic user profile and contact information."
                icon={<FiUser />}
                theme={theme}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormInput
                    label="Full Name"
                    required
                    register={register("name")}
                    error={errors.name}
                    placeholder="Full name"
                    theme={theme}
                    icon={<FiUser />}
                  />

                  <FormInput
                    label="Username"
                    required
                    register={register("username")}
                    error={errors.username}
                    placeholder="Enter username"
                    theme={theme}
                    icon={<FiHash />}
                  />

                  <FormInput
                    label="Email"
                    required
                    type="email"
                    register={register("email")}
                    error={errors.email}
                    placeholder="example@gmail.com"
                    theme={theme}
                    icon={<FiMail />}
                  />

                  <FormInput
                    label="Phone"
                    register={register("phone")}
                    error={errors.phone}
                    placeholder="Enter phone number"
                    theme={theme}
                    icon={<FiPhone />}
                  />
                </div>
              </FormSection>

              {!isEdit && (
                <FormSection
                  title="2. Password"
                  subtitle="Set secure login credentials for this user."
                  icon={<FiLock />}
                  theme={theme}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                      label="Password"
                      required
                      type="password"
                      register={register("password")}
                      error={errors.password}
                      placeholder="Min 6 characters"
                      theme={theme}
                      icon={<FiLock />}
                    />

                    <FormInput
                      label="Confirm Password"
                      required
                      type="password"
                      register={register("password_confirmation")}
                      error={errors.password_confirmation}
                      placeholder="Confirm password"
                      theme={theme}
                      icon={<FiLock />}
                    />
                  </div>
                </FormSection>
              )}

              <FormSection
                title={isEdit ? "2. Role & Access" : "3. Role & Access"}
                subtitle="Role controls what this user can access in the system."
                icon={<FiShield />}
                theme={theme}
              >
                <FormSelect
                  label="Role"
                  required
                  register={register("role")}
                  error={errors.role}
                  theme={theme}
                  icon={<FiShield />}
                  options={[
                    { value: "staff", label: "Staff" },
                    { value: "admin", label: "Admin" },
                    { value: "cashier", label: "Cashier" },
                  ]}
                />

                <p className={`mt-3 text-xs leading-5 ${theme.muted}`}>
                  Admin can manage system data. Cashier is mainly for POS. Staff
                  has limited access.
                </p>
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
                Cancel
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
                {isSaving ? "Saving..." : isEdit ? "Update User" : "Save User"}
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
          {...register}
          placeholder={placeholder}
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

function FormSelect({
  label,
  required = false,
  register,
  error,
  theme,
  options,
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

        <select
          {...register}
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 ${
            theme.select || theme.input
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
    </label>
  );
} 