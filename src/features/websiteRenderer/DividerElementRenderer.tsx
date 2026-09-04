import type { CSSProperties } from "react";
import type { TemplateDesignLibrary, ResolvedDesignContext } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import { dividerRegistryForTemplate, resolveDividerAsset } from "../websiteElements/divider";
import type { DividerElement } from "../websiteElements/types";

const alignmentStyles = { start: "flex-start", center: "center", end: "flex-end" } as const;

export function DividerElementRenderer({ element, templateKey, library, projectColors = [], context, mode = "public" }: { element: DividerElement; templateKey: string; library: TemplateDesignLibrary; projectColors?: readonly ProjectColor[]; context?: ResolvedDesignContext | null; mode?: "editor" | "public" }) {
  const appearance = element.appearance ?? {};
  const registry = dividerRegistryForTemplate(templateKey);
  const asset = resolveDividerAsset(templateKey, appearance.assetId);
  if (!asset) return mode === "editor" ? <div data-website-element="divider" data-divider-unavailable role="status" className="min-h-10 w-full text-center text-xs leading-10 text-foreground-muted">No Divider assets for this template</div> : null;

  const width = appearance.width ?? asset.defaultWidth ?? registry.defaultWidth;
  const alignment = appearance.alignment ?? asset.defaultAlignment ?? registry.defaultAlignment;
  const color = resolveWebsiteColor(appearance.colorId ?? context?.accentColorId, library, projectColors) ?? "currentColor";
  const visualStyle: CSSProperties = {
    width: `${registry.widthRange.minPercent + (registry.widthRange.maxPercent - registry.widthRange.minPercent) * (width / 100)}%`,
    aspectRatio: `${asset.intrinsicWidth} / ${asset.intrinsicHeight}`,
    backgroundColor: color,
    opacity: (appearance.opacity ?? 100) / 100,
    mask: `url('${asset.assetPath}') center / contain no-repeat`,
    WebkitMask: `url('${asset.assetPath}') center / contain no-repeat`,
  };

  return <div data-website-element="divider" data-divider-asset={asset.id} role="separator" className="flex w-full" style={{ justifyContent: alignmentStyles[alignment] }}><span aria-hidden="true" style={visualStyle} /></div>;
}
