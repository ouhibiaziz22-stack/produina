import { z } from "zod";

const productType = z.enum([
  "hoodie",
  "jacket",
  "tshirt",
  "polo",
  "oversized",
  "other",
]);
const priceOption = z.object({
  name: z.string().trim().min(1).max(60),
  price: z.number().min(0),
});
const imageValue = z.string().refine((value) => {
  try {
    if (value.startsWith("data:image/")) return value.length <= 7_000_000;
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, "Image must be a valid URL or image data");
export const productSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: productType,
  description: z.string().trim().min(5).max(1000),
  basePrice: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  colors: z.array(z.string().trim().min(1)).min(1),
  fabrics: z.array(priceOption).min(1),
  printPrices: z.array(priceOption).default([
    { name: "DTF", price: 5 },
    { name: "Screen print", price: 5 },
    { name: "Embroidery", price: 10 },
    { name: "Vinyl", price: 7 },
  ]),
  colorZones: z
    .array(z.string().trim().min(1))
    .default(["body", "left sleeve", "right sleeve", "collar"]),
  allowedColorModes: z.array(z.literal(1).or(z.literal(2))).default([1, 2]),
  model3d: z
    .object({
      url: z.string().url().optional(),
      camera: z.record(z.string(), z.unknown()).optional(),
      materials: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  sizes: z.array(z.string().trim().min(1)).min(1),
  images: z.array(imageValue).default([]),
  active: z.boolean().default(true),
});
export const productCategory = z.enum(["main", "bac"]);
export const productSchemaWithCategory = productSchema.extend({
  category: productCategory.default("main"),
});
export const productUpdateSchema = productSchemaWithCategory.partial();
export const bacSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  image: z.string().url().optional(),
  active: z.boolean().default(true),
});
