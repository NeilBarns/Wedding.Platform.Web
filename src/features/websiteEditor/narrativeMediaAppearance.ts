import type { StoryBlock } from "./types";

export type NarrativeMediaCornerStyle = NonNullable<
  NonNullable<StoryBlock["slots"]["media"]["appearance"]>["cornerStyle"]
>;
export type NarrativeMediaFrameStyle = NonNullable<
  NonNullable<StoryBlock["slots"]["media"]["appearance"]>["frameStyle"]
>;
export type NarrativeMediaFrameSize = NonNullable<
  NonNullable<StoryBlock["slots"]["media"]["appearance"]>["frameSize"]
>;

function applyMediaAppearance(
  block: StoryBlock,
  update: (appearance: NonNullable<StoryBlock["slots"]["media"]["appearance"]>) => void,
): StoryBlock {
  const media = { ...block.slots.media };
  const appearance = { ...media.appearance };
  update(appearance);
  if (Object.keys(appearance).length) media.appearance = appearance;
  else delete media.appearance;
  return { ...block, slots: { ...block.slots, media } };
}

export function applyNarrativeMediaCornerStyle(
  block: StoryBlock,
  cornerStyle?: NarrativeMediaCornerStyle,
): StoryBlock {
  return applyMediaAppearance(block, (appearance) => {
    if (cornerStyle === undefined) delete appearance.cornerStyle;
    else appearance.cornerStyle = cornerStyle;
  });
}

export function applyNarrativeMediaFrameStyle(
  block: StoryBlock,
  frameStyle?: NarrativeMediaFrameStyle,
): StoryBlock {
  return applyMediaAppearance(block, (appearance) => {
    if (frameStyle === undefined) delete appearance.frameStyle;
    else appearance.frameStyle = frameStyle;
  });
}

export function applyNarrativeMediaFrameColor(
  block: StoryBlock,
  frameColorId?: string,
): StoryBlock {
  return applyMediaAppearance(block, (appearance) => {
    if (frameColorId === undefined) delete appearance.frameColorId;
    else appearance.frameColorId = frameColorId;
  });
}

export function applyNarrativeMediaFrameSize(
  block: StoryBlock,
  frameSize?: NarrativeMediaFrameSize,
): StoryBlock {
  return applyMediaAppearance(block, (appearance) => {
    if (frameSize === undefined) delete appearance.frameSize;
    else appearance.frameSize = frameSize;
  });
}
