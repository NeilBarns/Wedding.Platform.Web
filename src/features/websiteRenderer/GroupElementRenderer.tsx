import type { CSSProperties } from "react";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveGroupLayout } from "../websiteElements/group";
import type { CompositionGroup } from "../websiteElements/types";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { WebsiteElementFrame } from "./WebsiteElementFrame";
import { WebsiteLeafElementRenderer } from "./WebsiteLeafElementRenderer";

const spaces = { none: "0", xs: "0.25rem", s: "0.5rem", m: "1rem", l: "1.5rem", xl: "2rem" } as const;
const widths = { full: "100%", wide: "72rem", medium: "48rem", narrow: "32rem" } as const;
const columns = { "equal-2": "repeat(2,minmax(0,1fr))", "content-wide": "minmax(0,2fr) minmax(0,3fr)", "content-narrow": "minmax(0,3fr) minmax(0,2fr)", "equal-3": "repeat(3,minmax(0,1fr))" } as const;

export function GroupElementRenderer({ group, sectionId, mode, viewport, templateKey, library, projectColors, context, selectedElementId, onElementSelect, onElementEdit }: {
  group: CompositionGroup; sectionId: string; mode: "editor" | "public"; viewport: ResponsiveViewport; templateKey: string; library: TemplateDesignLibrary; projectColors: readonly ProjectColor[]; context?: ResolvedDesignContext | null; selectedElementId?: string | null; onElementSelect?: (sectionId: string, elementId: string) => void; onElementEdit?: (sectionId: string, elementId: string) => void;
}) {
  const layout = resolveGroupLayout(group.layout, viewport);
  const direction = layout.direction ?? "vertical";
  const padding = layout.padding ?? {};
  const style: CSSProperties = {
    display: direction === "horizontal" ? "grid" : "flex", flexDirection: "column",
    gridTemplateColumns: direction === "horizontal" ? columns[layout.columns ?? "equal-2"] : undefined,
    gap: spaces[layout.gap ?? "none"], alignItems: layout.alignment ?? "stretch",
    paddingTop: spaces[padding.top ?? "none"], paddingRight: spaces[padding.right ?? "none"], paddingBottom: spaces[padding.bottom ?? "none"], paddingLeft: spaces[padding.left ?? "none"],
    width: "100%", maxWidth: widths[group.layout?.width ?? "full"], marginInline: group.layout?.width && group.layout.width !== "full" ? "auto" : undefined,
    minHeight: mode === "editor" && group.children.length === 0 ? "2.5rem" : undefined,
  };
  return <div data-website-element="group" data-editor-group={mode === "editor" ? "true" : undefined} className={mode === "editor" ? "editor-group-boundary relative" : undefined} style={style}>
    {group.children.map((element) => {
    const childSelected = selectedElementId === element.id;
    return <WebsiteElementFrame key={element.id} mode={mode} sectionId={sectionId} elementId={element.id} elementType={element.type === "compositionGroup" ? "Group" : element.type} selected={childSelected} onSelect={onElementSelect} onEdit={element.type === "text" ? onElementEdit : undefined}>
      {element.type === "compositionGroup"
        ? <GroupElementRenderer group={element} sectionId={sectionId} mode={mode} viewport={viewport} templateKey={templateKey} library={library} projectColors={projectColors} context={context} selectedElementId={selectedElementId} onElementSelect={onElementSelect} onElementEdit={onElementEdit} />
        : <WebsiteLeafElementRenderer element={element} mode={mode} sectionId={sectionId} selected={childSelected} viewport={viewport} templateKey={templateKey} library={library} projectColors={projectColors} context={context} />}
    </WebsiteElementFrame>;
  })}</div>;
}
