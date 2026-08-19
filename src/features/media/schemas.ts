import { z } from 'zod'

const mediaVariantSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  url: z.string().url(),
}).strict()

const mediaUsageSchema = z.object({
  isInUse: z.boolean(),
  website: z.object({
    sections: z.array(z.object({
      sectionId: z.string().min(1),
      type: z.string().min(1),
      displayName: z.string().min(1),
      context: z.object({
        groupId: z.string().min(1),
        groupName: z.string(),
        personId: z.string().min(1),
        personName: z.string(),
      }).strict().optional(),
    }).strict()),
  }).strict(),
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
  usage: mediaUsageSchema,
}).strict()
