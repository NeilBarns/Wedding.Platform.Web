import type { ResponsiveViewport } from "../websiteEditor/types";

export type PeekCarouselState = "previous" | "active" | "next" | "hidden";

export type PeekCarouselGeometry = {
  leftPercent: number;
  widthPercent: number;
  translatePercent: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export const resolveCarouselStyle = (style?: "standard" | "peek") => style ?? "standard";

export function resolvePeekCarouselState(itemIndex: number, activeIndex: number, itemCount: number, loop: boolean): PeekCarouselState {
  if (itemIndex === activeIndex) return "active";
  if (itemCount < 2) return "hidden";

  const previousIndex = activeIndex > 0 ? activeIndex - 1 : loop ? itemCount - 1 : -1;
  const nextIndex = activeIndex < itemCount - 1 ? activeIndex + 1 : loop ? 0 : -1;

  // With two items the same neighbour cannot occupy both visual preview slots.
  if (itemCount === 2 && previousIndex === nextIndex) return activeIndex === 0 ? "next" : "previous";
  if (itemIndex === previousIndex) return "previous";
  if (itemIndex === nextIndex) return "next";
  return "hidden";
}

const viewportGeometry = {
  desktop: { activeWidth: 68, sideWidth: 46, sideScale: 0.92, edge: 8, rotation: 1.5 },
  tablet: { activeWidth: 74, sideWidth: 42, sideScale: 0.94, edge: 5, rotation: 0.75 },
  mobile: { activeWidth: 86, sideWidth: 34, sideScale: 0.97, edge: 2, rotation: 0 },
} as const;

export function resolvePeekCarouselGeometry(state: PeekCarouselState, viewport: ResponsiveViewport, reducedMotion = false): PeekCarouselGeometry {
  const geometry = viewportGeometry[viewport];
  if (state === "active") return { leftPercent: 50, widthPercent: geometry.activeWidth, translatePercent: -50, scale: 1, rotation: 0, opacity: 1, zIndex: 3 };
  if (state === "hidden") return { leftPercent: 50, widthPercent: geometry.sideWidth, translatePercent: -50, scale: geometry.sideScale, rotation: 0, opacity: 0, zIndex: 0 };

  const previous = state === "previous";
  return {
    leftPercent: previous ? geometry.edge : 100 - geometry.edge,
    widthPercent: geometry.sideWidth,
    translatePercent: previous ? 0 : -100,
    scale: geometry.sideScale,
    rotation: reducedMotion ? 0 : previous ? -geometry.rotation : geometry.rotation,
    opacity: 0.76,
    zIndex: 1,
  };
}

export function isPeekGeometryBounded(geometry: PeekCarouselGeometry): boolean {
  const scaledWidth = geometry.widthPercent * geometry.scale;
  const left = geometry.leftPercent + scaledWidth * geometry.translatePercent / 100;
  return left >= 0 && left + scaledWidth <= 100;
}
