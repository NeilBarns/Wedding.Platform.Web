import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../../websiteCapabilities/types";
import type { TextElement } from "../../websiteElements/types";
import { curatedTextColors, friendlyFontWeightOptions, resolveTextStyle, textStylePreset, withTextAppearance } from "../../websiteElements/textStylePresets";
import { TextElementEditor } from "./TextElementEditor";

const context: ResolvedDesignContext = { headingFontId: "cormorant-garamond", bodyFontId: "inter", headingColorId: "primary", bodyColorId: "text", accentColorId: "accent" };
const library = {
  colors: [
    { id: "primary", displayName: "Internal heading token", value: "#111111" },
    { id: "text", displayName: "Internal text token", value: "#222222" },
    { id: "muted", displayName: "Internal muted token", value: "#777777" },
    { id: "accent", displayName: "Internal accent token", value: "#995533" },
    { id: "shade", displayName: "Internal shade", value: "#eeeeee" },
  ],
  fontFamilies: [
    { id: "inter", displayName: "Inter", family: "Inter", category: "sans", source: { type: "googleFonts", apiFamily: "Inter", upstreamUrl: "https://example.com", version: "x" }, fallback: "sans-serif", weights: [400, 600, 700], styles: ["normal", "italic"], allowedRoles: ["body"], recommendedRoles: ["body"], license: { id: "OFL-1.1" } },
  ],
  fontRecommendations: { heading: [], body: ["inter"], accent: [] },
  palettePresets: [{ id: "default", displayName: "Default", roles: { canvas: "shade", surface: "shade", text: "text", textMuted: "muted", accent: "accent", accentContrast: "shade", border: "muted" } }],
  typographyPresets: [],
} as unknown as TemplateDesignLibrary;
const base: TextElement = { id: "text-1", type: "text", text: "Welcome" };

const renderEditor = (element: TextElement = base, viewport: "desktop" | "tablet" | "mobile" = "desktop") => renderToStaticMarkup(<TextElementEditor element={element} viewport={viewport} templateKey="classic-filipiniana-v1" library={library} allowedFontIds={["inter"]} allowedColorIds={["primary", "text", "muted", "accent", "shade"]} projectColors={[{ id: "project-red", value: "#ff0000" }]} context={context} onAddColor={vi.fn()} onChange={vi.fn()} />);

describe("TextElementEditor ownership", () => {
  it("keeps content authoring out of the appearance-only inspector", () => {
    const html = renderEditor();
    expect(html).toContain("Text Style");
    expect(html).not.toContain('textarea');
    expect(html).not.toContain('value="Welcome"');
    expect(html).toContain("Font family");
    expect(html).not.toContain("Semantic");
    expect(html).not.toMatch(/>H[1-6]</);
  });

  it("keeps typography and compact formatting in Appearance", () => {
    const html = renderEditor({ ...base, appearance: { fontFamilyId: "inter", fontWeight: 700, italic: true } });
    expect(html).toContain("Text Style");
    expect(html).toContain("Font family");
    expect(html).not.toContain('aria-label="Font weight"');
    expect(html).not.toContain('aria-label="Italic"');
    expect(html).toContain('aria-label="Text case"');
    expect(html).not.toContain("Semantic");
  });

  it("uses direct formatting toggles on mobile instead of font-weight choices", () => {
    const html = renderEditor({ ...base, appearance: { fontWeight: 700 } }, "mobile");
    expect(html).toContain('aria-label="Bold"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('aria-label="Font weight"');
  });

  it("shows only weights supported by the selected family", () => {
    expect(friendlyFontWeightOptions("old-standard-tt")).toEqual([{ value: "400", label: "Normal" }, { value: "700", label: "Bold" }]);
    expect(friendlyFontWeightOptions("old-standard-tt").some(({ label }) => label === "Semi-bold")).toBe(false);
  });

  it("curates semantic colors, hides unrelated shades, and retains project colors", () => {
    expect(curatedTextColors(library, ["primary", "text", "muted", "accent", "shade"], context).map(({ displayName }) => displayName)).toEqual(["Primary", "Accent", "Text", "Muted"]);
    const html = renderEditor();
    expect(html).not.toContain("Internal shade");
    expect(html).toContain("Custom color #ff0000");
    expect(html).toContain("Add color");
  });
});

describe("Text Style presets", () => {
  it.each(["heading", "eyebrow", "body"] as const)("seeds ordinary appearance for %s without persisting preset identity", (style) => {
    const appearance = textStylePreset(style, "classic-filipiniana-v1", library, context);
    expect(appearance).not.toHaveProperty("role");
    expect(appearance).not.toHaveProperty("preset");
    expect(resolveTextStyle(appearance, "classic-filipiniana-v1", library, context)).toBe(style);
  });

  it("does not persist empty appearance defaults for Body", () => {
    expect(withTextAppearance(base, textStylePreset("body", "classic-filipiniana-v1", library, context))).toEqual(base);
  });

  it("detects manual divergence as Custom and resolves template-specific alignment", () => {
    expect(resolveTextStyle({ ...textStylePreset("heading", "classic-filipiniana-v1", library, context), underline: true }, "classic-filipiniana-v1", library, context)).toBe("custom");
    expect(textStylePreset("heading", "classic-filipiniana-v1", library, context).alignment).toBe("center");
    expect(textStylePreset("heading", "modern-editorial-v1", library, context).alignment).toBe("start");
  });
});
