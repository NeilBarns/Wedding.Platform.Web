import type { MediaElement } from "./types";
import type { ResponsiveViewport } from "../websiteEditor/types";

type ResponsiveProperty = "mode" | "width" | "aspectRatio";
type GlobalProperty = "alignment" | "fit" | "carousel" | "stacked";

export function resolveMediaPresentation(element: MediaElement, viewport: ResponsiveViewport) {
  const base = element.presentation ?? {};
  const override = viewport === "desktop" ? undefined : base.responsive?.[viewport];
  return { mode: element.items.length > 1 ? "carousel" as const : "single" as const, width: "full" as const, alignment: "center" as const, aspectRatio: "natural" as const, fit: "cover" as const, ...base, ...override, responsive: base.responsive };
}

export function setMediaPresentationProperty(element: MediaElement, viewport: ResponsiveViewport, key: ResponsiveProperty | GlobalProperty, value: unknown): MediaElement {
  const presentation = element.presentation ?? {};
  if (viewport === "desktop" || key === "alignment" || key === "fit" || key === "carousel" || key === "stacked") return { ...element, presentation: { ...presentation, [key]: value } };
  return { ...element, presentation: { ...presentation, responsive: { ...presentation.responsive, [viewport]: { ...presentation.responsive?.[viewport], [key]: value } } } };
}

export function setMediaItems(element: MediaElement, items: MediaElement["items"]): MediaElement {
  if (!element.presentation) return { ...element, items };
  const validMode = (mode: "single" | "carousel" | "stacked" | undefined): "single" | "carousel" | "stacked" | undefined => items.length === 1 ? "single" : mode === "stacked" && items.length <= 5 ? "stacked" : items.length >= 2 ? "carousel" : undefined;
  const normalize = (override: NonNullable<NonNullable<MediaElement["presentation"]>["responsive"]>["mobile"]) => override ? { mode: validMode(override.mode), ...(override.width ? { width: override.width } : {}), ...(override.aspectRatio ? { aspectRatio: override.aspectRatio } : {}) } : undefined;
  const responsive = element.presentation.responsive;
  return { ...element, items, presentation: { ...element.presentation, mode: validMode(element.presentation.mode), ...(responsive ? { responsive: { ...(responsive.tablet ? { tablet: normalize(responsive.tablet) } : {}), ...(responsive.mobile ? { mobile: normalize(responsive.mobile) } : {}) } } : {}) } };
}

export const carouselIndex = (current: number, direction: -1 | 1, length: number, loop: boolean) => loop ? (current + direction + length) % length : Math.max(0, Math.min(length - 1, current + direction));
export const mediaAutoplayAllowed = (autoplay: boolean, itemCount: number, reducedMotion: boolean) => autoplay && itemCount > 1 && !reducedMotion;
export const carouselAutoplayStep = (current: number, length: number, loop: boolean) => { const next = carouselIndex(current, 1, length, loop); return { next, stop: !loop && next >= length - 1 }; };
