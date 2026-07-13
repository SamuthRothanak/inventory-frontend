import { z } from "zod";

const fileSchema = z
  .any()
  .optional()
  .nullable()
  .refine((file) => {
    if (!file) return true;
    if (typeof File === "undefined") return true;
    return file instanceof File;
  }, "រូបភាពត្រូវតែជា file ត្រឹមត្រូវ។")
  .refine((file) => {
    if (!file) return true;
    return file.size <= 5 * 1024 * 1024;
  }, "ទំហំរូបភាពត្រូវតែតិចជាង 5MB។")
  .refine((file) => {
    if (!file) return true;
    return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
      file.type
    );
  }, "រូបភាពត្រូវតែជា JPG, PNG, ឬ WEBP។");

export const categorySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  isEdit: z.boolean().optional(),

  name: z
    .string()
    .trim()
    .min(1, "ឈ្មោះប្រភេទចាំបាច់ត្រូវតែបំពេញ។")
    .max(100, "ឈ្មោះប្រភេទត្រូវតែតិចជាង 100 តួអក្សរ។")
    .regex(/^[\p{L}\p{M}\s]+$/u, "ឈ្មោះប្រភេទត្រូវតែជាអក្សរ និងដកឃ្លា។"),

  description: z
    .string()
    .trim()
    .max(500, "ការពិពណ៌នាត្រូវតែតិចជាង 500 តួអក្សរ។")
    .optional()
    .or(z.literal("")),

  status: z.enum(["Active", "Inactive"], {
    message: "ស្ថានភាពចាំបាច់ត្រូវតែជ្រើស។",
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
