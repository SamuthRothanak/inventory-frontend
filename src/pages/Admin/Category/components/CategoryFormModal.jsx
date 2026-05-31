import React, { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiCheckCircle,
  FiChevronDown,
  FiFileText,
  FiImage,
  FiSave,
  FiTag,
  FiUploadCloud,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import CategoryImage from "./CategoryImage";
import {
  categoryDefaultValues,
  categorySchema,
} from "../schemas/categorySchema";

export default function CategoryFormModal({
  mode,
  selectedCategory,
  theme,
  serverMessage = "",
  isSaving,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryDefaultValues,
  });

  const imageFile = watch("imageFile");
  const imagePath = watch("imagePath");
  const status = watch("status");

  useEffect(() => {
    if (isEdit && selectedCategory) {
      reset({
        id: selectedCategory.id,
        isEdit: true,
        name: selectedCategory.name || "",
        description: selectedCategory.description || "",
        status: selectedCategory.status || "Active",
        imagePath: selectedCategory.imagePath || "",
        imageFile: null,
      });

      return;
    }

    reset(categoryDefaultValues);
  }, [isEdit, selectedCategory, reset]);

  const submitForm = (values) => {
    onSave({
      name: values.name.trim(),
      description: values.description?.trim() || "",
      imagePath: values.imagePath || "",
      imageFile: values.imageFile || null,
      status: values.status,
    });
  };

  const title = isEdit ? "Edit Category" : "Add Category";

  return (
    <ModalShell
      title={title}
      subtitle="Category image is optional but useful for POS category filters."
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
            form="category-form"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save Category"}
          </button>
        </>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit(submitForm)}
        className="space-y-4"
      >
        {serverMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {serverMessage}
          </div>
        )}

        <SectionTitle
          icon={<FiTag />}
          title="Basic Information"
          subtitle="Required category details for product management."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Category Name"
              required
              error={errors.name?.message}
              theme={theme}
              placeholder="Beverage"
              icon={<FiTag />}
              inputProps={register("name")}
            />

            <FormSelect
              label="Status"
              theme={theme}
              icon={status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
              inputProps={register("status")}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />

            <div className="md:col-span-2">
              <FormImageInput
                label="Image"
                file={imageFile}
                preview={imagePath}
                error={errors.imageFile?.message || errors.imagePath?.message}
                theme={theme}
                onChange={(file) => {
                  setValue("imageFile", file, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });

                  if (file) {
                    setValue("imagePath", URL.createObjectURL(file), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                onRemove={() => {
                  setValue("imageFile", null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });

                  setValue("imagePath", "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Description"
              theme={theme}
              placeholder="Drinks, soda, water, and juice"
              icon={<FiFileText />}
              inputProps={register("description")}
              error={errors.description?.message}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiImage />}
          title="Preview"
          subtitle="How this category may appear in the POS screen."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="flex items-center gap-4">
            <CategoryImage
              image={imagePath}
              name={watch("name") || "Category"}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {watch("name") || "Category Name"}
              </p>

              <p className={`mt-1 line-clamp-2 text-xs ${theme.muted}`}>
                {watch("description") || "Category description"}
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-500 dark:text-red-400"
                }`}
              >
                {status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
                {status}
              </span>
            </div>
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
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${
            theme.input
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormSelect({ label, theme, icon, inputProps, options }) {
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
          {...inputProps}
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

function FormImageInput({
  label,
  file,
  preview,
  onChange,
  onRemove,
  theme,
  error = "",
}) {
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
            : "border-zinc-300 bg-white/0 hover:border-red-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-red-500"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
            {preview ? (
              <img
                src={preview}
                alt="Category preview"
                className="h-full w-full object-cover"
              />
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
              Choose Image
            </label>

            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                onChange(selectedFile);
              }}
            />

            <p className={`mt-3 truncate text-sm ${theme.muted}`}>
              {file?.name || "PNG, JPG, JPEG up to your backend limit."}
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
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}