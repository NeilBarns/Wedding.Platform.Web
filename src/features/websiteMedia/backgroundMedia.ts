import { z } from "zod";

export type BackgroundMediaDevice = "desktop" | "tablet" | "mobile";
export type BackgroundMediaFraming = {
  assetId?: string;
  focalPoint?: { x: number; y: number };
  zoom?: number;
};
export type BackgroundMediaReference = BackgroundMediaFraming & {
  assetId: string;
  responsive?: { tablet?: BackgroundMediaFraming; mobile?: BackgroundMediaFraming };
};

const mediaIdSchema = z.string().ulid().refine(
  (value) => value[0] >= "0" && value[0] <= "7",
  "Media ID must be a canonical ULID.",
);
const focalPointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();
const framingShape = {
  assetId: mediaIdSchema.optional(),
  focalPoint: focalPointSchema.optional(),
  zoom: z.number().positive().max(3).optional(),
} as const;
const backgroundMediaFramingSchema = z.object(framingShape).strict();

/** Canonical decorative background-media reference shared by sections and elements. */
export const backgroundMediaSchema = z.object({
  ...framingShape,
  assetId: mediaIdSchema,
  responsive: z.object({ tablet: backgroundMediaFramingSchema.optional(), mobile: backgroundMediaFramingSchema.optional() }).strict().optional(),
}).strict().nullable().optional();

export type BackgroundMedia = BackgroundMediaReference | null | undefined;

export function resolveBackgroundMediaForDevice(media: BackgroundMedia, device: BackgroundMediaDevice): BackgroundMediaReference | null {
  if (!media) return null;
  const override = device === "desktop" ? undefined : media.responsive?.[device];
  return {
    assetId: override?.assetId ?? media.assetId,
    focalPoint: override?.focalPoint ?? media.focalPoint,
    zoom: override?.zoom ?? media.zoom,
  };
}

export function setBackgroundMediaDeviceFraming(media: BackgroundMediaReference, device: BackgroundMediaDevice, patch: Partial<BackgroundMediaFraming>): BackgroundMediaReference {
  if (device === "desktop") return { ...media, ...patch };
  const framing = { ...media.responsive?.[device], ...patch };
  for (const key of Object.keys(framing) as (keyof BackgroundMediaFraming)[]) if (framing[key] === undefined) delete framing[key];
  const responsive = { ...media.responsive, [device]: Object.keys(framing).length ? framing : undefined };
  if (!responsive.tablet) delete responsive.tablet;
  if (!responsive.mobile) delete responsive.mobile;
  return { ...media, responsive: Object.keys(responsive).length ? responsive : undefined };
}

export function resetBackgroundMediaDeviceFraming(media: BackgroundMediaReference, device: Exclude<BackgroundMediaDevice, "desktop">): BackgroundMediaReference {
  return setBackgroundMediaDeviceFraming(media, device, { focalPoint: undefined, zoom: undefined });
}

export function setBackgroundMediaDeviceAsset(media: BackgroundMediaReference, device: Exclude<BackgroundMediaDevice, "desktop">, assetId?: string): BackgroundMediaReference {
  return setBackgroundMediaDeviceFraming(media, device, { assetId, focalPoint: undefined, zoom: undefined });
}
