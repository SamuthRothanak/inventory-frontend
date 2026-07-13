import React, { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiBox,
  FiCheckCircle,
  FiFileText,
  FiGrid,
  FiImage,
  FiPackage,
  FiSave,
  FiUploadCloud,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import SearchableDropdown from "./SearchableDropdown";
import {
  productDefaultValues,
  productSchema,
} from "../schemas/product.schema";

export default function ProductFormModal({
  mode,
  product,
  categories,
  theme,
  isSaving,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: productDefaultValues,
  });

  const selectedImage = watch("imageFile");

  useEffect(() => {
    if (isEdit && product) {
      reset({
        name: product.name || "",
        category_id: String(product.categoryId || ""),
        description: product.description || "",
        status:
          String(product.status || "").toLowerCase() === "active"
            ? "active"
            : "inactive",
        imageFile: null,
      });
      return;
    }

    reset(productDefaultValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, product?.id, reset]);

  const onSubmit = (values) => {
    onSave(values);
  };

  return (
    <ModalShell
      title={isEdit ? "កែផលិតផល" : "បន្ថែមផលិតផល"}
      subtitle="បង្កើតទិន្នន័យផលិតផលមុនពេលបន្ថែម មុខទំនិញ, units, និងតម្លៃ។"
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>

          <button
            type="submit"
            form="product-form"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកផលិតផល"}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="mb-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <FiBox />
            </div>

            <div>
              <h3 className="text-sm font-bold">ព័ត៌មានផលិតផល</h3>
              <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
                ព័ត៌មានសំខាន់ ប្រភេទ ស្ថានភាព និងរូបភាព។
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="ឈ្មោះផលិតផល"
              required
              error={errors.name?.message}
              theme={theme}
              icon={<FiPackage />}
              inputProps={register("name")}
              placeholder="Coca Cola"
            />

            <FormSelect
              label="ប្រភេទ"
              required
              error={errors.category_id?.message}
              theme={theme}
              icon={<FiGrid />}
              value={watch("category_id")}
              onChange={(value) => setValue("category_id", value, { shouldValidate: true })}
              inputProps={register("category_id")}
              options={[
                { value: "", label: "ជ្រើសរើសប្រភេទ" },
                ...categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                })),
              ]}
            />

            <FormSelect
              label="ស្ថានភាព"
              error={errors.status?.message}
              theme={theme}
              icon={
                watch("status") === "active" ? (
                  <FiCheckCircle />
                ) : (
                  <FiXCircle />
                )
              }
              value={watch("status")}
              onChange={(value) => setValue("status", value, { shouldValidate: true })}
              inputProps={register("status")}
              options={[
                { value: "active", label: "ដំណើរការ" },
                { value: "inactive", label: "មិនដំណើរការ" },
              ]}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="ការពិពណ៌នា"
              error={errors.description?.message}
              theme={theme}
              icon={<FiFileText />}
              inputProps={register("description")}
              placeholder="Coca Cola soft drink can 330ml"
            />
          </div>

          <div className="mt-4">
            <FormImageInput
              label="រូបភាពផលិតផល"
              file={selectedImage}
              preview={
                selectedImage instanceof File
                  ? URL.createObjectURL(selectedImage)
                  : product?.imagePath || ""
              }
              error={errors.imageFile?.message}
              theme={theme}
              onChange={(file) =>
                setValue("imageFile", file, { shouldValidate: true })
              }
              onRemove={() =>
                setValue("imageFile", null, { shouldValidate: true })
              }
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function FormInput({
  label,
  required = false,
  error = "",
  theme,
  icon,
  inputProps,
  type = "text",
  placeholder = "",
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
          {...inputProps}
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

function FormTextarea({
  label,
  error = "",
  theme,
  icon,
  inputProps,
  placeholder = "",
}) {
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
          rows={3}
          placeholder={placeholder}
          {...inputProps}
          className={`w-full resize-none rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormImageInput({ label, file, preview, onChange, onRemove, theme, error = "" }) {
  const inputId = useId();

  return (
    <div className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div
        className={`rounded-2xl border border-dashed p-4 transition ${
          error
            ? "border-red-500 bg-red-500/5"
            : "border-zinc-300 bg-white/0 hover:border-red-400 hover:bg-red-500/[0.03] focus-within:border-red-500 focus-within:bg-red-500/[0.04] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-red-500 dark:focus-within:border-red-500"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
            {preview ? (
              <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <FiImage className="text-3xl text-red-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <label
              htmlFor={inputId}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <FiUploadCloud className="text-lg" />
              ជ្រើសរើសរូបភាព
            </label>

            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onChange(event.target.files?.[0] || null)}
            />

            <p className={`mt-3 truncate text-sm ${theme.muted}`}>
              {file?.name || "JPG, PNG, WEBP · Max 2 MB"}
            </p>

            {file && (
              <p className="mt-1 text-xs text-zinc-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {(file || preview) && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX />
              លុបចេញ
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function FormSelect({
  label,
  required = false,
  error = "",
  theme,
  icon,
  inputProps,
  value,
  onChange,
  options,
}) {
  const handleChange = (nextValue) => {
    if (onChange) {
      onChange(nextValue);
      return;
    }

    inputProps?.onChange?.({
      target: {
        name: inputProps.name,
        value: nextValue,
      },
    });
  };

  return (
    <SearchableDropdown
      label={label}
      required={required}
      error={error}
      theme={theme}
      icon={icon}
      value={value ?? ""}
      onChange={handleChange}
      options={options}
      searchable={options.length > 6}
    />
  );
}
