import type { ElementCapability } from "../websiteCapabilities/types";
import type { StoryBlock } from "../websiteEditor/types";

export type NarrativeCompositionCapability = NonNullable<
  ElementCapability["narrativeBlock"]
>["composition"];
export type NarrativeComposition = StoryBlock["composition"];
export type NarrativePresentation = NarrativeComposition["presentation"];
export type NarrativeMediaPlacement = NonNullable<
  NarrativeComposition["mediaPlacement"]
>;
export type NarrativeMediaTreatment = NonNullable<
  NarrativeComposition["mediaTreatment"]
>;

export type NarrativeCompositionWarning =
  | { type: "mediaUnavailable"; message: "Media First works best with Media visible." }
  | { type: "quoteUnavailable"; message: "Quote Led works best with Quote visible." };

export function resolveNarrativeComposition({
  block,
  capability,
  mediaRenderable = true,
}: {
  block: StoryBlock;
  capability: NarrativeCompositionCapability;
  mediaRenderable?: boolean;
}) {
  const authored = block.composition;
  const presentation = capability.presentations.includes(authored.presentation)
    ? authored.presentation
    : capability.presentations.includes(capability.defaults.presentation)
      ? capability.defaults.presentation
      : "editorial";
  const hasActiveVisibleMedia =
    !block.slots.media.isHidden && block.slots.media.content !== null && mediaRenderable;
  const hasEffectiveQuote =
    !block.slots.quote.isHidden && block.slots.quote.text.trim().length > 0;
  const mediaParticipates = presentation !== "textOnly" && hasActiveVisibleMedia;
  const placementOptions = capability.mediaPlacementsByPresentation[presentation];
  const defaultPlacement =
    presentation === "textOnly"
      ? undefined
      : capability.defaults.mediaPlacementByPresentation[presentation];
  const authoredPlacementIsActive = Boolean(
    mediaParticipates &&
      authored.mediaPlacement &&
      placementOptions.includes(authored.mediaPlacement),
  );
  const mediaPlacement = mediaParticipates
    ? authoredPlacementIsActive
      ? authored.mediaPlacement
      : defaultPlacement
    : undefined;
  const treatmentOptions = mediaPlacement
    ? (capability.mediaTreatmentsByPresentationAndPlacement[presentation][
        mediaPlacement
      ] ?? [])
    : [];
  const authoredTreatmentIsActive = Boolean(
    mediaParticipates &&
      authored.mediaTreatment &&
      treatmentOptions.includes(authored.mediaTreatment),
  );
  const mediaTreatment = mediaParticipates
    ? authoredTreatmentIsActive
      ? authored.mediaTreatment
      : treatmentOptions.includes(capability.defaults.mediaTreatment)
        ? capability.defaults.mediaTreatment
        : treatmentOptions[0]
    : undefined;
  const textAlignment = capability.textAlignments.includes(
    authored.textAlignment ?? capability.defaults.textAlignmentByPresentation[presentation],
  )
    ? (authored.textAlignment ??
      capability.defaults.textAlignmentByPresentation[presentation])
    : capability.defaults.textAlignmentByPresentation[presentation];
  const surface = capability.surfaces.includes(
    authored.surface ?? capability.defaults.surface,
  )
    ? (authored.surface ?? capability.defaults.surface)
    : capability.defaults.surface;
  const warning: NarrativeCompositionWarning | undefined =
    presentation === "mediaFirst" && !hasActiveVisibleMedia
      ? { type: "mediaUnavailable", message: "Media First works best with Media visible." }
      : presentation === "quoteLed" && !hasEffectiveQuote
        ? { type: "quoteUnavailable", message: "Quote Led works best with Quote visible." }
        : undefined;
  const suppressMedia = presentation === "textOnly";
  const suppressCaption = suppressMedia || !hasActiveVisibleMedia;
  const renderedSlots = {
    eyebrow: !block.slots.eyebrow.isHidden,
    heading: !block.slots.heading.isHidden,
    divider: !block.slots.divider.isHidden,
    body: !block.slots.body.isHidden,
    quote: !block.slots.quote.isHidden,
    media: hasActiveVisibleMedia && !suppressMedia,
    caption: !block.slots.caption.isHidden && !suppressCaption,
    cta: !block.slots.cta.isHidden,
  } as const;

  return {
    authored,
    effective: {
      presentation,
      mediaPlacement,
      mediaTreatment,
      textAlignment,
      surface,
    },
    options: {
      presentations: capability.presentations,
      mediaPlacements: placementOptions,
      mediaTreatments: treatmentOptions,
      textAlignments: capability.textAlignments,
      surfaces: capability.surfaces,
    },
    availability: {
      mediaPlacement: mediaParticipates,
      mediaTreatment: mediaParticipates && Boolean(mediaPlacement),
    },
    compatibility: {
      mediaPlacementAuthoredIsActive: authoredPlacementIsActive,
      mediaTreatmentAuthoredIsActive: authoredTreatmentIsActive,
    },
    rendering: {
      suppressMedia,
      suppressCaption,
      hasActiveVisibleMedia,
      hasEffectiveQuote,
      slots: renderedSlots,
    },
    warning,
  } as const;
}

export type ResolvedNarrativeComposition = ReturnType<
  typeof resolveNarrativeComposition
>;

export function narrativeResponsiveOrderClasses(
  composition: ResolvedNarrativeComposition,
) {
  const collapsedMediaFirstSplit =
    composition.effective.presentation === "mediaFirst" &&
    (composition.effective.mediaPlacement === "splitStart" ||
      composition.effective.mediaPlacement === "splitEnd");
  if (collapsedMediaFirstSplit) {
    return {
        media: "order-[-2] sm:order-0",
        caption: "-order-1 sm:order-0",
      } as const;
  }
  const mediaLeadingFlow =
    composition.effective.presentation === "mediaFirst" &&
    (composition.effective.mediaPlacement === "above" ||
      composition.effective.mediaPlacement === "leading");
  return mediaLeadingFlow
    ? { media: "order-[-2]", caption: "-order-1" }
    : { media: "", caption: "" };
}

export function resetNarrativeComposition(
  composition: NarrativeComposition,
  control?: keyof NarrativeComposition,
): NarrativeComposition {
  if (!control) return { presentation: "editorial" };
  if (control === "presentation") return { ...composition, presentation: "editorial" };
  const next = { ...composition };
  delete next[control];
  return next;
}
