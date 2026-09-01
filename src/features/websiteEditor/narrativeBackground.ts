import type { StoryBlock } from "./types";

export function applyNarrativeBackgroundColor(block: StoryBlock, backgroundColorId?: string): StoryBlock {
  const next = structuredClone(block);
  const appearance = { ...next.appearance };
  if (backgroundColorId === undefined) delete appearance.backgroundColorId;
  else appearance.backgroundColorId = backgroundColorId;
  if (Object.keys(appearance).length) next.appearance = appearance;
  else delete next.appearance;
  delete next.composition.surface;
  return next;
}

export function narrativeLegacyBackgroundLabel(block: StoryBlock): string | null {
  if (block.appearance?.backgroundColorId || !["soft", "feature"].includes(block.composition.surface ?? "")) return null;
  const surface = block.composition.surface!;
  return `${surface[0].toUpperCase()}${surface.slice(1)} · Legacy`;
}

export function applyNarrativeDecoration(block: StoryBlock, field: "texture" | "pattern" | "textureStrength" | "patternStrength", value?: string | number): StoryBlock {
  const next = structuredClone(block);
  const appearance = { ...next.appearance };
  const decorativeAppearance = { ...appearance.decorativeAppearance };
  const background = { ...decorativeAppearance.background };
  if (value === undefined) delete background[field];
  else Object.assign(background, { [field]: value });
  if (Object.keys(background).length) decorativeAppearance.background = background;
  else delete decorativeAppearance.background;
  if (Object.keys(decorativeAppearance).length) appearance.decorativeAppearance = decorativeAppearance;
  else delete appearance.decorativeAppearance;
  if (Object.keys(appearance).length) next.appearance = appearance;
  else delete next.appearance;
  return next;
}
