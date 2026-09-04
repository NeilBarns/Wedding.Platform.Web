import { describe, expect, it } from "vitest";
import { dateContentSchema, dressCodeContentSchema, heroContentSchema } from "./schemas";
import {
  SECTION_SPECIALIZED_REFERENCE,
  canonicalizeSectionChildFlowRichText,
  createTextElement,
  deleteSectionElement,
  duplicateSectionElement,
  insertSectionElement,
  moveSectionChild,
  sectionChildFlowSchema,
  updateSectionElement,
} from "./sectionChildFlow";

const text = (id: string, value = id) => ({ id, type: "text" as const, text: value, appearance: {} });
const flow = (elements = [text("a")], order: Array<{ kind: "specialized"; key: "content" } | { kind: "element"; id: string }> = [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }]) => ({ elements, order });

describe("Section child-flow schema", () => {
  it("is optional for Date and Dress Code and accepted when valid", () => {
    expect(dateContentSchema.safeParse({ heading: "Date", description: "Details" }).success).toBe(true);
    expect(dressCodeContentSchema.safeParse({ heading: "Dress", description: "Details", childFlow: flow() }).success).toBe(true);
  });

  it.each([
    ["missing specialized", flow(undefined, [{ kind: "element", id: "a" }])],
    ["duplicate specialized", flow(undefined, [SECTION_SPECIALIZED_REFERENCE, SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }])],
    ["missing element reference", flow(undefined, [SECTION_SPECIALIZED_REFERENCE])],
    ["duplicate element reference", flow(undefined, [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }, { kind: "element", id: "a" }])],
    ["unknown element reference", flow(undefined, [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "missing" }])],
    ["unreferenced element", flow([text("a"), text("b")])],
    ["duplicate element IDs", flow([text("a"), text("a")], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }, { kind: "element", id: "a" }])],
  ])("rejects %s", (_name, candidate) => expect(sectionChildFlowSchema.safeParse(candidate).success).toBe(false));

  it("rejects invalid Text, disallowed elements, unknown discriminators, and unknown keys", () => {
    expect(dateContentSchema.safeParse({ heading: "Date", description: "", childFlow: flow([{ ...text("a"), appearance: { fontWeight: 500 } }]) }).success).toBe(false);
    expect(dateContentSchema.safeParse({ heading: "Date", description: "", childFlow: flow([{ id: "a", type: "image", mediaId: "01M0Q08NQ9XJB9B5SGC45YD9AA" } as never]) }).success).toBe(false);
    expect(dateContentSchema.safeParse({ heading: "Date", description: "", childFlow: flow([{ id: "a", type: "mystery" } as never]) }).success).toBe(false);
    expect(dateContentSchema.safeParse({ heading: "Date", description: "", childFlow: { ...flow(), extra: true } }).success).toBe(false);
    expect(heroContentSchema.safeParse({ headline: "Hi", subheadline: "", childFlow: flow() }).success).toBe(false);
  });

  it("migrates legacy Divider appearance to the locked asset contract", () => {
    const candidate = flow([{ id: "divider", type: "divider", appearance: { styleId: "botanical-vine", width: "full", opacity: 75 } } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "divider" }]);
    const parsed = sectionChildFlowSchema.parse(candidate);
    expect(parsed.elements[0]).toMatchObject({ appearance: { assetId: "botanical-vine", width: 100, opacity: 75 } });
  });
});

describe("Section child-flow operations", () => {
  it("canonicalizes Rich Text runs nested inside Groups before saving", () => {
    const candidate = flow([{ id: "group", type: "compositionGroup", children: [{ id: "rich", type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Copy", marks: { bold: true, italic: false }, editorMetadata: true }] }] } }], layout: {} } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "group" }]);
    const canonical = canonicalizeSectionChildFlowRichText(candidate);
    expect(canonical.elements[0]).toMatchObject({ children: [{ document: { children: [{ children: [{ text: "Copy", marks: { bold: true } }] }] } }] });
    expect(dateContentSchema.safeParse({ heading: "Date", description: "", childFlow: canonical }).success).toBe(true);
  });

  it("adds after the selected unit and preserves stable IDs while editing", () => {
    const added = insertSectionElement(undefined, text("a"), SECTION_SPECIALIZED_REFERENCE);
    expect(added.order).toEqual([SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }]);
    const edited = updateSectionElement(added, text("a", "edited"));
    expect(edited.order).toEqual(added.order);
    expect(edited.elements[0]).toMatchObject({ id: "a", text: "edited" });
  });

  it("duplicates directly after the source with a fresh ID", () => {
    const result = duplicateSectionElement(flow(), "a");
    expect(result).not.toBeNull();
    expect(result!.elementId).not.toBe("a");
    expect(result!.flow.order[2]).toEqual({ kind: "element", id: result!.elementId });
  });

  it("deletes only the element and falls back to specialized selection", () => {
    expect(deleteSectionElement(flow(), "a")).toEqual({ flow: undefined, selection: SECTION_SPECIALIZED_REFERENCE });
  });

  it("moves specialized content around Text without changing elements", () => {
    const candidate = flow([text("a"), text("b")], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }, { kind: "element", id: "b" }]);
    const moved = moveSectionChild(candidate, SECTION_SPECIALIZED_REFERENCE, 1);
    expect(moved.order).toEqual([{ kind: "element", id: "a" }, SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "b" }]);
    expect(moved.elements).toEqual(candidate.elements);
  });

  it("creates semantic Text IDs without persisted defaults", () => expect(createTextElement()).toMatchObject({ type: "text", text: "" }));
});
