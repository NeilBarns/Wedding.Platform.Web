import { z } from 'zod'

const mediaVariantSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  url: z.string().url(),
}).strict()

export const mediaAssetSchema = z.object({
  id: z.string().min(1),
  originalFilename: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  variants: z.record(z.string(), mediaVariantSchema).refine(
    (variants) => variants.thumbnail !== undefined && variants.web !== undefined,
    'Thumbnail and web variants are required.',
  ),
}).strict()
