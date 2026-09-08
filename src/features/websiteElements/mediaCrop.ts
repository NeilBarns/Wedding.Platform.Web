export type MediaAspectRatio = "natural" | "square" | "portrait" | "landscape" | "wide";
export type MediaPoint = { x: number; y: number };
export type MediaSize = { width: number; height: number };

const authoredRatios: Record<Exclude<MediaAspectRatio, "natural">, string> = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
  wide: "16 / 9",
};

export const isValidMediaDimension = (value: number) => Number.isFinite(value) && value > 0;

export function safeMediaSize(size: MediaSize): MediaSize {
  return isValidMediaDimension(size.width) && isValidMediaDimension(size.height) ? size : { width: 1, height: 1 };
}

export function resolveMediaAspectRatio(aspectRatio: MediaAspectRatio, source: MediaSize): string {
  if (aspectRatio !== "natural") return authoredRatios[aspectRatio];
  const safe = safeMediaSize(source);
  return `${safe.width} / ${safe.height}`;
}

export function clampMediaPoint(point: MediaPoint): MediaPoint {
  const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;
  return { x: clamp(point.x), y: clamp(point.y) };
}

export function clampMediaZoom(value: number): number {
  const safe = Number.isFinite(value) ? value : 1;
  return Math.max(1, Math.min(3, Math.round(safe * 10) / 10));
}

export function resolveMediaCropGeometry(container: MediaSize, source: MediaSize, point: MediaPoint, zoom: number) {
  const safeContainer = safeMediaSize(container);
  const safeSource = safeMediaSize(source);
  const safePoint = clampMediaPoint(point);
  const safeZoom = clampMediaZoom(zoom);
  const baseScale = Math.max(safeContainer.width / safeSource.width, safeContainer.height / safeSource.height);
  const width = safeSource.width * baseScale * safeZoom;
  const height = safeSource.height * baseScale * safeZoom;
  return {
    width,
    height,
    left: Math.max(safeContainer.width - width, Math.min(0, safeContainer.width / 2 - safePoint.x * width)),
    top: Math.max(safeContainer.height - height, Math.min(0, safeContainer.height / 2 - safePoint.y * height)),
    point: safePoint,
    zoom: safeZoom,
  };
}
