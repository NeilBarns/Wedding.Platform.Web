import type { CSSProperties } from "react";
import type { WebsiteSectionAppearance } from "../websiteEditor/types";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";

const OPAQUE_HEX = /^#[0-9A-Fa-f]{6}$/;

export function normalizeOpaqueHex(value: string | undefined): string | null {
  return value && OPAQUE_HEX.test(value) ? value.toUpperCase() : null;
}

export function resolveStoryCustomBackground(
  sectionType: string,
  appearance: WebsiteSectionAppearance,
  library: TemplateDesignLibrary,
  projectColors: readonly ProjectColor[],
): CSSProperties | null {
  if (sectionType !== "story" || appearance.backgroundTreatment !== "custom")
    return null;
  const background = appearance.decorativeAppearance?.background;
  const backgroundColor = resolveWebsiteColor(background?.colorId, library, projectColors)
    ?? normalizeOpaqueHex(background?.customColor);
  return backgroundColor ? { backgroundColor } : null;
}
