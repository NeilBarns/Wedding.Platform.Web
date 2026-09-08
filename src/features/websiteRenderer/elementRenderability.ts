import type { WebsiteElement } from "../websiteElements/types";
import type { ResolvedWebsiteMedia } from "../websiteEditor/types";
import { resolveDividerAsset } from "../websiteElements/divider";

export function resolvedMediaItems(element: Extract<WebsiteElement, { type: "media" }>, media: Record<string, ResolvedWebsiteMedia>) {
  return element.items.filter((item) => item.type === "video" || Boolean(media[item.mediaId]));
}

export function isElementRenderable(element: WebsiteElement, templateKey: string, mode: "editor" | "public", media: Record<string, ResolvedWebsiteMedia> = {}): boolean {
  if (element.isHidden) return false;
  if (mode === "editor") return true;
  if (element.type === "divider") return Boolean(resolveDividerAsset(templateKey, element.appearance?.assetId));
  if (element.type === "media") return resolvedMediaItems(element, media).length > 0;
  if (element.type === "compositionGroup" && element.children.length > 0) return element.children.some((child) => isElementRenderable(child, templateKey, mode, media));
  return true;
}
