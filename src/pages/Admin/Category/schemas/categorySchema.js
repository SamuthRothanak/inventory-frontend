import { z } from "zod";

const fileSchema = z
  .any()
  .optional()
  .nullable()
  .refine((file) => {
    if (!file) return true;
    if (typeof File === "undefined") return true;
    return file instanceof File;
  }, "Image must be a valid file.")
  .refine((file) => {
    if (!file) return true;
    return file.size <= 5 * 1024 * 1024;
  }, "Image size must be less than 5MB.")
  .refine((file) => {
    if (!file) return true;
    return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
      file.type
    );
  }, "Image must be JPG, PNG, or WEBP.");

export const categorySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  isEdit: z.boolean().optional(),

  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(100, "Category name must be less than 100 characters.")
    .regex(/^[\p{L}\s]+$/u, "Category name can contain letters and spaces only."),

  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters.")
    .optional()
    .or(z.literal("")),

  status: z.enum(["Active", "Inactive"], {
    message: "Status is required.",
  }),

  imagePath: z.string().optional().or(z.literal("")),
  imageFile: fileSchema,
});

export const categoryDefaultValues = {
  id: "",
  isEdit: false,
  name: "",
  description: "",
  status: "Active",
  imagePath: "",
  imageFile: null,
};
