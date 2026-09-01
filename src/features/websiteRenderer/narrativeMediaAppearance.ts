import type { ElementCapability } from "../websiteCapabilities/types";
import type { StoryBlock } from "../websiteEditor/types";
import type { NarrativeMediaCornerStyle } from "../websiteEditor/narrativeMediaAppearance";
import type { ResponsiveViewport } from "../websiteEditor/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import { resolveDecorativeExecution } from "./templateDecorativeAssets";
import type { ResolvedDecorativeExecution } from "./templateDecorativeAssets";

type NarrativeMediaCapability = NonNullable<ElementCapability["narrativeBlock"]>["appearance"]["media"];
type FrameAppearance = NonNullable<StoryBlock["slots"]["media"]["appearance"]>;

export const NARRATIVE_MEDIA_FRAME_CORNER_SIZES = {
  small: "clamp(36px, 6vw, 84px)",
  medium: "clamp(48px, 8vw, 112px)",
  large: "clamp(60px, 10vw, 140px)",
} as const;

export function applyNarrativeMediaFrameOverrides(
  base: ResolvedDecorativeExecution,
  frameCapability: NarrativeMediaCapability["frameStyles"][number],
  appearance: FrameAppearance | undefined,
  frameColorIds: readonly string[],
  library: Parameters<typeof resolveWebsiteColor>[1] | undefined,
  projectColors: readonly ProjectColor[],
) {
  let decoration = base;
  const colorId = appearance?.frameColorId;
  const templateColorAllowed = colorId ? frameColorIds.includes(colorId) : false;
  const projectColorAllowed = colorId ? projectColors.some(({ id }) => id === colorId) : false;
  if (frameCapability.supportsColor && colorId && library && (templateColorAllowed || projectColorAllowed)
    && base.type === "asset" && base.execution.renderMode === "mask" && base.execution.tintToken) {
    const tint = resolveWebsiteColor(colorId, library, projectColors);
    if (tint) decoration = { ...base, tint };
  }

  const authoredSize = appearance?.frameSize;
  const cornerSize = authoredSize && frameCapability.sizes?.includes(authoredSize)
    && base.type === "asset" && base.execution.position === "fourCorners"
    ? NARRATIVE_MEDIA_FRAME_CORNER_SIZES[authoredSize]
    : undefined;
  return { decoration, cornerSize };
}

export function resolveNarrativeMediaCornerStyle(
  block: StoryBlock,
  capability: NonNullable<ElementCapability["narrativeBlock"]>,
): NarrativeMediaCornerStyle | undefined {
  const authored = block.slots.media.appearance?.cornerStyle;
  return authored && capability.appearance.media.cornerStyles.includes(authored)
    ? authored
    : undefined;
}

export function narrativeMediaCornerClass(
  cornerStyle: NarrativeMediaCornerStyle | undefined,
): string {
  if (cornerStyle === "soft") return "rounded-sm";
  if (cornerStyle === "rounded") return "rounded-xl";
  return "";
}

export function resolveNarrativeMediaFrame(
  templateKey: string,
  viewport: ResponsiveViewport,
  authoredStyle: string | undefined,
  frameStyles: NarrativeMediaCapability["frameStyles"],
  defaultStyle?: string,
  appearance?: FrameAppearance,
  frameColorIds: readonly string[] = [],
  library?: Parameters<typeof resolveWebsiteColor>[1],
  projectColors: readonly ProjectColor[] = [],
) {
  const effectiveStyle = authoredStyle === undefined ? defaultStyle : authoredStyle;
  const frameCapability = frameStyles.find(({ key }) => key === effectiveStyle);
  if (!effectiveStyle || effectiveStyle === "none" || !frameCapability) return null;
  const base = resolveDecorativeExecution(templateKey, "mediaFrame", effectiveStyle, viewport);
  if (!base) return null;

  return applyNarrativeMediaFrameOverrides(base, frameCapability, appearance, frameColorIds, library, projectColors);
}
