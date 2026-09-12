import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import type { MediaAsset } from "../../media/types";
import { useEventWorkspace } from "../../events/workspace/EventWorkspaceContext";
import type { ResolvedWebsiteMedia, SectionMedia } from "../types";
import { FocalPointEditor } from "./FocalPointEditor";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { resetBackgroundMediaDeviceFraming, resolveBackgroundMediaForDevice, setBackgroundMediaDeviceAsset, setBackgroundMediaDeviceFraming, type BackgroundMediaDevice, type BackgroundMediaReference } from "../../websiteMedia/backgroundMedia";
import { useBackgroundMinimumZoom } from "../../websiteMedia/backgroundGeometry";

export function BackgroundMediaEditor({ media, viewport = "desktop", ownerId, resolvedMedia, onMediaResolved, onChange, title = "Image" }: { media?: SectionMedia; viewport?: BackgroundMediaDevice; ownerId?: string; resolvedMedia: Record<string, ResolvedWebsiteMedia>; onMediaResolved: (media: ResolvedWebsiteMedia) => void; onChange: (media: SectionMedia) => void; title?: string }) {
  const event = useEventWorkspace();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chosen, setChosen] = useState<MediaAsset | null>(null);
  const effective = resolveBackgroundMediaForDevice(media, viewport);
  const resolved = effective ? resolvedMedia[effective.assetId] : undefined;
  const chosenMatches = chosen !== null && chosen.id === effective?.assetId;
  const url = chosenMatches ? chosen.variants.web.url : resolved?.web.url;
  const filename = chosenMatches ? chosen.originalFilename : resolved?.originalFilename;
  const point = effective?.focalPoint ?? { x: 0.5, y: 0.5 };
  const update = (patch: Parameters<typeof setBackgroundMediaDeviceFraming>[2]) => media && onChange(setBackgroundMediaDeviceFraming(media as BackgroundMediaReference, viewport, patch));
  const deviceLabel = viewport[0].toUpperCase() + viewport.slice(1);
  const deviceOverride = viewport === "desktop" ? undefined : media?.responsive?.[viewport];
  const minimumZoom = useBackgroundMinimumZoom(ownerId ? `${ownerId}:${viewport}` : undefined);
  return <section className="rounded-lg border border-border bg-surface-muted p-3">
    <h3 className="text-sm font-semibold">{title}</h3>
    {media && url ? <div className="mt-3">
      {viewport !== "desktop" && <p className="mb-2 text-xs text-foreground-muted">{deviceOverride?.assetId ? `Using ${deviceLabel} image` : "Using Desktop image"}</p>}
      <FocalPointEditor url={url} sourceWidth={resolved?.web.width} sourceHeight={resolved?.web.height} allowZoomOut minimumZoom={minimumZoom} point={point} zoom={effective?.zoom} showReset={viewport === "desktop"} onChange={({ point: focalPoint, zoom }) => update({ focalPoint, zoom })} onPointChange={(focalPoint) => update({ focalPoint })} onZoomChange={(zoom) => update({ zoom })} />
      <p className="mt-1 truncate text-xs text-foreground-muted">{filename}</p>
      <div className="mt-3 flex flex-wrap gap-2">{viewport === "desktop" && <><Button size="sm" type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Change image</Button><Button size="sm" type="button" variant="ghost" onClick={() => { setChosen(null); onChange(null); }}>Remove image</Button></>}{viewport !== "desktop" && <><Button size="sm" type="button" variant="secondary" onClick={() => setPickerOpen(true)}>{deviceOverride?.assetId ? "Change image" : `Use different image on ${deviceLabel}`}</Button>{deviceOverride?.assetId && <Button size="sm" type="button" variant="ghost" onClick={() => onChange(setBackgroundMediaDeviceAsset(media as BackgroundMediaReference, viewport))}>Use Desktop image</Button>}<Button size="sm" type="button" variant="ghost" disabled={!deviceOverride?.focalPoint && deviceOverride?.zoom === undefined} onClick={() => onChange(resetBackgroundMediaDeviceFraming(media as BackgroundMediaReference, viewport))}>Reset {deviceLabel} framing</Button></>}</div>
    </div> : <div className="mt-2"><p className="text-xs text-foreground-muted">No image selected</p><Button className="mt-2" size="sm" type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Choose from Media</Button></div>}
    <MediaPickerDialog open={pickerOpen} eventId={event.id} selectedAssetId={effective?.assetId} onClose={() => setPickerOpen(false)} onSelect={(asset) => { setChosen(asset); onMediaResolved({ id: asset.id, originalFilename: asset.originalFilename, width: asset.width, height: asset.height, web: asset.variants.web }); if (media && viewport !== "desktop") onChange(setBackgroundMediaDeviceAsset(media as BackgroundMediaReference, viewport, asset.id)); else onChange({ assetId: asset.id, ...(media?.focalPoint ? { focalPoint: media.focalPoint } : {}), ...(media?.zoom ? { zoom: media.zoom } : {}), ...(media?.responsive ? { responsive: media.responsive } : {}) }); setPickerOpen(false); }} />
  </section>;
}
