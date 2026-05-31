import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiBox,
  FiCheckCircle,
  FiHash,
  FiImage,
  FiInfo,
  FiPackage,
  FiSave,
  FiTag,
  FiXCircle,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import {
  productVariantDefaultValues,
  productVariantSchema,
} from "../schemas/productVariant.schema";

function onlyPositiveNumber(value, allowDecimal = true) {
  let nextValue = String(value || "");

  nextValue = nextValue.replace(/-/g, "");
  nextValue = nextValue.replace(/\+/g, "");
  nextValue = nextValue.replace(/e/gi, "");

  if (allowDecimal) {
    nextValue = nextValue.replace(/[^0-9.]/g, "");

    const parts = nextValue.split(".");
    if (parts.length > 2) {
      nextValue = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    return nextValue;
  }

  return nextValue.replace(/[^0-9]/g, "");
}

function onlyText(value) {
  return String(value || "").replace(/[0-9]/g, "");
}

function preventInvalidNumberKey(event, allowDecimal = true) {
  const invalidKeys = ["-", "+", "e", "E"];

  if (!allowDecimal) {
    invalidKeys.push(".");
  }

  if (invalidKeys.includes(event.key)) {
    event.preventDefault();
  }
}

export default function ProductVariantFormModal({
  mode,
  product,
  variant,
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
    resolver: zodResolver(productVariantSchema),
    defaultValues: productVariantDefaultValues,
  });

  const selectedImage = watch("imageFile");

  useEffect(() => {
    if (isEdit && variant) {
      reset({
        product_id: String(variant.productId || product?.id || ""),
        variant_code: variant.variantCode || "",
        variant_name: variant.variantName || "",
        package_type: variant.packageType || "",
        color: variant.color || "",
        size_value: String(variant.sizeValue || ""),
        size_unit: variant.sizeUnit || "",
        low_stock_threshold: Number(variant.lowStockThreshold || 0),
        status: variant.status === "Active",
        imageFile: null,
      });
      return;
    }

    reset({
      ...productVariantDefaultValues,
      product_id: String(product?.id || ""),
      variant_code: product?.name
        ? `PV-${String(product.name)
            .toUpperCase()
            .replaceAll(" ", "-")}-${Date.now().toString().slice(-4)}`
        : "",
      variant_name: product?.name ? `${product.name} ` : "",
    });
  }, [isEdit, product, variant, reset]);

  const submitForm = (values) => {
    onSave(values);
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Variant" : "Add Variant"}
      subtitle={`Product: ${
        product?.name || "-"
      } · Add can, bottle, box, set, kg, or custom variant.`}
      theme={theme}
      onClose={onClose}
      width="max-w-5xl"
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
            form="variant-form"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save Variant"}
          </button>
        </>
      }
    >
      <form
        id="variant-form"
        onSubmit={handleSubmit(submitForm)}
        className="space-y-6"
      >
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="mb-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <FiPackage />
            </div>

            <div>
              <h3 className="text-sm font-bold">Variant Information</h3>
              <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
                Example: Coca Cola 330ml Can, Coca Cola 330ml Bottle.
              </p>
            </div>
          </div>

          <input type="hidden" {...register("product_id")} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Variant Code"
              required
              error={errors.variant_code?.message}
              theme={theme}
              icon={<FiHash />}
              inputProps={register("variant_code")}
              placeholder="PV-COCA-330ML-CAN"
            />

            <FormInput
              label="Variant Name"
              required
              error={errors.variant_name?.message}
              theme={theme}
              icon={<FiPackage />}
              inputProps={register("variant_name")}
              placeholder="Coca Cola 330ml Can"
            />

            <FormInput
              label="Package Type"
              required
              error={errors.package_type?.message}
              theme={theme}
              icon={<FiBox />}
              inputProps={register("package_type")}
              placeholder="can, bottle, box"
            />

            <FormInput
              label="Color"
              sanitize="text"
              error={errors.color?.message}
              theme={theme}
              icon={<FiInfo />}
              inputProps={register("color")}
              placeholder="red"
            />

            <FormInput
              label="Size Value"
              sanitize="number"
              allowDecimal={true}
              error={errors.size_value?.message}
              theme={theme}
              icon={<FiHash />}
              inputProps={register("size_value")}
              placeholder="330"
            />

            <FormInput
              label="Size Unit"
              sanitize="text"
              error={errors.size_unit?.message}
              theme={theme}
              icon={<FiTag />}
              inputProps={register("size_unit")}
              placeholder="ml"
            />

            <FormInput
              label="Low Stock Threshold"
              type="number"
              sanitize="number"
              allowDecimal={false}
              error={errors.low_stock_threshold?.message}
              theme={theme}
              icon={<FiInfo />}
              inputProps={register("low_stock_threshold")}
            />

            <FormSelect
              label="Status"
              error={errors.status?.message}
              theme={theme}
              icon={watch("status") ? <FiCheckCircle /> : <FiXCircle />}
              value={watch("status") ? "1" : "0"}
              onChange={(value) =>
                setValue("status", value === "1", {
                  shouldValidate: true,
                })
              }
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
            />
          </div>

          <div className="mt-4">
            <ImageInput
              label="Variant Image"
              theme={theme}
              previewFile={selectedImage}
              currentImage={variant?.imagePath}
              altText={variant?.variantName || "Variant image"}
              onChange={(file) => {
                setValue("imageFile", file, {
                  shouldValidate: true,
                });
              }}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function ImageInput({
  label,
  theme,
  previewFile,
  currentImage,
  altText,
  onChange,
}) {
  const inputId = `${label.replace(/\s+/g, "-").toLowerCase()}-input`;
  const fileName = previewFile instanceof File ? previewFile.name : "";
  const previewUrl =
    previewFile instanceof File ? URL.createObjectURL(previewFile) : "";

  const imageToShow = previewUrl || currentImage || "";

  const handleRemoveImage = () => {
    onChange(null);

    const fileInput = document.getElementById(inputId);
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div className="rounded-2xl border border-dashed border-red-400/40 bg-red-500/[0.03] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
            {imageToShow ? (
              <img
                src={imageToShow}
                alt={altText || "Variant image"}
                className="h-full w-full object-cover"
              />
            ) : (
              <FiImage className="text-3xl text-red-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onChange(event.target.files?.[0] || null)}
            />

            <div className="flex flex-wrap gap-2">
              <label
                htmlFor={inputId}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Choose Image
              </label>

              {(previewUrl || currentImage) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  Remove Image
                </button>
              )}
            </div>

            <p className={`mt-3 text-sm ${theme.muted}`}>
              PNG, JPG, JPEG up to your backend limit.
            </p>

            {fileName ? (
              <p className="mt-2 truncate text-xs font-semibold text-emerald-500">
                Selected: {fileName}
              </p>
            ) : currentImage ? (
              <p className="mt-2 truncate text-xs font-semibold text-blue-500">
                Current image exists. Choose a new image to replace it.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </label>
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
  inputMode,
  sanitize = "none",
  allowDecimal = true,
}) {
  const isNumberInput = sanitize === "number" || type === "number";
  const isTextOnly = sanitize === "text";

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
          type={isNumberInput ? "text" : type}
          inputMode={
            inputMode ||
            (isNumberInput ? (allowDecimal ? "decimal" : "numeric") : undefined)
          }
          min={isNumberInput ? 0 : undefined}
          placeholder={placeholder}
          {...inputProps}
          onKeyDown={(event) => {
            if (isNumberInput) {
              preventInvalidNumberKey(event, allowDecimal);
            }

            inputProps?.onKeyDown?.(event);
          }}
          onPaste={(event) => {
            if (isNumberInput || isTextOnly) {
              event.preventDefault();

              const pastedText = event.clipboardData.getData("text");
              const cleanedValue = isNumberInput
                ? onlyPositiveNumber(pastedText, allowDecimal)
                : onlyText(pastedText);

              event.currentTarget.value = cleanedValue;

              inputProps?.onChange?.({
                target: {
                  name: inputProps.name,
                  value: cleanedValue,
                },
              });

              return;
            }

            inputProps?.onPaste?.(event);
          }}
          onChange={(event) => {
            let value = event.target.value;

            if (isNumberInput) {
              value = onlyPositiveNumber(value, allowDecimal);
            }

            if (isTextOnly) {
              value = onlyText(value);
            }

            event.target.value = value;
            inputProps?.onChange?.(event);
          }}
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

function FormSelect({
  label,
  error = "",
  theme,
  icon,
  value,
  onChange,
  options,
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

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
