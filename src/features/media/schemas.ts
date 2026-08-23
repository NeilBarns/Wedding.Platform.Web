import { z } from 'zod'

const mediaVariantSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  url: z.string().url(),
}).strict()

const mediaUsageReferenceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('sectionMedia') }).strict(),
  z.object({ type: z.literal('storyNarrativeBlock'), elementId: z.string().min(1), label: z.string().optional() }).strict(),
  z.object({
    type: z.literal('person'), personId: z.string().min(1), label: z.string().optional(),
    groupId: z.string().optional(), groupLabel: z.string().optional(),
  }).strict(),
])

const mediaUsageRecordSchema = z.object({
  mediaId: z.string().min(1),
  eventId: z.string().min(1),
  websiteProjectId: z.string().min(1),
  websiteProjectName: z.string().min(1),
  sectionId: z.string().min(1),
  sectionType: z.string().min(1),
  sectionName: z.string().min(1),
  reference: mediaUsageReferenceSchema,
}).strict()

export const mediaUsageSchema = z.object({
  isInUse: z.boolean(),
  references: z.array(mediaUsageRecordSchema),
}).strict()

export const mediaDeleteConflictSchema = z.object({
  code: z.literal('media_asset_in_use'),
  message: z.string(),
  usage: mediaUsageSchema,
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
