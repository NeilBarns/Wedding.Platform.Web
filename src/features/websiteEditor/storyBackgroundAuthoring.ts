import type { WebsiteSectionAppearance } from "./types";

export function applyStoryBackgroundColor(
  appearance: WebsiteSectionAppearance,
  colorId: string | undefined,
): WebsiteSectionAppearance {
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
