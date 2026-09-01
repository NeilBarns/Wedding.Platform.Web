import type { CSSProperties } from "react";
import type {
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../websiteCapabilities/types";
import type { ResponsiveViewport, StoryBlock } from "../websiteEditor/types";
import { fontStackForTemplate } from "../websiteTemplates/design/catalogs";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";

export type NarrativeTextSlotKey =
  "eyebrow" | "heading" | "body" | "quote" | "caption" | "cta";
type TextAppearance = NonNullable<StoryBlock["slots"]["heading"]["appearance"]>;
export type NarrativeSemanticValue = "xs" | "s" | "m" | "l" | "xl";
export type NarrativeSlotDefaults = {
  size: Record<ResponsiveViewport, NarrativeSemanticValue>;
  lineSpacing: "tight" | "normal" | "relaxed";
  letterSpacing: "tight" | "normal" | "wide";
};
export type NarrativeTemplateTokens = {
  defaults: Record<NarrativeTextSlotKey, NarrativeSlotDefaults>;
  fontSize: Record<NarrativeSemanticValue, string>;
  lineSpacing: Record<"tight" | "normal" | "relaxed", string | number>;
  letterSpacing: Record<"tight" | "normal" | "wide", string>;
};

export type ResolvedNarrativeSlotAppearance = {
  fontFamilyId: string;
  colorId: string;
  inheritedColorId: string;
  fontSize: NarrativeSemanticValue;
  lineSpacing: "tight" | "normal" | "relaxed";
  letterSpacing: "tight" | "normal" | "wide";
};

export function resolveNarrativeSlotAppearance(
  slot: NarrativeTextSlotKey,
  appearance: TextAppearance | undefined,
  context: ResolvedDesignContext,
  defaults: NarrativeSlotDefaults,
  viewport: ResponsiveViewport,
): ResolvedNarrativeSlotAppearance {
  const heading = slot === "heading";
  const inheritedColorId = heading ? context.headingColorId : context.bodyColorId;
  return {
    fontFamilyId:
      appearance?.fontFamilyId ??
      (heading ? context.headingFontId : context.bodyFontId),
    colorId:
      appearance?.colorId ??
      inheritedColorId,
    inheritedColorId,
    fontSize: appearance?.fontSize?.[viewport] ?? defaults.size[viewport],
    lineSpacing: appearance?.lineSpacing ?? defaults.lineSpacing,
    letterSpacing: appearance?.letterSpacing ?? defaults.letterSpacing,
  };
}

export function narrativeSlotCss(
  appearance: ResolvedNarrativeSlotAppearance,
  library: TemplateDesignLibrary,
  templateKey: string,
  tokens: NarrativeTemplateTokens,
  projectColors: readonly ProjectColor[] = [],
): CSSProperties {
  return {
    fontFamily: fontStackForTemplate(templateKey, appearance.fontFamilyId),
    color: resolveWebsiteColor(appearance.colorId, library, projectColors)
      ?? resolveWebsiteColor(appearance.inheritedColorId, library, projectColors),
    fontSize: tokens.fontSize[appearance.fontSize],
    lineHeight: tokens.lineSpacing[appearance.lineSpacing],
    letterSpacing: tokens.letterSpacing[appearance.letterSpacing],
  };
}
