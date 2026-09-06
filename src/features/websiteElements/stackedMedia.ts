import type { ResponsiveViewport } from "../websiteEditor/types";

export type StackedMediaStyle = "polaroid" | "soft-overlap" | "editorial";
export type StackedPlacement = { leftPercent: number; topPercent: number; rotation: number; scale: number; zIndex: number; widthPercent: number };

const horizontal = { 2: [-14, 14], 3: [-20, 0, 18], 4: [-22, -8, 9, 21], 5: [-24, -12, 0, 13, 24] } as const;
const vertical = { 2: [3, -2], 3: [4, -5, 3], 4: [5, -5, 5, -2], 5: [5, -3, 4, -5, 2] } as const;
const rotations = { 2: [-4, 3], 3: [-5, 2, 4], 4: [-5, 3, -2, 4], 5: [-5, 3, -2, 4, -3] } as const;
const scales = { 2: [.96, 1], 3: [.91, .97, 1], 4: [.88, .94, .96, 1], 5: [.86, .91, .95, .92, 1] } as const;

export function resolveStackedPlacement(style: StackedMediaStyle, itemIndex: number, itemCount: number, viewport: ResponsiveViewport): StackedPlacement {
  const count = Math.max(2, Math.min(5, itemCount)) as 2 | 3 | 4 | 5;
  const index = Math.max(0, Math.min(count - 1, itemIndex));
  const responsiveFactor = viewport === "desktop" ? 1 : viewport === "tablet" ? .72 : .48;
  const styleFactor = style === "soft-overlap" ? .72 : style === "editorial" ? .9 : 1;
  const rotationFactor = (style === "soft-overlap" ? .55 : style === "editorial" ? .32 : 1) * responsiveFactor;
  const editorialScale = style === "editorial" ? (index % 2 === 0 ? .96 : 1.03) : 1;
  const desktopWidth = ({ 2: 60, 3: 54, 4: 50, 5: 46 } as const)[count];
  return {
    leftPercent: 50 + horizontal[count][index] * responsiveFactor * styleFactor,
    topPercent: 50 + vertical[count][index] * responsiveFactor,
    rotation: rotations[count][index] * rotationFactor,
    scale: scales[count][index] * editorialScale,
    zIndex: index + 1,
    widthPercent: viewport === "mobile" ? desktopWidth + 16 : viewport === "tablet" ? desktopWidth + 6 : style === "editorial" ? desktopWidth - 2 : desktopWidth,
  };
}

export const stackedCanvasAspectRatio = (viewport: ResponsiveViewport) => viewport === "mobile" ? "4 / 5" : viewport === "tablet" ? "1 / 1" : "4 / 3";
