import type { WebsiteSectionAppearance } from "./types";

export type StoryLegacyBackgroundState = {
  label: string;
  color?: string;
};

export function storyLegacyBackgroundState(
  appearance: WebsiteSectionAppearance,
): StoryLegacyBackgroundState | null {
  const background = appearance.decorativeAppearance?.background;
  if (appearance.backgroundTreatment === "inherit" || background?.colorId) return null;
  if (appearance.backgroundTreatment === "custom" && background?.customColor) {
    return { label: `Legacy Custom · ${background.customColor}`, color: background.customColor };
  }
  if (["plain", "soft", "accent"].includes(appearance.backgroundTreatment)) {
    const label = appearance.backgroundTreatment[0].toUpperCase() + appearance.backgroundTreatment.slice(1);
    return { label: `${label} · Legacy` };
  }
  return null;
}
