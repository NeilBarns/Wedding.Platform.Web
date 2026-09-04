import type { CompositionGroup } from "./types";
import type { ResponsiveViewport } from "../websiteEditor/types";

export type GroupLayout = NonNullable<CompositionGroup["layout"]>;
export type GroupLayoutOverride = NonNullable<NonNullable<GroupLayout["responsive"]>["mobile"]>;
export const GROUP_DIRECTIONS = ["vertical", "horizontal"] as const;
export const GROUP_GAPS = ["none", "xs", "s", "m", "l", "xl"] as const;
export const GROUP_ALIGNMENTS = ["start", "center", "end", "stretch"] as const;
export const GROUP_COLUMNS = ["equal-2", "content-wide", "content-narrow", "equal-3"] as const;
export const GROUP_WIDTHS = ["full", "wide", "medium", "narrow"] as const;

export function resolveGroupLayout(layout: GroupLayout | undefined, viewport: ResponsiveViewport): GroupLayout {
  const base = layout ?? {};
  const tablet = viewport === "desktop" ? {} : base.responsive?.tablet ?? {};
  const mobile = viewport === "mobile" ? base.responsive?.mobile ?? {} : {};
  const resolved = { ...base, ...tablet, ...mobile, responsive: base.responsive };
  if (viewport === "mobile" && base.responsive?.mobile?.direction === undefined) resolved.direction = "vertical";
  return resolved;
}

export function setGroupLayoutProperty<K extends keyof GroupLayoutOverride>(layout: GroupLayout, viewport: ResponsiveViewport, key: K, value: GroupLayoutOverride[K] | undefined): GroupLayout {
  if (viewport === "desktop") {
    const next = { ...layout };
    if (value === undefined) delete next[key]; else Object.assign(next, { [key]: value });
    return next;
  }
  const responsive = { ...layout.responsive };
  const branch = { ...responsive[viewport] };
  if (value === undefined) delete branch[key]; else Object.assign(branch, { [key]: value });
  if (Object.keys(branch).length) responsive[viewport] = branch; else delete responsive[viewport];
  const next = { ...layout };
  if (Object.keys(responsive).length) next.responsive = responsive; else delete next.responsive;
  return next;
}
