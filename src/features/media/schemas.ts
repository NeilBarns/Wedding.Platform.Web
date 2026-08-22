import { z } from 'zod'

const mediaVariantSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  url: z.string().url(),
}).strict()

const peopleUsageContextSchema = z.object({
  groupId: z.string().min(1),
  groupName: z.string(),
  personId: z.string().min(1),
  personName: z.string(),
}).strict()

const storyUsageContextSchema = z.object({
  blockId: z.string().min(1),
  blockHeading: z.string().nullable().optional(),
}).strict()

const mediaWebsiteSectionUsageSchema = z.union([
  z.object({
    sectionId: z.string().min(1),
    type: z.literal('people'),
    displayName: z.string().min(1),
    context: peopleUsageContextSchema,
  }).strict(),
  z.object({
    sectionId: z.string().min(1),
    type: z.literal('story'),
    displayName: z.string().min(1),
    context: storyUsageContextSchema,
  }).strict(),
  z.object({
    sectionId: z.string().min(1),
    type: z.string().min(1),
    displayName: z.string().min(1),
    context: z.undefined().optional(),
  }).strict(),
])

const mediaUsageSchema = z.object({
  isInUse: z.boolean(),
  website: z.object({
    sections: z.array(mediaWebsiteSectionUsageSchema),
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
