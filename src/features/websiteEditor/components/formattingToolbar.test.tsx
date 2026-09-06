import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RichTextElement, TextElement } from "../../websiteElements/types";
import { RichTextCanvasEditor } from "./RichTextCanvasEditor";
import { RichTextElementEditor } from "./RichTextElementEditor";
import { TextCanvasEditor } from "./TextCanvasEditor";
import { TextElementEditor } from "./TextElementEditor";
import { resolveFloatingToolbarPosition } from "../floatingToolbarPosition";

const text: TextElement = { id: "text", type: "text", text: "Existing text" };
const rich: RichTextElement = { id: "rich", type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Existing rich content" }] }] } };
const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as never;

describe("shared responsive formatting toolbar", () => {
  it.each(["desktop", "tablet", "mobile"] as const)("renders a horizontal themed Text toolbar on %s", (viewport) => {
    const html = renderToStaticMarkup(<TextCanvasEditor element={text} sectionId="section" viewport={viewport} onChange={() => undefined} inputStyle={{}} renderValue={(value) => value} />);
    expectThemeToolbar(html, "Text formatting");
    expectHorizontalToolbar(html, viewport);
    expectCommandOrder(html, ["Bold", "Italic", "Underline", "Strikethrough"]);
    expect(html).toContain("Existing text");
  });

  it.each(["desktop", "tablet", "mobile"] as const)("renders a horizontal themed Rich Text toolbar on %s", (viewport) => {
    const html = renderToStaticMarkup(<RichTextCanvasEditor element={rich} viewport={viewport} onChange={() => undefined} />);
    expectThemeToolbar(html, "Rich Text formatting");
    expectHorizontalToolbar(html, viewport);
    expectCommandOrder(html, ["Bold", "Italic", "Underline", "Strikethrough", "Link", "Bulleted list", "Numbered list"]);
  });

  it("uses the existing Mobile inspector path for every Text formatting action", () => {
    const canvas = renderToStaticMarkup(<TextCanvasEditor element={text} sectionId="section" viewport="mobile" onChange={() => undefined} inputStyle={{}} renderValue={(value) => value} />);
    const panel = renderToStaticMarkup(<TextElementEditor element={text} viewport="mobile" templateKey="modern-editorial-v1" library={library} allowedFontIds={[]} allowedColorIds={[]} projectColors={[]} onAddColor={async () => ({ id: "color", value: "#000000" })} onChange={() => undefined} />);
    expect(canvas).toContain("data-floating-formatting-toolbar");
    for (const action of ["Bold", "Italic", "Underline", "Strikethrough"]) expect(panel).toContain(`aria-label="${action}"`);
  });

  it("uses the existing Mobile inspector path for every Rich Text formatting action", () => {
    const canvas = renderToStaticMarkup(<RichTextCanvasEditor element={rich} viewport="mobile" onChange={() => undefined} />);
    const panel = renderToStaticMarkup(<RichTextElementEditor element={rich} viewport="mobile" library={library} allowedFontIds={[]} allowedColorIds={[]} projectColors={[]} onAddColor={async () => ({ id: "color", value: "#000000" })} onAppearanceChange={() => undefined} />);
    expect(canvas).toContain("data-floating-formatting-toolbar");
    for (const action of ["Bold", "Italic", "Underline", "Strikethrough", "Link", "Bulleted list", "Numbered list"]) expect(panel).toContain(`aria-label="${action}"`);
    expect(JSON.stringify(rich.document)).toContain("Existing rich content");
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
