import type { WebsiteElement } from "../websiteElements/types";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { resolveFourSidedSpacing, SPACING_PRESET_CSS, type FourSidedSpacing } from "../websiteElements/spacing";
export function OuterSpacingWrapper({ element, viewport, children, sectionId, selected = false, onSelect, onEdit }: { element: WebsiteElement; viewport: ResponsiveViewport; children: React.ReactNode; sectionId?: string; selected?: boolean; onSelect?: (sectionId: string, elementId: string) => void; onEdit?: (sectionId: string, elementId: string) => void }) {
  const appearance = ("appearance" in element ? element.appearance : undefined) as { outerSpacing?: FourSidedSpacing; responsive?: Partial<Record<"tablet" | "mobile", { outerSpacing?: FourSidedSpacing }>> } | undefined;
  const spacing = resolveFourSidedSpacing(appearance?.outerSpacing, viewport === "desktop" ? undefined : appearance?.responsive?.[viewport]?.outerSpacing);
  return <div data-block-outer-spacing className="w-full min-w-0 max-w-full" style={{ boxSizing: "border-box", paddingTop: SPACING_PRESET_CSS[spacing.top ?? "none"], paddingRight: SPACING_PRESET_CSS[spacing.right ?? "none"], paddingBottom: SPACING_PRESET_CSS[spacing.bottom ?? "none"], paddingLeft: SPACING_PRESET_CSS[spacing.left ?? "none"] }} onPointerDown={(event) => { if (event.target !== event.currentTarget || !sectionId) return; event.stopPropagation(); if (selected) onEdit?.(sectionId, element.id); else onSelect?.(sectionId, element.id); }}>{children}</div>;
}
