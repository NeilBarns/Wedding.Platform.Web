import type { CSSProperties } from "react";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveGroupLayout } from "../websiteElements/group";
import type { CompositionGroup } from "../websiteElements/types";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { WebsiteElementFrame } from "./WebsiteElementFrame";
import { WebsiteLeafElementRenderer } from "./WebsiteLeafElementRenderer";
import { DecorativeBackgroundLayers } from "./DecorativeBackgroundLayers";
import { resolveNarrativeBackgroundColor } from "./narrativeBackground";
import { elementInlineAlignmentOverride } from "./elementInlineAlignment";

const spaces = { none: "0", xs: "0.25rem", s: "0.5rem", m: "1rem", l: "1.5rem", xl: "2rem" } as const;
const widths = { full: "100%", wide: "72rem", medium: "48rem", narrow: "32rem" } as const;
const columns = { "equal-2": "repeat(2,minmax(0,1fr))", "content-wide": "minmax(0,2fr) minmax(0,3fr)", "content-narrow": "minmax(0,3fr) minmax(0,2fr)", "equal-3": "repeat(6,minmax(0,1fr))" } as const;
const twoColumnPresets = new Set<keyof typeof columns>(["equal-2", "content-wide", "content-narrow"]);
const shadows = { none: "none", soft: "0 4px 16px rgb(0 0 0 / .1)", medium: "0 10px 28px rgb(0 0 0 / .16)", strong: "0 18px 45px rgb(0 0 0 / .24)" } as const;
const childAlignment = { start: "flex-start", center: "center", end: "flex-end", stretch: "flex-start" } as const;

export function GroupElementRenderer({ group, sectionId, mode, viewport, templateKey, library, projectColors, media = {}, context, selectedElementId, onElementSelect, onElementEdit }: {
  group: CompositionGroup; sectionId: string; mode: "editor" | "public"; viewport: ResponsiveViewport; templateKey: string; library: TemplateDesignLibrary; projectColors: readonly ProjectColor[]; media?: import("../websiteEditor/types").WebsiteDraft["media"]; context?: ResolvedDesignContext | null; selectedElementId?: string | null; onElementSelect?: (sectionId: string, elementId: string) => void; onElementEdit?: (sectionId: string, elementId: string) => void;
}) {
  const layout = resolveGroupLayout(group.layout, viewport);
  const visibleChildren = group.children.filter((child) => !child.isHidden);
  const direction = layout.direction ?? "vertical";
  const alignment = layout.alignment ?? "stretch";
  const columnPreset = layout.columns ?? "equal-2";
  const hasTwoColumnOrphan = direction === "horizontal" && twoColumnPresets.has(columnPreset) && visibleChildren.length % 2 === 1;
  const thirdsRemainder = direction === "horizontal" && columnPreset === "equal-3" ? visibleChildren.length % 3 : 0;
  const childGridStyle = (index: number): CSSProperties | undefined => {
    if (hasTwoColumnOrphan && index === visibleChildren.length - 1) return { gridColumn: "1 / -1" };
    if (direction !== "horizontal" || columnPreset !== "equal-3") return undefined;
    if (thirdsRemainder === 1 && index === visibleChildren.length - 1) return { gridColumn: "1 / -1" };
    if (thirdsRemainder === 2 && index >= visibleChildren.length - 2) return { gridColumn: "span 3" };
    return { gridColumn: "span 2" };
  };
  const padding = layout.padding ?? {};
  const backgroundColor = resolveNarrativeBackgroundColor(group.appearance?.backgroundColorId, library, projectColors);
  const hasDecoration = Boolean(group.appearance?.decorativeAppearance?.background);
  const style: CSSProperties = {
    display: direction === "horizontal" ? "grid" : "flex", flexDirection: "column",
    gridTemplateColumns: direction === "horizontal" ? columns[columnPreset] : undefined,
    gap: spaces[layout.gap ?? "none"], alignItems: direction === "horizontal" ? alignment : "stretch",
    paddingTop: spaces[padding.top ?? "none"], paddingRight: spaces[padding.right ?? "none"], paddingBottom: spaces[padding.bottom ?? "none"], paddingLeft: spaces[padding.left ?? "none"],
    boxSizing: "border-box", minWidth: 0,
    width: "100%", maxWidth: widths[layout.width ?? "full"], marginInline: layout.width && layout.width !== "full" ? "auto" : undefined,
    minHeight: mode === "editor" && visibleChildren.length === 0 ? "2.5rem" : undefined,
    backgroundColor,
    boxShadow: group.appearance?.shadow ? shadows[group.appearance.shadow] : undefined,
  };
  const groupClassName = [
    mode === "editor" && "editor-group-boundary",
    (mode === "editor" || hasDecoration) && "relative",
    hasDecoration && "isolate",
  ].filter(Boolean).join(" ") || undefined;
  return <div data-website-element="group" data-editor-group={mode === "editor" ? "true" : undefined} className={groupClassName} style={style}>
    {hasDecoration && <DecorativeBackgroundLayers templateKey={templateKey} appearance={group.appearance?.decorativeAppearance?.background} viewport={viewport} />}
    {mode === "editor" && visibleChildren.length === 0 && <span className="pointer-events-none absolute inset-0 grid place-items-center px-3 text-center text-xs text-foreground-muted" data-empty-group>Empty Group · add children in Structure</span>}
    {visibleChildren.map((element, index) => {
    const childSelected = selectedElementId === element.id;
    const frame = <WebsiteElementFrame mode={mode} sectionId={sectionId} elementId={element.id} elementType={element.type === "compositionGroup" ? "Group" : element.type === "media" ? "Media" : element.type} selected={childSelected} onSelect={onElementSelect} onEdit={element.type === "text" ? onElementEdit : undefined}>
      {element.type === "compositionGroup"
        ? <GroupElementRenderer media={media} group={element} sectionId={sectionId} mode={mode} viewport={viewport} templateKey={templateKey} library={library} projectColors={projectColors} context={context} selectedElementId={selectedElementId} onElementSelect={onElementSelect} onElementEdit={onElementEdit} />
        : <WebsiteLeafElementRenderer media={media} element={element} mode={mode} sectionId={sectionId} selected={childSelected} viewport={viewport} templateKey={templateKey} library={library} projectColors={projectColors} context={context} />}
    </WebsiteElementFrame>;
    const className = hasDecoration ? "relative z-10 min-w-0 max-w-full [overflow-wrap:anywhere]" : "min-w-0 max-w-full [overflow-wrap:anywhere]";
    if (direction === "horizontal") return <div key={element.id} className={className} style={childGridStyle(index)}>{frame}</div>;
    return <div key={element.id} data-group-child-containment data-group-child-alignment={alignment} className={className} style={{ display: "flex", justifyContent: childAlignment[alignment], width: "100%", minWidth: 0, maxWidth: "100%" }}><div data-group-rendered-child className="min-w-0 max-w-full [overflow-wrap:anywhere]" style={{ width: "100%", maxWidth: "100%", flex: "0 1 auto", ...elementInlineAlignmentOverride(alignment === "stretch" ? undefined : childAlignment[alignment]) }}>{frame}</div></div>;
  })}</div>;
}
