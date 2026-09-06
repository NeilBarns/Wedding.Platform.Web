import type { CompositionGroup } from "../../websiteElements/types";
import {
  createDividerElement,
  createGroupElement,
  createMediaElement,
  createRichTextElement,
  createTextElement,
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
  const child = kind === "text" ? createTextElement()
    : kind === "richText" ? createRichTextElement()
      : kind === "divider" ? createDividerElement()
        : kind === "media" ? createMediaElement()
          : createGroupElement();
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
