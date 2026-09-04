import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { TextElement } from "../websiteElements/types";
import { TextElementRenderer } from "./TextElementRenderer";
import { InlineEditProvider } from "../websiteEditor/inline/InlineEditContext";

const library = { colors: [{ id: "body", displayName: "Body", value: "#112233" }], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;
const base: TextElement = { id: "t", type: "text", text: "<strong>Hello</strong>" };
const render = (element: TextElement, viewport: "desktop" | "tablet" | "mobile" = "desktop") => renderToStaticMarkup(<TextElementRenderer element={element} viewport={viewport} templateKey="modern-editorial-v1" library={library} context={{ headingFontId: "inter", bodyFontId: "inter", headingColorId: "body", bodyColorId: "body", accentColorId: "body" }} />);

describe("TextElementRenderer", () => {
  it("uses an internal margin-free paragraph and escapes plain text", () => {
    const html = render(base);
    expect(html).toMatch(/^<p /);
    expect(html).toContain("margin:0");
    expect(html).toContain("padding:0");
    expect(html).toContain("width:100%");
    expect(html).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
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
  });

  it("uses the established inline Text editor in editor mode", () => {
    const html = renderToStaticMarkup(<InlineEditProvider value={{ activeTarget: null, requestEdit: () => undefined, updateValue: () => undefined, finishEdit: () => undefined }}><TextElementRenderer element={base} editor={{ sectionId: "date-section", onChange: () => undefined }} viewport="desktop" templateKey="modern-editorial-v1" library={library} /></InlineEditProvider>);
    expect(html).toContain('aria-label="Edit Text"');
    expect(html).toContain("inline-edit-target");
    expect(html).toContain("block w-full");
    expect(html).toContain('aria-label="Text formatting"');
    expect(html).toContain('aria-label="Bold"');
    expect(html).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
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
});
