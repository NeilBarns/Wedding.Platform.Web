import { describe, expect, it, vi } from "vitest";
import { dateContentSchema, dressCodeContentSchema, heroContentSchema } from "./schemas";
import { commitPendingRichTextEdit, createRichTextEditSession } from "./richTextSelection";
import {
  SECTION_SPECIALIZED_REFERENCE,
  canonicalizeSectionChildFlowRichText,
  createTextElement,
  deleteSectionElement,
  duplicateSectionElement,
  findSectionElement,
  insertSectionElement,
  moveSectionChild,
  sectionChildFlowSchema,
  updateSectionElement,
  updateSectionRichTextAppearance,
  setSectionElementHidden,
  type SectionChildFlow,
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

  it.each(["tablet", "mobile"] as const)("preserves nested Rich Text document through every %s appearance update", (viewport) => {
    const document = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Existing nested content", marks: { bold: true } }] }, { type: "bulletList" as const, items: [[{ text: "First" }], [{ text: "Second", marks: { italic: true } }]] }] };
    const nested = flow([{ id: "group", type: "compositionGroup", children: [{ id: "rich", type: "richText", document }], layout: {} } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "group" }]);
    const originalBytes = JSON.stringify(document);
    const appearances = [
      { fontFamilyId: "body-font" },
      { fontSize: "l" as const },
      { lineHeight: "relaxed" as const },
      { letterSpacing: "wide" as const },
      { alignment: "center" as const },
      { colorId: "ink" },
      { textTransform: "uppercase" as const },
      { responsive: { [viewport]: { fontSize: "s" as const, alignment: "end" as const } } },
    ];

    for (const appearance of appearances) {
      const updated = updateSectionRichTextAppearance(nested, "rich", appearance);
      expect(updated).not.toBeNull();
      const rich = findSectionElement(updated ?? undefined, "rich");
      expect(rich?.type).toBe("richText");
      if (rich?.type !== "richText") continue;
      expect(JSON.stringify(rich.document)).toBe(originalBytes);
      expect(rich.appearance).toEqual(appearance);
      expect(JSON.stringify((findSectionElement(nested, "rich") as { document: unknown }).document)).toBe(originalBytes);
    }
  });

  it("preserves top-level Rich Text while applying appearance-only updates", () => {
    const document = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Top-level content" }] }] };
    const topLevel = flow([{ id: "rich", type: "richText", document } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "rich" }]);
    const updated = updateSectionRichTextAppearance(topLevel, "rich", { responsive: { mobile: { alignment: "center" } } });
    expect(findSectionElement(updated ?? undefined, "rich")).toEqual({ id: "rich", type: "richText", document, appearance: { responsive: { mobile: { alignment: "center" } } } });
  });

  it("merges panel appearance into the latest canonical nested Rich Text node", () => {
    const document = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Latest canvas content" }] }] };
    const nested = flow([{ id: "group", type: "compositionGroup", children: [{ id: "rich", type: "richText", document }], layout: {} } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "group" }]);
    const updated = updateSectionRichTextAppearance(nested, "rich", { responsive: { mobile: { fontSize: "s" } } });
    const rich = findSectionElement(updated ?? undefined, "rich");
    expect(rich?.type === "richText" ? rich.document : null).toEqual(document);
  });

  it("save and reload preserve nested Rich Text after Mobile appearance edits", () => {
    const document = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Persist me", marks: { underline: true } }] }] };
    const nested = flow([{ id: "group", type: "compositionGroup", children: [{ id: "rich", type: "richText", document }], layout: {} } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "group" }]);
    const updated = updateSectionRichTextAppearance(nested, "rich", { responsive: { mobile: { fontSize: "s", alignment: "center" } } });
    const saved = dateContentSchema.parse({ heading: "Date", description: "", childFlow: canonicalizeSectionChildFlowRichText(updated!) });
    const reloaded = dateContentSchema.parse(JSON.parse(JSON.stringify(saved)));
    const rich = findSectionElement(reloaded.childFlow, "rich");
    expect(rich?.type === "richText" ? rich.document : null).toEqual(document);
    expect(rich?.type === "richText" ? rich.appearance : null).toEqual({ responsive: { mobile: { fontSize: "s", alignment: "center" } } });
  });

  it.each(["top-level", "nested"] as const)("Tablet %s Rich Text commits only dirty document changes", (_placement) => {
    const original = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Original Tablet content" }] }] };
    const rich = { id: "rich", type: "richText" as const, document: original };
    let current: SectionChildFlow = _placement === "nested"
      ? flow([{ id: "group", type: "compositionGroup", children: [rich], layout: {} } as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "group" }])
      : flow([rich as never], [SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "rich" }]);
    const session = createRichTextEditSession();
    const update = vi.fn((document: typeof original) => {
      const latest = findSectionElement(current, "rich");
      if (latest?.type === "richText") current = updateSectionElement(current, { ...latest, document });
    });
    const blur = (document: typeof original) => commitPendingRichTextEdit(session, () => document, update);

    expect(blur({ type: "doc", children: [{ type: "paragraph", children: [{ text: "stale empty snapshot" }] }] })).toBe(false);
    expect((findSectionElement(current, "rich") as typeof rich).document).toEqual(original);

    const changes = [
      { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Original Tablet content", marks: { bold: true } }] }] },
      { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Edited Tablet content" }] }] },
      { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "" }] }] },
    ];
    for (const document of changes) {
      session.markDirty();
      expect(blur(document as typeof original)).toBe(true);
      expect(blur(document as typeof original)).toBe(false);
      expect((findSectionElement(current, "rich") as typeof rich).document).toEqual(document);
    }
    expect(update).toHaveBeenCalledTimes(changes.length);
  });

  it("adds after the selected unit and preserves stable IDs while editing", () => {
    const added = insertSectionElement(undefined, text("a"), SECTION_SPECIALIZED_REFERENCE);
    expect(added.order).toEqual([SECTION_SPECIALIZED_REFERENCE, { kind: "element", id: "a" }]);
    const edited = updateSectionElement(added, text("a", "edited"));
    expect(edited.order).toEqual(added.order);
    expect(edited.elements[0]).toMatchObject({ id: "a", text: "edited" });
  });

  it("stores hidden state sparsely and preserves it through save/reload", () => {
    const initial = flow([text("a")]);
    const hidden = setSectionElementHidden(initial, "a", true);
    expect(findSectionElement(hidden, "a")?.isHidden).toBe(true);
    const reloaded = sectionChildFlowSchema.parse(JSON.parse(JSON.stringify(hidden)));
    expect(findSectionElement(reloaded, "a")?.isHidden).toBe(true);
    const shown = setSectionElementHidden(reloaded, "a", false);
    expect(findSectionElement(shown, "a")?.isHidden).toBeUndefined();
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
