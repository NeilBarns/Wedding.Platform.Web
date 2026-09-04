import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { addGroupChild, createGroupElement, findSectionElement, ungroupSectionElement, updateGroupChildren, updateSectionTextElement, type SectionChildFlow } from "../websiteEditor/sectionChildFlow";
import { GroupElementRenderer } from "../websiteRenderer/GroupElementRenderer";
import { WebsiteElementFrame } from "../websiteRenderer/WebsiteElementFrame";
import { compositionGroupSchema } from "./schemas";
import type { CompositionGroup } from "./types";

const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as never;
const group: CompositionGroup = { id: "group", type: "compositionGroup", children: [{ id: "a", type: "text", text: "First" }, { id: "b", type: "text", text: "Second" }], layout: { width: "narrow", direction: "horizontal", gap: "l", padding: { top: "s" }, alignment: "center", columns: "content-wide", responsive: { mobile: { direction: "vertical", gap: "s" } } } };

describe("Group", () => {
  it("validates the focused layout contract and rejects the retired placeholder", () => {
    expect(compositionGroupSchema.safeParse(group).success).toBe(true);
    expect(compositionGroupSchema.safeParse({ id: "old", type: "compositionGroup", composition: "flow", children: [] }).success).toBe(false);
  });

  it("renders responsive composition without decoration or external margin", () => {
    const desktop = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    const mobile = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(desktop).toContain("grid-template-columns:minmax(0,2fr) minmax(0,3fr)");
    expect(desktop).toContain("gap:1.5rem");
    expect(desktop).toContain("max-width:32rem");
    expect(mobile).toContain("flex-direction:column");
    expect(mobile).toContain("gap:0.5rem");
    expect(desktop).not.toMatch(/background|border-radius|box-shadow/);
  });

  it("shows a selectable Group boundary only in the editor", () => {
    const editor = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date" elementId="group" elementType="Group" selected onSelect={() => undefined}>
      <GroupElementRenderer group={group} sectionId="date" mode="editor" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} selectedElementId="group" />
    </WebsiteElementFrame>);
    const published = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(editor).toContain('data-editor-group="true"');
    expect(editor).toContain('aria-label="Select Group"');
    expect(editor).toContain("editor-group-boundary");
    expect(published).not.toContain("Select Group");
    expect(published).not.toContain("editor-group-boundary");
  });

  it("supports child insertion, reordering updates, nested lookup, and stable ungroup order", () => {
    let flow: SectionChildFlow = { elements: [group], order: [{ kind: "specialized", key: "content" }, { kind: "element", id: group.id }] };
    flow = addGroupChild(flow, group.id, { id: "c", type: "text", text: "Third" });
    expect(findSectionElement(flow, "c")?.type).toBe("text");
    flow = updateGroupChildren(flow, group.id, [...group.children].reverse());
    expect((findSectionElement(flow, group.id) as CompositionGroup).children.map(({ id }) => id)).toEqual(["b", "a"]);
    flow = ungroupSectionElement(flow, group.id);
    expect(flow.order).toEqual([{ kind: "specialized", key: "content" }, { kind: "element", id: "b" }, { kind: "element", id: "a" }]);
  });

  it("caps nesting at two Group levels", () => {
    const nested = { id: "one", type: "compositionGroup", children: [{ id: "two", type: "compositionGroup", children: [{ id: "three", type: "compositionGroup", children: [] }] }] };
    expect(compositionGroupSchema.safeParse(nested).success).toBe(false);
    expect(createGroupElement().layout).toMatchObject({ direction: "vertical", gap: "none", width: "full" });
  });

  it("updates nested Text without replacing its Group or identity", () => {
    const flow: SectionChildFlow = { elements: [group], order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "group" }] };
    const updated = updateSectionTextElement(flow, "a", "Typing works");
    expect(findSectionElement(updated ?? undefined, "a")).toMatchObject({ id: "a", type: "text", text: "Typing works" });
    expect(findSectionElement(updated ?? undefined, "group")?.type).toBe("compositionGroup");
  });
});
