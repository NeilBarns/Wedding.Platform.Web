import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { TextElement } from "../websiteElements/types";
import { TextElementRenderer } from "./TextElementRenderer";
import { InlineEditProvider } from "../websiteEditor/inline/InlineEditContext";
import { WebsiteElementFrame } from "./WebsiteElementFrame";

const library = { colors: [{ id: "body", displayName: "Body", value: "#112233" }], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;
const base: TextElement = { id: "t", type: "text", editorName: "Text 1", text: "<strong>Hello</strong>" };
const render = (element: TextElement, viewport: "desktop" | "tablet" | "mobile" = "desktop") => renderToStaticMarkup(<TextElementRenderer element={element} viewport={viewport} templateKey="modern-editorial-v1" library={library} context={{ headingFontId: "inter", bodyFontId: "inter", headingColorId: "body", bodyColorId: "body", accentColorId: "body" }} />);
const editorContext = { sectionId: "date-section", onChange: () => undefined };
const inlineContext = (active: boolean) => ({ activeTarget: active ? { sectionId: "date-section", elementId: "t", path: ["childFlow", "elements"] as const, label: "Text" } : null, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined });
const renderEditor = (element: TextElement, active = false) => renderToStaticMarkup(<InlineEditProvider value={inlineContext(active)}><TextElementRenderer element={element} editor={editorContext} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);

describe("TextElementRenderer", () => {
  it("uses an internal margin-free paragraph and escapes plain text", () => {
    const html = render(base);
    expect(html).toMatch(/^<p /);
    expect(html).toContain("margin:0");
    expect(html).toContain("padding:0");
    expect(html).toContain("width:100%");
    expect(html).toContain("min-width:0");
    expect(html).toContain("max-width:100%");
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).not.toContain("overflow:hidden");
    expect(html).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
    expect(html).not.toContain("Text 1");
    expect(html).not.toContain("editorName");
  });

  it.each([
    "https://example.com/" + "long-path-segment".repeat(80),
    "LONGUPPERCASETOKEN".repeat(100),
  ])("contains direct large Text with an unbroken token", (text) => {
    const html = render({ id: "long", type: "text", editorName: "Text 1", text, appearance: { fontSize: "xl" } });
    expect(html).toMatch(/^<p /);
    expect(html).toContain("font-size:2.25rem");
    expect(html).toContain("min-width:0");
    expect(html).toContain("max-width:100%");
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).not.toMatch(/overflow:hidden|overflow-x|word-break|&shy;/);
  });

  it("applies bounded appearance and independent mobile overrides", () => {
    const element: TextElement = { ...base, appearance: { fontWeight: 700, italic: true, underline: true, strikethrough: true, textTransform: "uppercase", colorId: "body", fontSize: "l", alignment: "center", responsive: { tablet: { fontSize: "xl" }, mobile: { alignment: "end" } } } };
    const mobile = render(element, "mobile");
    expect(mobile).toContain("font-size:1.5rem");
    expect(mobile).toContain("text-align:end");
    expect(mobile).toContain("font-style:italic");
    expect(mobile).toContain("text-decoration-line:underline line-through");
    expect(mobile).toContain("text-transform:uppercase");
    expect(mobile).toContain("color:#112233");
    expect(mobile).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
    expect(mobile).not.toContain("&lt;STRONG&gt;HELLO&lt;/STRONG&gt;");
  });

  it("uses the established inline Text editor in editor mode", () => {
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget: null, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><TextElementRenderer element={base} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);
    expect(html).toContain('aria-label="Edit Text"');
    expect(html).toContain("inline-edit-target");
    expect(html).toContain("block w-full");
    expect(html).toContain('aria-label="Text formatting"');
    expect(html).toContain('aria-label="Bold"');
    expect(html).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
    expect(html).toMatch(/^<div [^>]*data-text-canvas-editor/);
  });

  it("keeps editor chrome outside the semantic paragraph and preserves the canonical selection target", () => {
    const editor = <TextElementRenderer element={base} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="tablet" templateKey="modern-editorial-v1" library={library} />;
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget: null, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><WebsiteElementFrame mode="editor" sectionId="date-section" elementId="t" elementType="text" selected onSelect={() => undefined} onEdit={() => undefined}>{editor}</WebsiteElementFrame></InlineEditProvider>);
    const paragraphStart = html.indexOf('<p data-website-element="text"');
    const paragraphEnd = html.indexOf("</p>", paragraphStart);
    const toolbar = html.indexOf("data-floating-formatting-toolbar");
    expect(html).toContain('data-editor-website-element="t"');
    expect(html).toContain('data-editor-selected="true"');
    expect(toolbar).toBeGreaterThanOrEqual(0);
    expect(paragraphStart).toBeGreaterThan(toolbar);
    expect(paragraphEnd).toBeGreaterThan(paragraphStart);
    expect(html.slice(toolbar, paragraphStart)).toMatch(/<\/div>\s*$/);
    expect(html.slice(paragraphStart, paragraphEnd)).not.toContain("data-floating-formatting-toolbar");
  });

  it("preserves alignment when Text is selected but not yet editing", () => {
    const element: TextElement = { ...base, appearance: { alignment: "end" } };
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget: null, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><TextElementRenderer element={element} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);
    expect(html).toMatch(/<button[^>]+text-align:inherit[^>]+aria-label="Edit Text"/);
  });

  it("keeps active generic Text editing on one compact row", () => {
    const activeTarget = { sectionId: "date-section", elementId: "t", path: ["childFlow", "elements"] as const, label: "Text" };
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><TextElementRenderer element={base} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);
    expect(html).not.toContain('aria-label="Done editing Text"');
    expect(html).not.toContain('aria-label="Cancel editing Text"');
    expect(html).toContain("relative z-30 flex w-full");
    expect(html).not.toContain("relative z-30 inline-flex");
    expect(html).not.toContain("flex-col gap-1");
  });

  it("preserves the authored alignment while Text is actively edited", () => {
    const activeTarget = { sectionId: "date-section", elementId: "t", path: ["childFlow", "elements"] as const, label: "Text" };
    const element: TextElement = { ...base, appearance: { alignment: "end" } };
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><TextElementRenderer element={element} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);
    expect(html).toMatch(/contentEditable="true"[^>]+text-align:end/);
    expect(html).not.toContain('<span aria-hidden="true"');
  });

  it("applies formatting and case directly to the active editing control", () => {
    const activeTarget = { sectionId: "date-section", elementId: "t", path: ["childFlow", "elements"] as const, label: "Text" };
    const element: TextElement = { ...base, appearance: { italic: true, underline: true, strikethrough: true, textTransform: "uppercase" } };
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><TextElementRenderer element={element} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);
    expect(html).toMatch(/contentEditable="true"[^>]+font-style:italic/);
    expect(html).toMatch(/contentEditable="true"[^>]+text-decoration-line:underline line-through/);
    expect(html).toMatch(/contentEditable="true"[^>]+text-transform:uppercase/);
    expect(html).not.toContain("color:transparent");
  });

  it.each(["uppercase", "lowercase", "capitalize"] as const)("keeps %s presentation consistent when deselected, selected, and editing", (textTransform) => {
    const element: TextElement = { id: "t", type: "text", editorName: "Text 1", text: "Brand New Text", appearance: { textTransform } };
    const publicHtml = render(element);
    const selectedHtml = renderEditor(element);
    const editingHtml = renderEditor(element, true);

    expect(publicHtml).toContain(`text-transform:${textTransform}`);
    expect(selectedHtml).toMatch(new RegExp(`<button[^>]+text-transform:${textTransform}[^>]+aria-label="Edit Text"`));
    expect(editingHtml).toMatch(new RegExp(`contentEditable="true"[^>]+text-transform:${textTransform}`));
    expect(publicHtml).toContain("Brand New Text");
    expect(selectedHtml).toContain("Brand New Text");
  });

  it("reveals the original authored casing when transform returns to Normal", () => {
    const authoredText = "Brand nEW Text";
    const transformed: TextElement = { id: "t", type: "text", editorName: "Text 1", text: authoredText, appearance: { textTransform: "uppercase" } };
    const normal: TextElement = { ...transformed, appearance: { textTransform: "none" } };

    expect(render(transformed)).toContain("Brand nEW Text");
    const publicHtml = render(normal);
    const selectedHtml = renderEditor(normal);
    const editingHtml = renderEditor(normal, true);
    expect(publicHtml).toContain("text-transform:none");
    expect(publicHtml).toContain(authoredText);
    expect(selectedHtml).toContain(authoredText);
    expect(selectedHtml).toMatch(/<button[^>]+text-transform:none[^>]+aria-label="Edit Text"/);
    expect(editingHtml).toMatch(/contentEditable="true"[^>]+text-transform:none/);
  });
});
