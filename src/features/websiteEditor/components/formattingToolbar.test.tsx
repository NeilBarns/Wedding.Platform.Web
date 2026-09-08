import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RichTextElement, TextElement } from "../../websiteElements/types";
import { RichTextCanvasEditor } from "./RichTextCanvasEditor";
import { preserveRichTextToolbarPointerDown } from "../richTextSelection";
import { RichTextElementEditor } from "./RichTextElementEditor";
import { TextCanvasEditor } from "./TextCanvasEditor";
import { TextElementEditor } from "./TextElementEditor";
import { resolveFloatingToolbarPosition, resolveFloatingToolbarResizeObserver, resolveRangeToolbarAnchor, translateToolbarAnchorToHost } from "../floatingToolbarPosition";

const text: TextElement = { id: "text", type: "text", editorName: "Text 1", text: "Existing text" };
const rich: RichTextElement = { id: "rich", type: "richText", editorName: "Rich Text 1", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Existing rich content" }] }] } };
const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as never;

describe("shared responsive formatting toolbar", () => {
  it.each(["desktop", "tablet", "mobile"] as const)("renders a horizontal themed Text toolbar on %s", (viewport) => {
    const html = renderToStaticMarkup(<TextCanvasEditor element={text} sectionId="section" viewport={viewport} onChange={() => undefined} inputStyle={{}} renderValue={(value) => value} effectiveFontFamilyId="inter" />);
    expectThemeToolbar(html, "Text formatting");
    expectHorizontalToolbar(html, viewport);
    expectCommandOrder(html, ["Bold", "Italic", "Underline", "Strikethrough"]);
    expect(html).toContain("Existing text");
  });

  it("disables unsupported Bold and Italic with native button semantics", () => {
    const normalOnly = renderToStaticMarkup(<TextCanvasEditor element={text} sectionId="section" viewport="desktop" onChange={() => undefined} inputStyle={{}} renderValue={(value) => value} effectiveFontFamilyId="great-vibes" />);
    expect(normalOnly).toMatch(/aria-label="Bold"[^>]*disabled=""/);
    expect(normalOnly).toMatch(/aria-label="Italic"[^>]*disabled=""/);
  });

  it.each(["desktop", "tablet", "mobile"] as const)("hides the Rich Text toolbar without a text range on %s", (viewport) => {
    const html = renderToStaticMarkup(<RichTextCanvasEditor element={rich} viewport={viewport} onDocumentChange={() => undefined} />);
    expect(html).not.toContain("Rich Text formatting");
  });

  it.each(["desktop", "tablet", "mobile"] as const)("uses the shared font capabilities for Rich Text commands on %s", (viewport) => {
    const normalOnly = renderToStaticMarkup(<RichTextCanvasEditor element={rich} viewport={viewport} effectiveFontFamilyId="great-vibes" onDocumentChange={() => undefined} />);
    expect(normalOnly).not.toContain("Rich Text formatting");
  });

  it("does not expose formatting toggles before a Rich Text range is selected", () => {
    const html = renderToStaticMarkup(<RichTextCanvasEditor element={rich} viewport="desktop" onDocumentChange={() => undefined} />);
    for (const action of ["Bold", "Italic", "Underline", "Strikethrough"]) expect(html).not.toContain(`aria-label="${action}"`);
  });

  it("preserves the editor range on pointer activation while leaving keyboard click activation available", () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    preserveRichTextToolbarPointerDown(event as never);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
  });

  it("uses the existing Mobile inspector path for every Text formatting action", () => {
    const canvas = renderToStaticMarkup(<TextCanvasEditor element={text} sectionId="section" viewport="mobile" onChange={() => undefined} inputStyle={{}} renderValue={(value) => value} />);
    const panel = renderToStaticMarkup(<TextElementEditor element={text} viewport="mobile" templateKey="modern-editorial-v1" library={library} allowedFontIds={[]} allowedColorIds={[]} projectColors={[]} onAddColor={async () => ({ id: "color", value: "#000000" })} onChange={() => undefined} />);
    expect(canvas).toContain("data-floating-formatting-toolbar");
    for (const action of ["Bold", "Italic", "Underline", "Strikethrough"]) expect(panel).toContain(`aria-label="${action}"`);
  });

  it("uses the existing Mobile inspector path for every Rich Text formatting action", () => {
    const canvas = renderToStaticMarkup(<RichTextCanvasEditor element={rich} viewport="mobile" onDocumentChange={() => undefined} />);
    const panel = renderToStaticMarkup(<RichTextElementEditor element={rich} viewport="mobile" library={library} allowedFontIds={[]} allowedColorIds={[]} projectColors={[]} onAddColor={async () => ({ id: "color", value: "#000000" })} onAppearanceChange={() => undefined} />);
    expect(canvas).not.toContain("data-floating-formatting-toolbar");
    for (const action of ["Bold", "Italic", "Underline", "Strikethrough"]) expect(panel).toContain(`aria-label="${action}"`);
    for (const removed of ["Link", "Bulleted list", "Numbered list"]) expect(panel).not.toContain(`aria-label="${removed}"`);
    expect(JSON.stringify(rich.document)).toContain("Existing rich content");
  });

  it("does not render a legacy Rich Text responsive reset control", () => {
    const panel = renderToStaticMarkup(<RichTextElementEditor element={rich} viewport="mobile" library={library} allowedFontIds={[]} allowedColorIds={[]} projectColors={[]} onAddColor={async () => ({ id: "color", value: "#000000" })} onAppearanceChange={() => undefined} />);
    expect(panel).not.toContain("Reset mobile overrides");
    expect(panel).not.toContain("Use desktop");
  });

  it("keeps the same element content across Desktop, Tablet, Mobile, and Desktop renders", () => {
    const textMarkup = (["desktop", "tablet", "mobile", "desktop"] as const).map((viewport) => renderToStaticMarkup(<TextCanvasEditor element={text} sectionId="section" viewport={viewport} onChange={() => undefined} inputStyle={{}} renderValue={(value) => value} />));
    expect(textMarkup.every((html) => html.includes("Existing text"))).toBe(true);
    expect(rich.document.children[0]).toEqual({ type: "paragraph", children: [{ text: "Existing rich content" }] });
  });

  it("clamps the toolbar inside the viewport near both horizontal edges", () => {
    const toolbar = { width: 284, height: 44 };
    expect(resolveFloatingToolbarPosition({ left: -20, top: 100, width: 20, height: 30 }, toolbar, { width: 320, height: 568 }).left).toBe(8);
    expect(resolveFloatingToolbarPosition({ left: 310, top: 100, width: 20, height: 30 }, toolbar, { width: 320, height: 568 }).left).toBe(28);
  });

  it("prefers above and flips below when there is insufficient room", () => {
    expect(resolveFloatingToolbarPosition({ left: 100, top: 200, width: 100, height: 30 }, { width: 180, height: 44 }, { width: 375, height: 667 })).toMatchObject({ placement: "above", top: 148 });
    expect(resolveFloatingToolbarPosition({ left: 100, top: 20, width: 100, height: 30 }, { width: 180, height: 44 }, { width: 375, height: 667 })).toMatchObject({ placement: "below", top: 58 });
  });

  it("uses the active editor realm ResizeObserver and falls back only when absent", () => {
    class OwnerObserver { observe() {} unobserve() {} disconnect() {} }
    class FallbackObserver { observe() {} unobserve() {} disconnect() {} }
    const owner = OwnerObserver as unknown as typeof ResizeObserver;
    const fallback = FallbackObserver as unknown as typeof ResizeObserver;
    expect(resolveFloatingToolbarResizeObserver({ ResizeObserver: owner } as unknown as Window, fallback)).toBe(owner);
    expect(resolveFloatingToolbarResizeObserver({ ResizeObserver: undefined } as unknown as Window, fallback)).toBe(fallback);
  });

  it("anchors single-line selections to their visual range", () => {
    const selected = { left: 120, right: 200, top: 100, bottom: 120, width: 80, height: 20 } as DOMRect;
    expect(resolveRangeToolbarAnchor({ getBoundingClientRect: () => selected, getClientRects: () => [selected] as unknown as DOMRectList })).toEqual({ left: 120, top: 100, width: 80, height: 20 });
  });

  it("anchors multiline and cross-paragraph selections to the upper visual line", () => {
    const rects = [
      { left: 140, right: 220, top: 100, bottom: 120, width: 80, height: 20 },
      { left: 80, right: 260, top: 122, bottom: 142, width: 180, height: 20 },
      { left: 80, right: 190, top: 166, bottom: 186, width: 110, height: 20 },
    ] as DOMRect[];
    expect(resolveRangeToolbarAnchor({ getBoundingClientRect: () => ({ left: 80, top: 100, width: 180, height: 86 } as DOMRect), getClientRects: () => rects as unknown as DOMRectList })).toEqual({ left: 140, top: 100, width: 80, height: 20 });
  });

  it.each([1, 0.75, 0.5])("converts iframe range coordinates to normal-size host chrome once at %s", (scale) => {
    const source = {} as Document;
    const frame = { contentDocument: source, clientWidth: 400, clientHeight: 600, getBoundingClientRect: () => ({ left: 40, top: 30, width: 400 * scale, height: 600 * scale }) } as HTMLIFrameElement;
    const host = { querySelectorAll: () => [frame] } as unknown as Document;
    expect(translateToolbarAnchorToHost({ left: 100, top: 80, width: 60, height: 20 }, source, host)).toEqual({ left: 40 + 100 * scale, top: 30 + 80 * scale, width: 60 * scale, height: 20 * scale });
  });
});

function expectThemeToolbar(html: string, label: string) {
  expect(html).toContain(`aria-label="${label}"`);
  expect(html).toContain("border-border");
  expect(html).toContain("bg-surface");
  expect(html).toContain("text-foreground");
  expect(html).toContain("shadow-[var(--shadow-dialog)]");
  expect(html).not.toMatch(/bg-white|text-black|border-white/);
}

function expectHorizontalToolbar(html: string, viewport: "desktop" | "tablet" | "mobile") {
  expect(html).toContain(`data-toolbar-viewport="${viewport}"`);
  expect(html).toContain("flex-row");
  expect(html).toContain("flex-nowrap");
  expect(html).toContain("whitespace-nowrap");
  expect(html).not.toMatch(/flex-wrap(?!:)|flex-col/);
}

function expectCommandOrder(html: string, commands: string[]) {
  const positions = commands.map((command) => html.indexOf(`aria-label="${command}"`));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((first, second) => first - second));
}
