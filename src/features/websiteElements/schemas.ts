import { z } from "zod";
import {
  WEBSITE_ELEMENT_LIMITS,
  WEBSITE_LEAF_ELEMENT_TYPES,
} from "./constants";

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
    text: z.string().max(WEBSITE_ELEMENT_LIMITS.text),
  })
  .strict();

export const imageElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("image"),
    mediaId: mediaIdSchema,
  })
  .strict();

export const dividerElementSchema = z
  .object({
    ...baseShape,
    type: z.literal("divider"),
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
  presentation: z.enum(["editorial", "mediaFirst", "quoteLed", "textOnly"]),
  mediaPlacement: z.enum(["leading", "trailing", "above", "below", "splitStart", "splitEnd", "inset"]).optional(),
  mediaTreatment: z.enum(["standard", "wide", "cinematic", "fullBleed"]).optional(),
  textAlignment: z.enum(["start", "center", "end"]).optional(),
  surface: z.enum(["none", "soft", "feature"]).optional(),
}).strict();

export const narrativeBlockElementSchema = legacySlotNarrativeBlockElementSchema.extend({
  composition: narrativeCompositionSchema,
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

const mediaOrientedLeafElementSchema = z.discriminatedUnion("type", [
  imageElementSchema,
  mediaCollectionElementSchema,
]);

const contentOrientedLeafElementSchema = z.discriminatedUnion("type", [
  headingElementSchema,
  textElementSchema,
  dividerElementSchema,
  quoteElementSchema,
  ctaElementSchema,
  narrativeBlockElementSchema,
  eventDateElementSchema,
  eventTimeElementSchema,
  countdownElementSchema,
]);

const flowCompositionGroupBaseSchema = z
  .object({
    ...baseShape,
    type: z.literal("compositionGroup"),
    composition: z.literal("flow"),
    children: z.array(websiteLeafElementSchema),
  })
  .strict();

const zonedCompositionGroupBaseSchema = z
  .object({
    ...baseShape,
    type: z.literal("compositionGroup"),
    composition: z.literal("zoned"),
    zones: z
      .object({
        media: z.array(mediaOrientedLeafElementSchema),
        content: z.array(contentOrientedLeafElementSchema),
      })
      .strict(),
  })
  .strict();

function groupLeaves(
  group:
    | z.infer<typeof flowCompositionGroupBaseSchema>
    | z.infer<typeof zonedCompositionGroupBaseSchema>,
) {
  return group.composition === "flow"
    ? group.children
    : [...group.zones.media, ...group.zones.content];
}

function addGroupIssues(
  group:
    | z.infer<typeof flowCompositionGroupBaseSchema>
    | z.infer<typeof zonedCompositionGroupBaseSchema>,
  context: z.RefinementCtx,
) {
  const leaves = groupLeaves(group);
  if (
    leaves.filter((element) => element.type === "mediaCollection").length > 1
  ) {
    context.addIssue({
      code: "custom",
      message: "A Composition Group may contain at most one Media Collection.",
    });
  }

  addDuplicateIdIssues([group], context);
}

export const flowCompositionGroupSchema =
  flowCompositionGroupBaseSchema.superRefine(addGroupIssues);
export const zonedCompositionGroupSchema =
  zonedCompositionGroupBaseSchema.superRefine(addGroupIssues);

export const compositionGroupSchema = z.discriminatedUnion("composition", [
  flowCompositionGroupSchema,
  zonedCompositionGroupSchema,
]);

export const websiteElementSchema = z.union([
  websiteLeafElementSchema,
  compositionGroupSchema,
]);

type ElementWithIdentity = {
  id: string;
  type?: string;
  items?: Array<{ id: string }>;
  composition?: "flow" | "zoned" | z.infer<typeof narrativeCompositionSchema>;
  children?: ElementWithIdentity[];
  zones?: { media: ElementWithIdentity[]; content: ElementWithIdentity[] };
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
    if (element.composition === "flow") element.children?.forEach(visit);
    if (element.composition === "zoned") {
      element.zones?.media.forEach(visit);
      element.zones?.content.forEach(visit);
    }
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
