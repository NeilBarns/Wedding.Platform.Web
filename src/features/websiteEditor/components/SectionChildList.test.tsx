import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CompositionGroup } from "../../websiteElements/types";
import type { SectionChildFlow } from "../sectionChildFlow";
import { GroupDisclosure, SectionChildList } from "./SectionChildList";
import { addToGroup, groupAddKinds, reorderGroupChildren } from "./sectionChildListHelpers";

const nestedGroup: CompositionGroup = {
  id: "nested-group",
  type: "compositionGroup",
  children: [{ id: "hidden-child", type: "text", text: "Hidden child", isHidden: true }],
  layout: {},
};

const topGroup: CompositionGroup = {
  id: "top-group",
  type: "compositionGroup",
  children: [
    nestedGroup as CompositionGroup["children"][number],
    { id: "long-label", type: "text", text: "A very long element label that must remain available after visual truncation" },
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
    onDuplicate={vi.fn()}
    onDelete={vi.fn()}
  />,
);

describe("SectionChildList dense Group hierarchy", () => {
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
    expect(html).toContain('role="img" aria-label="Hidden" title="Hidden"');
    expect(html).not.toContain(">Hidden</span>");
    expect(html).toContain('title="A very long element label that must remain available after visual truncation"');
    expect(html).toContain("block truncate text-xs");
  });

  it("strengthens row actions for selection while retaining context menus and drag handles", () => {
    const html = renderList("nested-group");
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('aria-label="Group actions"');
    expect(html).toContain('aria-label="Drag Group"');
    expect(html).toContain("group-hover/structure-row:opacity-100");
    expect(html).toContain('class="relative shrink-0"');
  });

  it("preserves nested drag/reorder behavior", () => {
    expect(reorderGroupChildren(topGroup, 0, 1).map(({ id }) => id)).toEqual(["long-label", "nested-group"]);
    expect(topGroup.children.map(({ id }) => id)).toEqual(["nested-group", "long-label"]);
  });

  it("adds a child from a Group row and selects it", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    addToGroup(topGroup, "text", flow, onChange, onSelect);
    const updated = onChange.mock.calls[0][0] as SectionChildFlow;
    const updatedGroup = updated.elements.find(({ id }) => id === topGroup.id) as CompositionGroup;
    expect(updatedGroup.children).toHaveLength(topGroup.children.length + 1);
    expect(updatedGroup.children.at(-1)?.type).toBe("text");
    expect(onSelect).toHaveBeenCalledWith({ kind: "element", id: updatedGroup.children.at(-1)?.id });
  });

  it("does not offer a third Group nesting level and keeps all non-Group child choices", () => {
    expect(groupAddKinds(1)).toEqual(["text", "richText", "divider", "media", "group"]);
    expect(groupAddKinds(2)).toEqual(["text", "richText", "divider", "media"]);
  });
});
