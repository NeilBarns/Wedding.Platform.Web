import { z } from "zod";
import {
  WEBSITE_ELEMENT_LIMITS,
  WEBSITE_LEAF_ELEMENT_TYPES,
} from "./constants";
import { normalizeTextContent, validateTextFontTuple } from "./text";

export const elementIdSchema = z
  .string()
  .max(WEBSITE_ELEMENT_LIMITS.id)
  .refine((value) => value.trim().length > 0, "Element ID is required.")
  .transform((value) => value.trim());

const mediaIdSchema = z
  .string()
  .ulid()
  .refine(
    (value) => value[0] >= "0" && value[0] <= "7",
    "Media ID must be a canonical ULID.",
  );
const shortTextSchema = z.string().max(WEBSITE_ELEMENT_LIMITS.shortText);
const baseShape = { id: elementIdSchema };
export const elementFontSizeSchema = z.enum(["xs", "s", "m", "l", "xl"]);
export const elementLineSpacingSchema = z.enum(["tight", "normal", "relaxed"]);
export const elementLetterSpacingSchema = z.enum(["tight", "normal", "wide"]);
export const textAlignmentSchema = z.enum(["start", "center", "end"]);
export const textTransformSchema = z.enum(["none", "uppercase", "lowercase", "capitalize"]);
export const textResponsiveAppearanceSchema = z.object({
  fontSize: elementFontSizeSchema.optional(),
  alignment: textAlignmentSchema.optional(),
}).strict();
export const textAppearanceSchema = z.object({
  fontFamilyId: z.string().min(1).optional(),
  fontSize: elementFontSizeSchema.optional(),
  fontWeight: z.union([z.literal(400), z.literal(600), z.literal(700)]).optional(),
  lineHeight: elementLineSpacingSchema.optional(),
  letterSpacing: elementLetterSpacingSchema.optional(),
  alignment: textAlignmentSchema.optional(),
  colorId: z.string().min(1).optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  textTransform: textTransformSchema.optional(),
  responsive: z.object({
    tablet: textResponsiveAppearanceSchema.optional(),
    mobile: textResponsiveAppearanceSchema.optional(),
  }).strict().optional(),
}).strict();
const responsiveFontSizeSchema = z
  .object({
    desktop: elementFontSizeSchema.optional(),
    tablet: elementFontSizeSchema.optional(),
    mobile: elementFontSizeSchema.optional(),
  })
  .strict();
const narrativeSlotAppearanceSchema = z
  .object({
    fontFamilyId: z.string().min(1).optional(),
    fontSize: responsiveFontSizeSchema.optional(),
    lineSpacing: elementLineSpacingSchema.optional(),
    letterSpacing: elementLetterSpacingSchema.optional(),
    colorId: z.string().min(1).optional(),
  })
  .strict();

export const headingElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("heading"),
    text: shortTextSchema,
  })
  .strict();

export const textElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("text"),
    text: z.string().max(WEBSITE_ELEMENT_LIMITS.text).transform(normalizeTextContent),
    appearance: textAppearanceSchema.optional(),
  })
  .strict()
  .superRefine((element, context) => {
    const issue = validateTextFontTuple(element.appearance ?? {});
    if (issue) context.addIssue({ code: "custom", message: issue, path: ["appearance"] });
  });

const richTextMarksSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  link: z.string().max(WEBSITE_ELEMENT_LIMITS.externalUrl).url().refine((value) => ["http:", "https:", "mailto:"].includes(new URL(value).protocol), "Unsupported link protocol.").optional(),
}).strict();
export const richTextRunSchema = z.object({ text: z.string(), marks: richTextMarksSchema.optional() }).strict();
const richTextParagraphSchema = z.object({ type: z.literal("paragraph"), children: z.array(richTextRunSchema).min(1) }).strict();
const richTextListSchema = z.object({ type: z.enum(["bulletList", "orderedList"]), items: z.array(z.array(richTextRunSchema).min(1)).min(1) }).strict();
export const richTextDocumentSchema = z.object({ type: z.literal("doc"), children: z.array(z.union([richTextParagraphSchema, richTextListSchema])).min(1).max(100) }).strict().superRefine((document, context) => {
  const length = document.children.reduce((total, block) => total + (block.type === "paragraph" ? block.children : block.items.flat()).reduce((sum, run) => sum + run.text.length, 0), 0);
  if (length > WEBSITE_ELEMENT_LIMITS.richText) context.addIssue({ code: "custom", message: `Rich Text cannot exceed ${WEBSITE_ELEMENT_LIMITS.richText} characters.` });
});
export const richTextAppearanceSchema = textAppearanceSchema.pick({ fontFamilyId: true, fontSize: true, lineHeight: true, letterSpacing: true, alignment: true, colorId: true, textTransform: true, responsive: true }).strict();
export const richTextElementSchema = z.object({
  ...baseShape,
  type: z.literal("richText"),
  document: richTextDocumentSchema,
  appearance: richTextAppearanceSchema.optional(),
}).strict();

export const imageElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("image"),
    mediaId: mediaIdSchema,
  })
  .strict();

const dividerAppearanceSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const appearance = { ...(value as Record<string, unknown>) };
  if (appearance.assetId === undefined && typeof appearance.styleId === "string") appearance.assetId = appearance.styleId;
  delete appearance.styleId;
  if (typeof appearance.width === "string") {
    const legacyWidths: Record<string, number> = { small: 0, medium: 50, large: 100, full: 100 };
    appearance.width = legacyWidths[appearance.width] ?? appearance.width;
  }
  if (typeof appearance.opacity === "string" && /^\d+$/.test(appearance.opacity)) appearance.opacity = Number(appearance.opacity);
  return appearance;
}, z.object({
  assetId: z.string().min(1).max(100).optional(),
  width: z.number().int().min(0).max(100).optional(),
  alignment: textAlignmentSchema.optional(),
  colorId: z.string().min(1).optional(),
  opacity: z.number().int().min(25).max(100).optional(),
}).strict());

export const dividerElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("divider"),
    appearance: dividerAppearanceSchema.optional(),
  })
  .strict();

export const quoteElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("quote"),
    text: z.string().max(WEBSITE_ELEMENT_LIMITS.text),
    attribution: shortTextSchema.optional(),
  })
  .strict();

const scrollToSectionActionSchema = z
  .object({
    type: z.literal("scrollToSection"),
    sectionId: elementIdSchema,
  })
  .strict();

const externalUrlActionSchema = z
  .object({
    type: z.literal("externalUrl"),
    url: z
      .string()
      .max(WEBSITE_ELEMENT_LIMITS.externalUrl)
      .url()
      .refine(
        (value) => new URL(value).protocol === "https:",
        "External URLs must use HTTPS.",
      ),
  })
  .strict();

export const ctaActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rsvp") }).strict(),
  scrollToSectionActionSchema,
  z.object({ type: z.literal("viewVenue") }).strict(),
  z.object({ type: z.literal("viewSchedule") }).strict(),
  z.object({ type: z.literal("viewGallery") }).strict(),
  z.object({ type: z.literal("backToTop") }).strict(),
  externalUrlActionSchema,
]);

export const ctaElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("cta"),
    label: shortTextSchema,
    action: ctaActionSchema,
  })
  .strict();

export const mediaCollectionItemSchema = z
  .object({
    id: elementIdSchema,
    mediaId: mediaIdSchema,
  })
  .strict();

export const mediaCollectionElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("mediaCollection"),
    items: z.array(mediaCollectionItemSchema),
  })
  .strict();

const narrativeMediaSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("image"), mediaId: mediaIdSchema }).strict(),
  z.object({ type: z.literal("video"), mediaId: mediaIdSchema }).strict(),
  z
    .object({
      type: z.literal("mediaCollection"),
      presentation: z.enum([
        "grid",
        "masonry",
        "carousel",
        "editorial",
        "filmstrip",
      ]),
      items: z.array(mediaCollectionItemSchema),
    })
    .strict(),
]);

const narrativeTextSlotSchema = z
  .object({
    isHidden: z.boolean(),
    text: z.string().max(WEBSITE_ELEMENT_LIMITS.narrativeBody),
    appearance: narrativeSlotAppearanceSchema.optional(),
  })
  .strict();

const narrativeQuoteSlotSchema = narrativeTextSlotSchema
  .extend({ attribution: shortTextSchema.optional() })
  .strict();

export const legacyNarrativeBlockElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("narrativeBlock"),
    heading: shortTextSchema.optional(),
    body: z.string().max(WEBSITE_ELEMENT_LIMITS.narrativeBody),
    media: z
      .object({ type: z.literal("image"), mediaId: mediaIdSchema })
      .strict()
      .optional(),
  })
  .strict();

export const legacySlotNarrativeBlockElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("narrativeBlock"),
    isHidden: z.boolean(),
    slots: z
      .object({
        eyebrow: narrativeTextSlotSchema,
        heading: narrativeTextSlotSchema,
        divider: z.object({ isHidden: z.boolean() }).strict(),
        body: narrativeTextSlotSchema,
        quote: narrativeQuoteSlotSchema,
        media: z
          .object({
            isHidden: z.boolean(),
            content: narrativeMediaSchema.nullable(),
            appearance: z
              .object({
                cornerStyle: z.enum(["square", "soft", "rounded"]).optional(),
                frameStyle: z.string().min(1).max(64).optional(),
                frameColorId: z.string().min(1).max(255).optional(),
                frameSize: z.enum(["small", "medium", "large"]).optional(),
              })
              .strict()
              .optional(),
          })
          .strict(),
        caption: narrativeTextSlotSchema,
        cta: z
          .object({
            isHidden: z.boolean(),
            label: shortTextSchema,
            action: ctaActionSchema.nullable(),
            appearance: narrativeSlotAppearanceSchema.optional(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export const narrativeCompositionSchema = z.object({
  presentation: z.enum(["editorial", "mediaFirst", "quoteLed", "textOnly"]).optional(),
  mediaPlacement: z.enum(["leading", "trailing", "above", "below", "splitStart", "splitEnd", "inset"]).optional(),
  mediaTreatment: z.enum(["standard", "wide", "cinematic", "fullBleed"]).optional(),
  textAlignment: z.enum(["start", "center", "end"]).optional(),
  surface: z.enum(["none", "soft", "feature"]).optional(),
}).strict();

const narrativeBlockAppearanceSchema = z.object({
  backgroundColorId: z.string().min(1).optional(),
  decorativeAppearance: z.object({
    background: z.object({
      texture: z.enum(["none", "paper", "fabric", "grain"]).optional(),
      textureStrength: z.number().int().min(10).max(100).optional(),
      pattern: z.enum(["none", "botanical", "geometric", "heritage"]).optional(),
      patternStrength: z.number().int().min(10).max(100).optional(),
    }).strict().optional(),
  }).strict().optional(),
}).strict();

export const narrativeBlockElementSchema = legacySlotNarrativeBlockElementSchema.extend({
  composition: narrativeCompositionSchema,
  appearance: narrativeBlockAppearanceSchema.optional(),
}).strict();

export const eventDateElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("eventDate"),
  })
  .strict();

export const eventTimeElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("eventTime"),
  })
  .strict();

export const countdownElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("countdown"),
  })
  .strict();

export const websiteLeafElementSchema = z.discriminatedUnion("type", [
  headingElementSchema,
  textElementSchema,
  richTextElementSchema,
  imageElementSchema,
  dividerElementSchema,
  quoteElementSchema,
  ctaElementSchema,
  mediaCollectionElementSchema,
  narrativeBlockElementSchema,
  eventDateElementSchema,
  eventTimeElementSchema,
  countdownElementSchema,
]);

const groupSpacingSchema = z.enum(["none", "xs", "s", "m", "l", "xl"]);
const groupPaddingSchema = z.object({ top: groupSpacingSchema.optional(), right: groupSpacingSchema.optional(), bottom: groupSpacingSchema.optional(), left: groupSpacingSchema.optional() }).strict();
const groupLayoutValues = {
  direction: z.enum(["vertical", "horizontal"]),
  gap: groupSpacingSchema,
  padding: groupPaddingSchema,
  alignment: z.enum(["start", "center", "end", "stretch"]),
  columns: z.enum(["equal-2", "content-wide", "content-narrow", "equal-3"]),
} as const;
const groupLayoutOverrideSchema = z.object({ direction: groupLayoutValues.direction.optional(), gap: groupLayoutValues.gap.optional(), padding: groupLayoutValues.padding.optional(), alignment: groupLayoutValues.alignment.optional(), columns: groupLayoutValues.columns.optional() }).strict();
export const groupLayoutSchema = z.object({
  width: z.enum(["full", "wide", "medium", "narrow"]).optional(),
  direction: groupLayoutValues.direction.optional(), gap: groupLayoutValues.gap.optional(), padding: groupLayoutValues.padding.optional(), alignment: groupLayoutValues.alignment.optional(), columns: groupLayoutValues.columns.optional(),
  responsive: z.object({ tablet: groupLayoutOverrideSchema.optional(), mobile: groupLayoutOverrideSchema.optional() }).strict().optional(),
}).strict();

const nestedCompositionGroupSchema = z.object({ ...baseShape, type: z.literal("compositionGroup"), children: z.array(websiteLeafElementSchema).max(20), layout: groupLayoutSchema.optional() }).strict();
export const compositionGroupSchema = z.object({ ...baseShape, type: z.literal("compositionGroup"), children: z.array(z.union([websiteLeafElementSchema, nestedCompositionGroupSchema])).max(20), layout: groupLayoutSchema.optional() }).strict().superRefine((group, context) => addDuplicateIdIssues([group], context));

export const websiteElementSchema = z.union([
  websiteLeafElementSchema,
  compositionGroupSchema,
]);

type ElementWithIdentity = {
  id: string;
  type?: string;
  items?: Array<{ id: string }>;
  composition?: z.infer<typeof narrativeCompositionSchema>;
  children?: ElementWithIdentity[];
};

function addDuplicateIdIssues(
  elements: ElementWithIdentity[],
  context: z.RefinementCtx,
) {
  const seen = new Set<string>();
  const visit = (element: ElementWithIdentity) => {
    if (seen.has(element.id)) {
      context.addIssue({
        code: "custom",
        message: `Element IDs must be unique within a section; duplicate [${element.id}] found.`,
      });
    }
    seen.add(element.id);

    if (element.type === "mediaCollection") element.items?.forEach(visit);
    element.children?.forEach(visit);
  };
  elements.forEach(visit);
}

export const websiteElementTreeSchema = z
  .array(websiteElementSchema)
  .superRefine(addDuplicateIdIssues);

// Keep the centralized list tied to the active schema vocabulary at compile time.
const _activeLeafTypeCheck: readonly z.infer<
  typeof websiteLeafElementSchema
>["type"][] = WEBSITE_LEAF_ELEMENT_TYPES;
void _activeLeafTypeCheck;
