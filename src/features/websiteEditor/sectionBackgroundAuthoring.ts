import type { WebsiteSectionAppearance } from "./types";

export type LegacySectionBackgroundState = { label: string; color?: string };

export function applySectionBackgroundColor(appearance: WebsiteSectionAppearance, colorId?: string): WebsiteSectionAppearance {
  const next = structuredClone(appearance);
  const decorativeAppearance = { ...next.decorativeAppearance };
  const background = { ...(decorativeAppearance.background ?? {}) };
  if (colorId === undefined) delete background.colorId;
  else background.colorId = colorId;
  if (Object.keys(background).length) decorativeAppearance.background = background;
  else delete decorativeAppearance.background;
  if (Object.keys(decorativeAppearance).length) next.decorativeAppearance = decorativeAppearance;
  else delete next.decorativeAppearance;
  next.backgroundTreatment = colorId === undefined ? "inherit" : "custom";
  return next;
}

export function legacySectionBackgroundState(appearance: WebsiteSectionAppearance): LegacySectionBackgroundState | null {
  const background = appearance.decorativeAppearance?.background;
  if (appearance.backgroundTreatment === "inherit" || background?.colorId) return null;
  if (appearance.backgroundTreatment === "custom" && background?.customColor) return { label: `Legacy Custom · ${background.customColor}`, color: background.customColor };
  if (["plain", "soft", "accent"].includes(appearance.backgroundTreatment)) {
    const label = appearance.backgroundTreatment[0].toUpperCase() + appearance.backgroundTreatment.slice(1);
    return { label: `${label} · Legacy` };
  }
  return null;
}
