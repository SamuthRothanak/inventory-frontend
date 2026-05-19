import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiSave, FiX } from "react-icons/fi";
import { categorySchema } from "../schemas/category.schema";
import { emptyCategoryForm, mapCategoryToForm } from "../utils/category.mapper";
import CategoryImage from "./CategoryImage";

export default function CategoryFormModal({
  mode,
  selectedCategory,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyCategoryForm,
  });

  useEffect(() => {
    if (selectedCategory) {
      reset(mapCategoryToForm(selectedCategory));
      return;
    }

    reset(emptyCategoryForm);
  }, [selectedCategory, reset]);

  const imageFile = watch("image");
  const status = watch("status");

  const previewImage = useMemo(() => {
    if (imageFile instanceof File) {
      return URL.createObjectURL(imageFile);
    }

    return selectedCategory?.image || "";
  }, [imageFile, selectedCategory]);

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <form
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111113] text-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "add" ? "Add Category" : "Edit Category"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Category image will be uploaded as form-data.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-300 transition hover:bg-white/10"
          >
            <FiX />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Category Name <span className="text-red-400">*</span>
            </span>
            <input
              {...register("name")}
              placeholder="Food"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1b1b1f] px-3 text-sm outline-none transition focus:border-red-500"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.name.message}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Description
            </span>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Best for 2026"
              className="w-full resize-none rounded-xl border border-white/10 bg-[#1b1b1f] px-3 py-3 text-sm outline-none transition focus:border-red-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Status
            </span>
            <select
              value={status ? "1" : "0"}
              onChange={(event) => {
                setValue("status", event.target.value === "1", {
                  shouldValidate: true,
                });
              }}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#1b1b1f] px-3 text-sm outline-none transition focus:border-red-500"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setValue("image", file, { shouldValidate: true });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#1b1b1f] px-3 py-2 text-sm text-zinc-300"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold text-zinc-400">Preview</p>
            <CategoryImage
              image={previewImage}
              name={watch("name") || "Category"}
              large
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSubmitting ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}