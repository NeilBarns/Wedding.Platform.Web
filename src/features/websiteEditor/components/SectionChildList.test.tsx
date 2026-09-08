import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CompositionGroup } from "../../websiteElements/types";
import type { SectionChildFlow } from "../sectionChildFlow";
import { GroupDisclosure, SectionChildList } from "./SectionChildList";
import { addToGroup, applyStructureElementDrop, groupAddKinds, reorderGroupChildren } from "./sectionChildListHelpers";
import { findSectionElement } from "../sectionChildFlow";

const nestedGroup: CompositionGroup = {
  id: "nested-group",
  type: "compositionGroup", editorName: "A deeply nested Group name that must truncate without displacing its actions",
  isHidden: true,
  children: [{ id: "hidden-child", type: "text", editorName: "Text 1", text: "Hidden child", isHidden: true }],
  layout: {},
};

const topGroup: CompositionGroup = {
  id: "top-group",
  type: "compositionGroup", editorName: "Group 1",
  children: [
    nestedGroup as CompositionGroup["children"][number],
    { id: "long-label", type: "text", editorName: "A very long editor name that must remain available after visual truncation", text: "Content must not become the label" },
    { id: "rich", type: "richText", editorName: "Rich Text 1", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Copy" }] }] } },
    { id: "media", type: "media", editorName: "Media 1", items: [] },
    { id: "divider", type: "divider", editorName: "Divider 1" },
  ],
  layout: {},
};

const flow: SectionChildFlow = {
  elements: [topGroup],
  order: [
    { kind: "specialized", key: "content" },
    { kind: "element", id: topGroup.id },
  ],
};

const renderList = (selectedId?: string) => renderToStaticMarkup(
  <SectionChildList
    sectionLabel="Date"
    flow={flow}
    selected={selectedId ? { kind: "element", id: selectedId } : null}
    onSelect={vi.fn()}
    onChange={vi.fn()}
    onRenameSave={vi.fn(async () => null)}
    onDuplicate={vi.fn()}
    onDelete={vi.fn()}
  />,
);

describe("SectionChildList dense Group hierarchy", () => {
  it("labels the modal action Save to reflect immediate persistence", () => {
    const html = renderList();
    expect(html).toContain("Rename block");
    expect(html).toContain(">Cancel</button>");
    expect(html).toContain(">Save</button>");
  });

  it("exposes keyboard Move actions and requires a destination in the Move dialog", () => {
    const html = renderList();
    expect(html).toContain('id="move-block-title">Move block</h2>');
    expect(html).toContain('<legend class="mb-2 text-xs font-medium">Move to</legend>');
    expect(html).toContain('type="submit" disabled="">Move</button>');
  });

  it("renders top-level and nested Groups expanded with row-local disclosure and add-child controls", () => {
    const html = renderList();
    expect(html).toContain('data-structure-row="group"');
    expect(html).toContain('data-structure-row="nested-group"');
    expect(html.match(/aria-label="Collapse Group"/g)).toHaveLength(2);
    expect(html.match(/aria-label="Add child to Group"/g)).toHaveLength(2);
    expect(html).toContain('data-group-children="top-group"');
    expect(html).toContain('data-group-children="nested-group"');
    expect(html).not.toContain("ml-5");
  });

  it("supports the collapsed and expanded disclosure states at both Group depths", () => {
    const expanded = renderToStaticMarkup(<GroupDisclosure expanded onToggle={vi.fn()} />);
    const collapsed = renderToStaticMarkup(<GroupDisclosure expanded={false} onToggle={vi.fn()} />);
    expect(expanded).toContain('aria-expanded="true"');
    expect(expanded).toContain('aria-label="Collapse Group"');
    expect(collapsed).toContain('aria-expanded="false"');
    expect(collapsed).toContain('aria-label="Expand Group"');
    expect(collapsed).toContain("-rotate-90");
  });

  it("keeps hidden state compact on the child row and preserves the full long label", () => {
    const html = renderList();
    expect(html).toContain('data-element-hidden="true"');
    expect(html).not.toContain('role="img" aria-label="Hidden"');
    expect(html).toContain('title="A very long editor name that must remain available after visual truncation"');
    expect(html).not.toContain("Content must not become the label");
    expect(html).toContain("block truncate text-xs");
  });

  it("keeps root and nested Group names visible while reserving bounded action space", () => {
    const html = renderList();
    expect(html).toContain('title="Group 1"');
    expect(html).toContain('title="A deeply nested Group name that must truncate without displacing its actions"');
    expect(html).toContain('class="min-w-12 basis-12 flex-1');
    expect(html).toContain('class="ml-auto flex shrink-0 items-center gap-0.5"');
    expect(html).toContain('class="group/structure-row flex w-full min-w-0 max-w-full');
    expect(html).not.toContain('class="ml-3 space-y-0.5');
  });

  it("keeps the hidden nested Group label, Add control, and context menu in the same bounded row", () => {
    const html = renderList();
    expect(html).toContain('data-structure-row="nested-group"');
    expect(html).toContain('data-element-hidden="true"');
    expect(html).toContain('aria-label="Add child to Group"');
    expect(html).toContain('aria-label="Group block: A deeply nested Group name that must truncate without displacing its actions, hidden"');
    expect(html).toContain('aria-label="Group block: A deeply nested Group name that must truncate without displacing its actions, hidden actions"');
    expect(html).toContain('text-foreground-muted opacity-50');
    expect(html).toContain('text-foreground-muted opacity-60');
    expect(html).not.toContain('group/structure-row opacity-');
    expect(html.match(/data-structure-actions="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("uses the shared bounded icon, name, and action layout for every generic leaf row", () => {
    const html = renderList();
    for (const label of ["Text block", "Rich Text block", "Media block", "Divider block"]) {
      expect(html).toContain(`${label}:`);
    }
    for (const icon of ["lucide-type", "lucide-pilcrow", "lucide-images", "lucide-minus"]) {
      expect(html).toContain(icon);
    }
    expect(html.match(/data-structure-label="true"/g)?.length).toBeGreaterThanOrEqual(6);
    expect(html.match(/data-structure-actions="true"/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("strengthens row actions for selection while retaining context menus and drag handles", () => {
    const html = renderList("nested-group");
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('aria-label="Group block: A deeply nested Group name that must truncate without displacing its actions, hidden actions"');
    expect(html).toContain('aria-label="Drag Group block: A deeply nested Group name that must truncate without displacing its actions, hidden"');
    expect(html).toContain("lucide-group");
    expect(html).toContain("lucide-type");
    expect(html).toContain("group-hover/structure-row:opacity-100");
    expect(html).toContain('class="relative shrink-0"');
  });

  it("preserves nested drag/reorder behavior", () => {
    expect(reorderGroupChildren(topGroup, 0, 1).map(({ id }) => id)).toEqual(["long-label", "nested-group", "rich", "media", "divider"]);
    expect(topGroup.children.map(({ id }) => id)).toEqual(["nested-group", "long-label", "rich", "media", "divider"]);
  });

  it("applies cross-parent drops and keeps the moved block selected with identity intact", () => {
    const hidden = { id: "move-me", type: "text" as const, editorName: "Renamed hidden block", text: "Authored", isHidden: true, appearance: { fontSize: "l" as const } };
    const candidate: SectionChildFlow = {
      elements: [hidden, { id: "left", type: "compositionGroup", editorName: "Left", children: [] }, { id: "right", type: "compositionGroup", editorName: "Right", children: [] }],
      order: [{ kind: "specialized", key: "content" }, { kind: "element", id: hidden.id }, { kind: "element", id: "left" }, { kind: "element", id: "right" }],
    };
    const onChange = vi.fn();
    const onSelect = vi.fn();
    expect(applyStructureElementDrop(candidate, hidden.id, { parentId: "left", index: 0 }, onChange, onSelect)).toBe(true);
    const moved = onChange.mock.calls[0][0] as SectionChildFlow;
    expect(findSectionElement(moved, hidden.id)).toEqual(hidden);
    expect((findSectionElement(moved, "left") as CompositionGroup).children.map(({ id }) => id)).toEqual([hidden.id]);
    expect(onSelect).toHaveBeenCalledWith({ kind: "element", id: hidden.id });
  });

  it("does not update or clear selection for an invalid cross-parent drop", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    expect(applyStructureElementDrop(flow, "top-group", { parentId: "nested-group", index: 0 }, onChange, onSelect)).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("adds a child from a Group row and selects it", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    addToGroup(topGroup, "text", flow, onChange, onSelect);
    const updated = onChange.mock.calls[0][0] as SectionChildFlow;
    const updatedGroup = updated.elements.find(({ id }) => id === topGroup.id) as CompositionGroup;
    expect(updatedGroup.children).toHaveLength(topGroup.children.length + 1);
    expect(updatedGroup.children.at(-1)?.type).toBe("text");
    expect(updatedGroup.children.at(-1)).toMatchObject({ editorName: "Text 2" });
    expect(onSelect).toHaveBeenCalledWith({ kind: "element", id: updatedGroup.children.at(-1)?.id });
  });

  it("uses the same Section-wide allocator for nested Group creation", () => {
    const onChange = vi.fn();
    addToGroup(nestedGroup, "text", flow, onChange, vi.fn());
    const updated = onChange.mock.calls[0][0] as SectionChildFlow;
    const nested = updated.elements[0].type === "compositionGroup" && updated.elements[0].children[0].type === "compositionGroup" ? updated.elements[0].children[0] : null;
    expect(nested?.children.at(-1)).toMatchObject({ type: "text", editorName: "Text 2" });
  });

  it("does not offer a third Group nesting level and keeps all non-Group child choices", () => {
    expect(groupAddKinds(1)).toEqual(["text", "richText", "divider", "media", "group"]);
    expect(groupAddKinds(2)).toEqual(["text", "richText", "divider", "media"]);
  });
});
