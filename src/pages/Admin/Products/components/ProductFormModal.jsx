import React, { useEffect } from "react";
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
  FiXCircle,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
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
        expiry_date: product.expiryDate || "",
        status: product.status === "Active" ? "active" : "inactive",
        imageFile: null,
      });
      return;
    }

    reset(productDefaultValues);
  }, [isEdit, product, reset]);

  const onSubmit = (values) => {
    onSave(values);
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Product" : "Add Product"}
      subtitle="Create product master data before adding variants, units, and price rules."
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
            form="product-form"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save Product"}
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
              <h3 className="text-sm font-bold">Product Information</h3>
              <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
                Main product details, category, status, expiry date, and image.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Product Name"
              required
              error={errors.name?.message}
              theme={theme}
              icon={<FiPackage />}
              inputProps={register("name")}
              placeholder="Coca Cola"
            />

            <FormSelect
              label="Category"
              required
              error={errors.category_id?.message}
              theme={theme}
              icon={<FiGrid />}
              inputProps={register("category_id")}
              options={[
                { value: "", label: "Select category" },
                ...categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                })),
              ]}
            />

            <FormInput
              label="Expiry Date"
              type="date"
              error={errors.expiry_date?.message}
              theme={theme}
              icon={<FiFileText />}
              inputProps={register("expiry_date")}
            />

            <FormSelect
              label="Status"
              error={errors.status?.message}
              theme={theme}
              icon={
                watch("status") === "active" ? (
                  <FiCheckCircle />
                ) : (
                  <FiXCircle />
                )
              }
              inputProps={register("status")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Description"
              error={errors.description?.message}
              theme={theme}
              icon={<FiFileText />}
              inputProps={register("description")}
              placeholder="Coca Cola soft drink can 330ml"
            />
          </div>

          <div className="mt-4">
            <label className="block">
              <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
                Product Image
              </span>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
                <div className="relative">
                  <span
                    className={`pointer-events-none absolute left-3.5 top-5 -translate-y-1/2 text-base ${theme.muted}`}
                  >
                    <FiImage />
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setValue("imageFile", event.target.files?.[0] || null, {
                        shouldValidate: true,
                      });
                    }}
                    className={`h-11 w-full rounded-xl border pl-10 pr-3 pt-2 text-sm outline-none transition focus:ring-4 ${theme.input}`}
                  />
                </div>

                <div className={`flex h-28 items-center justify-center overflow-hidden rounded-xl border ${theme.softCard}`}>
                  {selectedImage instanceof File ? (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : product?.imagePath ? (
                    <img
                      src={product.imagePath}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiImage className="text-3xl text-red-500" />
                  )}
                </div>
              </div>

              {errors.imageFile?.message && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.imageFile.message}
                </p>
              )}
            </label>
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

function FormSelect({
  label,
  required = false,
  error = "",
  theme,
  icon,
  inputProps,
  options,
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
          {...inputProps}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.select} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}