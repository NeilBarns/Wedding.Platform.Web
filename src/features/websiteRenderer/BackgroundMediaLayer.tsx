import { useEffect, useRef } from "react";
import type { ResolvedWebsiteMedia, ResponsiveViewport, SectionMedia } from "../websiteEditor/types";
import { calculateBackgroundMinimumZoom } from "../websiteElements/mediaCrop";
import { publishBackgroundMinimumZoom } from "../websiteMedia/backgroundGeometry";
import { resolveBackgroundMediaForDevice } from "../websiteMedia/backgroundMedia";
import { ZoomedMediaImage } from "./ZoomedMediaImage";

export function BackgroundMediaLayer({ reference, media, viewport, opacity = 100, kind, ownerId }: { reference?: SectionMedia; media: Record<string, ResolvedWebsiteMedia>; viewport: ResponsiveViewport; opacity?: number; kind: "hero" | "group"; ownerId: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const effective = resolveBackgroundMediaForDevice(reference, viewport);
  const asset = effective ? media[effective.assetId] : undefined;
  useEffect(() => {
    const element = layerRef.current;
    if (!element || !asset) return;
    const measure = () => publishBackgroundMinimumZoom(`${ownerId}:${viewport}`, calculateBackgroundMinimumZoom({ width: element.clientWidth, height: element.clientHeight }, asset.web));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [asset, ownerId, viewport]);
  if (!effective || !asset) return null;
  return <div ref={layerRef} data-background-media-layer data-hero-background-image={kind === "hero" || undefined} data-group-background-image={kind === "group" || undefined} className={`pointer-events-none absolute inset-0${kind === "group" ? " overflow-hidden" : ""}`} style={{ opacity: opacity / 100 }} aria-hidden="true">
    <ZoomedMediaImage alt="" allowZoomOut fill className="h-full w-full" height={asset.web.height} reference={effective} src={asset.web.url} width={asset.web.width} />
  </div>;
}
