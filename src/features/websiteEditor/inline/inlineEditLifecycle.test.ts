import { describe, expect, it } from "vitest";
import { normalizeTextContent } from "../../websiteElements/text";
import { findSectionElement, updateSectionTextElement, type SectionChildFlow } from "../sectionChildFlow";
import { advanceInlineEditLifecycle } from "./inlineEditLifecycle";
import { isStandaloneTextEditingTarget, type InlineEditingTarget } from "./types";

describe("standalone Text inline editing lifecycle", () => {
  it("captures the entry value only when editing begins", () => {
    const first = advanceInlineEditLifecycle({ activeKey: null, entryValue: "" }, "section:element:text", "Original");
    expect(first).toEqual({ lifecycle: { activeKey: "section:element:text", entryValue: "Original" }, began: true });

    const typedOnce = advanceInlineEditLifecycle(first.lifecycle, "section:element:text", "Original A");
    const typedAgain = advanceInlineEditLifecycle(typedOnce.lifecycle, "section:element:text", "Original AB");
    expect(typedOnce.began).toBe(false);
    expect(typedAgain.began).toBe(false);
    expect(typedAgain.lifecycle.entryValue).toBe("Original");
  });

  it("creates one focus-worthy transition per edit session and a fresh snapshot after exit", () => {
    const started = advanceInlineEditLifecycle({ activeKey: null, entryValue: "" }, "section:element:text", "First");
    const controlledUpdate = advanceInlineEditLifecycle(started.lifecycle, "section:element:text", "Second");
    const exited = advanceInlineEditLifecycle(controlledUpdate.lifecycle, null, "Second");
    const restarted = advanceInlineEditLifecycle(exited.lifecycle, "section:element:text", "Second");
    expect([started.began, controlledUpdate.began, exited.began, restarted.began]).toEqual([true, false, false, true]);
    expect(restarted.lifecycle.entryValue).toBe("Second");
  });

  it("normalizes typing and multiline paste text to one plain-text value", () => {
    expect(normalizeTextContent("first\r\n\nsecond\u2028third\u2029fourth")).toBe("first second third fourth");
    expect(normalizeTextContent("<strong>plain</strong>\ntext")).toBe("<strong>plain</strong> text");
  });

  it("updates direct and deeply nested Text by ID without replacing adjacent state", () => {
    const direct = { id: "direct", type: "text" as const, editorName: "Text 1", text: "Before", isHidden: true, appearance: { fontSize: "l" as const, responsive: { mobile: { alignment: "center" as const } } } };
    const sibling = { id: "sibling", type: "divider" as const, editorName: "Divider 1" };
    const nested = { id: "nested", type: "text" as const, editorName: "Text 1", text: "Nested before", appearance: { italic: true } };
    const inner = { id: "inner", type: "compositionGroup" as const, editorName: "Group 1", children: [nested] };
    const outer = { id: "outer", type: "compositionGroup" as const, editorName: "Group 1", children: [inner, sibling] };
    const flow: SectionChildFlow = { elements: [direct, outer], order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "direct" }, { kind: "element", id: "outer" }] };

    const directUpdate = updateSectionTextElement(flow, "direct", "Direct\nupdated")!;
    const nestedUpdate = updateSectionTextElement(directUpdate, "nested", "Nested\r\nupdated")!;
    expect(findSectionElement(nestedUpdate, "direct")).toEqual({ ...direct, text: "Direct updated" });
    expect(findSectionElement(nestedUpdate, "nested")).toEqual({ ...nested, text: "Nested updated" });
    expect(findSectionElement(nestedUpdate, "sibling")).toBe(sibling);
    expect(findSectionElement(nestedUpdate, "outer")?.type).toBe("compositionGroup");
  });

  it("preserves raw authored casing while editing under an uppercase presentation", () => {
    const element = { id: "direct", type: "text" as const, editorName: "Text 1", text: "Before", appearance: { textTransform: "uppercase" as const } };
    const flow: SectionChildFlow = { elements: [element], order: [{ kind: "element", id: "direct" }] };

    const updated = updateSectionTextElement(flow, "direct", "brand nEW text")!;
    expect(findSectionElement(updated, "direct")).toEqual({ ...element, text: "brand nEW text" });
  });

  it("identifies only standalone Text targets for viewport and inspector exit", () => {
    const textTarget: InlineEditingTarget = { sectionId: "section", elementId: "text", path: ["childFlow", "elements"], label: "Text" };
    const sectionTarget: InlineEditingTarget = { sectionId: "section", path: ["heading"], label: "Heading" };
    expect(isStandaloneTextEditingTarget(textTarget)).toBe(true);
    expect(isStandaloneTextEditingTarget(sectionTarget)).toBe(false);
    expect(isStandaloneTextEditingTarget(null)).toBe(false);
  });
});
