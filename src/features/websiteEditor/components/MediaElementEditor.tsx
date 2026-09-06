import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import type { MediaAsset } from "../../media/types";
import { setMediaItems, setMediaPresentationProperty } from "../../websiteElements/media";
import type { MediaElement } from "../../websiteElements/types";
import { createSemanticId } from "../createSemanticId";
import type { ResponsiveViewport, ResolvedWebsiteMedia } from "../types";
import { FocalPointEditor } from "./FocalPointEditor";
import { InspectorField, InspectorSection } from "./InspectorPrimitives";
import { MediaPickerDialog } from "./MediaPickerDialog";

const choices = (values: readonly string[]) => values.map((value) => ({ value, label: value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()) }));
const updateAppearance = (element: MediaElement, key: keyof NonNullable<MediaElement["appearance"]>, value: string): MediaElement => ({ ...element, appearance: { ...element.appearance, [key]: value } });

export function MediaElementEditor({ element, eventId, viewport, mode, resolvedMedia, onMediaResolved, onChange }: { element: MediaElement; eventId: string; viewport: ResponsiveViewport; mode: "content" | "appearance"; resolvedMedia: Record<string, ResolvedWebsiteMedia>; onMediaResolved: (media: ResolvedWebsiteMedia) => void; onChange: (element: MediaElement) => void }) {
  const [picker, setPicker] = useState<{ open: boolean; replaceId?: string }>({ open: false });
  const hasStackedMode = element.presentation?.mode === "stacked" || element.presentation?.responsive?.tablet?.mode === "stacked" || element.presentation?.responsive?.mobile?.mode === "stacked";
  const selectedPickerItem = element.items.find((item) => item.id === picker.replaceId && item.type === "image");
  const updateItem = (id: string, update: Record<string, unknown>) => onChange({ ...element, items: element.items.map((item) => item.id === id ? { ...item, ...update } as typeof item : item) });
  const chooseImage = (asset: MediaAsset) => {
    onMediaResolved({ id: asset.id, originalFilename: asset.originalFilename, width: asset.width, height: asset.height, web: asset.variants.web });
    const image = { id: createSemanticId("media-item"), type: "image" as const, mediaId: asset.id, alt: asset.originalFilename.replace(/\.[^.]+$/, "") };
    const items = picker.replaceId ? element.items.map((item) => item.id === picker.replaceId ? { ...image, id: item.id } : item) : [...element.items, image];
    onChange(setMediaItems(element, items));
    setPicker({ open: false });
  };
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= element.items.length) return; const items = [...element.items]; [items[index], items[target]] = [items[target], items[index]]; onChange({ ...element, items }); };

  if (mode === "content") return <div className="space-y-5" data-media-element-editor data-media-editor-mode="content">
    <InspectorSection title="Media content" description="Add one video or up to eight images.">
      {element.items.every(({ type }) => type === "image") && <><Button type="button" size="sm" disabled={element.items.length >= (hasStackedMode ? 5 : 8)} onClick={() => setPicker({ open: true })}><Plus size={14} /> Add image</Button>{hasStackedMode && <p className="mt-1 text-[11px] text-foreground-muted">Stacked compositions support up to five images.</p>}</>}
      {element.items.length === 0 && <AddVideo onAdd={(url) => onChange({ ...element, items: [{ id: createSemanticId("media-item"), type: "video", url, controls: true }] })} />}
      <div className="space-y-3">{element.items.map((item, index) => <div key={item.id} className="rounded-lg border border-border p-3">
        <div className="flex items-center gap-1"><span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.type === "image" ? "Image" : "Video"} {index + 1}</span><Button size="sm" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={13} /></Button><Button size="sm" variant="ghost" aria-label="Move down" disabled={index === element.items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={13} /></Button><Button size="sm" variant="ghost" aria-label="Duplicate media" disabled={item.type === "video" || element.items.length >= (hasStackedMode ? 5 : 8)} onClick={() => { const items = [...element.items]; items.splice(index + 1, 0, { ...item, id: createSemanticId("media-item") }); onChange(setMediaItems(element, items)); }}><Copy size={13} /></Button><Button size="sm" variant="ghost" aria-label="Remove media" onClick={() => onChange(setMediaItems(element, element.items.filter(({ id }) => id !== item.id)))}><Trash2 size={13} /></Button></div>
        {item.type === "image" ? <ImageItemEditor item={item} controlId={`${element.id}-${item.id}`} asset={resolvedMedia[item.mediaId]} onChange={(update) => updateItem(item.id, update)} onReplace={() => setPicker({ open: true, replaceId: item.id })} /> : <VideoItemEditor item={item} onChange={(update) => updateItem(item.id, update)} />}
      </div>)}</div>
    </InspectorSection>
    <MediaPickerDialog open={picker.open} eventId={eventId} selectedAssetId={selectedPickerItem?.type === "image" ? selectedPickerItem.mediaId : undefined} onClose={() => setPicker({ open: false })} onSelect={chooseImage} />
  </div>;

  const presentation = element.presentation ?? {};
  const responsive = viewport === "desktop" ? undefined : presentation.responsive?.[viewport];
  const effectiveMode = responsive?.mode ?? presentation.mode ?? (element.items.length > 1 ? "carousel" : "single");
  const set = (key: "mode" | "width" | "aspectRatio" | "alignment" | "fit" | "carousel" | "stacked", value: unknown) => onChange(setMediaPresentationProperty(element, viewport, key, value));
  const carousel = presentation.carousel ?? {};
  return <div className="space-y-5" data-media-element-editor data-media-editor-mode="appearance">
    <InspectorSection title="Presentation"><Field label="Layout" value={effectiveMode} values={element.items.length > 1 ? element.items.length <= 5 ? ["carousel", "stacked"] : ["carousel"] : ["single"]} onChange={(value) => set("mode", value)} />{effectiveMode === "stacked" && <Field label="Stack style" value={presentation.stacked?.style ?? "polaroid"} values={["polaroid", "soft-overlap", "editorial"]} onChange={(style) => set("stacked", { ...presentation.stacked, style })} />}<Field label="Width" value={responsive?.width ?? presentation.width ?? "full"} values={["small", "medium", "large", "full"]} onChange={(value) => set("width", value)} /><Field label="Alignment" value={presentation.alignment ?? "center"} values={["start", "center", "end"]} onChange={(value) => set("alignment", value)} /><Field label="Aspect ratio" value={responsive?.aspectRatio ?? presentation.aspectRatio ?? "natural"} values={["natural", "square", "portrait", "landscape", "wide"]} onChange={(value) => set("aspectRatio", value)} /><Field label="Fit" value={presentation.fit ?? "cover"} values={["cover", "contain"]} onChange={(value) => set("fit", value)} /></InspectorSection>
    <InspectorSection title="Appearance"><Field label="Corners" value={element.appearance?.corners ?? "square"} values={["square", "soft", "rounded", "pill"]} onChange={(value) => onChange(updateAppearance(element, "corners", value))} />{!(effectiveMode === "stacked" && (presentation.stacked?.style ?? "polaroid") === "polaroid") && <><Field label="Frame" value={element.appearance?.frame ?? "none"} values={["none", "line", "mat"]} onChange={(value) => onChange(updateAppearance(element, "frame", value))} /><Field label="Shadow" value={element.appearance?.shadow ?? "none"} values={["none", "soft", "medium", "strong"]} onChange={(value) => onChange(updateAppearance(element, "shadow", value))} /></>}</InspectorSection>
    {effectiveMode === "carousel" && <InspectorSection title="Carousel"><Field label="Carousel style" value={carousel.style ?? "standard"} values={["standard", "peek"]} onChange={(style) => set("carousel", { ...carousel, style })} /><Toggle label="Autoplay" checked={carousel.autoplay ?? false} onChange={(autoplay) => set("carousel", { ...carousel, autoplay })} />{carousel.autoplay && <InspectorField label="Interval"><Input type="number" min={2000} max={15000} step={500} value={carousel.interval ?? 5000} onChange={(event) => set("carousel", { ...carousel, interval: Number(event.target.value) })} /></InspectorField>}<Toggle label="Show arrows" checked={carousel.arrows ?? true} onChange={(arrows) => set("carousel", { ...carousel, arrows })} /><Toggle label="Show dots" checked={carousel.dots ?? true} onChange={(dots) => set("carousel", { ...carousel, dots })} /><Toggle label="Loop" checked={carousel.loop ?? true} onChange={(loop) => set("carousel", { ...carousel, loop })} /></InspectorSection>}
  </div>;
}

function AddVideo({ onAdd }: { onAdd: (url: string) => void }) { const [url, setUrl] = useState(""); return <div className="mt-2"><Input aria-label="Direct video URL" type="url" value={url} placeholder="https://example.com/video.mp4" onChange={(event) => setUrl(event.target.value)} /><p className="mt-1 text-[11px] text-foreground-muted">Use a direct HTTPS video file URL. Provider page links are not supported.</p><Button className="mt-2" type="button" size="sm" disabled={!/^https:\/\//.test(url)} onClick={() => onAdd(url)}><Plus size={14} /> Add video</Button></div>; }
function VideoItemEditor({ item, onChange }: { item: Extract<MediaElement["items"][number], { type: "video" }>; onChange: (update: Record<string, unknown>) => void }) { return <div className="mt-2 space-y-2"><Input aria-label="Direct video URL" type="url" value={item.url} onChange={(event) => onChange({ url: event.target.value })} /><Toggle label="Show video controls" checked={item.controls ?? true} onChange={(controls) => onChange({ controls })} /><p className="text-[11px] text-foreground-muted">Direct HTTPS video files only. YouTube and Vimeo page links are not supported.</p></div>; }
function ImageItemEditor({ item, asset, controlId, onChange, onReplace }: { item: Extract<MediaElement["items"][number], { type: "image" }>; asset?: ResolvedWebsiteMedia; controlId: string; onChange: (update: Record<string, unknown>) => void; onReplace: () => void }) { return <div className="mt-2"><Input aria-label="Alt text" value={item.alt ?? ""} placeholder="Describe this image" onChange={(event) => onChange({ alt: event.target.value })} /><label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={item.decorative ?? false} onChange={(event) => onChange({ decorative: event.target.checked, alt: event.target.checked ? "" : item.alt })} /> Decorative image</label>{asset && <div className="mt-3"><FocalPointEditor controlId={controlId} url={asset.web.url} point={item.focalPoint ?? { x: .5, y: .5 }} zoom={item.zoom} onChange={({ point: focalPoint, zoom }) => onChange({ focalPoint, zoom })} /><p className="mt-1 truncate text-xs text-foreground-muted">{asset.originalFilename}</p><Button className="mt-2" size="sm" type="button" variant="secondary" onClick={onReplace}>Change image</Button></div>}</div>; }
function Field({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) { return <InspectorField label={label}><Select value={value} options={choices(values)} onChange={onChange} /></InspectorField>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center justify-between gap-3 text-xs font-medium"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
