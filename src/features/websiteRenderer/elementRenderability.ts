import type { WebsiteElement } from "../websiteElements/types";
import { resolveDividerAsset } from "../websiteElements/divider";

export function isElementRenderable(element: WebsiteElement, templateKey: string, mode: "editor" | "public"): boolean {
  return !element.isHidden && (mode === "editor" || element.type !== "divider" || Boolean(resolveDividerAsset(templateKey, element.appearance?.assetId)));
}
