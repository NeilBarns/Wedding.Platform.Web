import type { CompositionGroup } from "../../websiteElements/types";
import {
  createSectionElement,
  moveSectionElement,
  updateGroupChildren,
  type SectionChildFlow,
  type SectionChildReference,
} from "../sectionChildFlow";

export type GroupAddKind = "text" | "richText" | "divider" | "media" | "group";

export const groupAddKinds = (depth: number): readonly GroupAddKind[] => depth < 2
  ? ["text", "richText", "divider", "media", "group"]
  : ["text", "richText", "divider", "media"];

export function addToGroup(
  group: CompositionGroup,
  kind: GroupAddKind,
  flow: SectionChildFlow,
  onChange: (flow: SectionChildFlow) => void,
  onSelect: (reference: SectionChildReference) => void,
) {
  const child = createSectionElement(flow, kind === "group" ? "compositionGroup" : kind);
  onChange(updateGroupChildren(flow, group.id, [...group.children, child as typeof group.children[number]]));
  onSelect({ kind: "element", id: child.id });
}

export function reorderGroupChildren(group: CompositionGroup, from: number, to: number) {
  if (from < 0 || to < 0 || from >= group.children.length || to >= group.children.length || from === to) return group.children;
  const children = [...group.children];
  const [moved] = children.splice(from, 1);
  children.splice(to, 0, moved);
  return children;
}

export function applyStructureElementDrop(
  flow: SectionChildFlow,
  elementId: string,
  destination: { parentId: string | null; index: number },
  onChange: (flow: SectionChildFlow) => void,
  onSelect: (reference: SectionChildReference) => void,
): boolean {
  const moved = moveSectionElement(flow, elementId, destination);
  if (!moved.ok) return false;
  onChange(moved.flow);
  onSelect({ kind: "element", id: elementId });
  return true;
}
