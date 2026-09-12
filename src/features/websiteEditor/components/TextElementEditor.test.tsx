import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../../websiteCapabilities/types";
import type { TextElement } from "../../websiteElements/types";
import { applyTextStylePreset, curatedTextColors, friendlyFontWeightOptions, resolveTextStyle, textStylePreset, withTextAppearance } from "../../websiteElements/textStylePresets";
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
const base: TextElement = { id: "text-1", type: "text", editorName: "Text 1", document: { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Welcome"  }] }] }};

const renderEditor = (element: TextElement = base, viewport: "desktop" | "tablet" | "mobile" = "desktop") => renderToStaticMarkup(<TextElementEditor element={element} viewport={viewport} templateKey="classic-filipiniana-v1" context={context} library={library} allowedFontIds={["inter"]} allowedColorIds={["primary", "text", "muted", "accent", "shade"]} projectColors={[{ id: "project-red", value: "#ff0000" }]} onAddColor={vi.fn()} onAppearanceChange={vi.fn()} />);

describe("TextElementEditor ownership", () => {
  it("shows bounded block effects sparsely and hides inactive color controls", () => {
    const inactive = renderEditor(base);
    expect(inactive).toContain("Effects");
    expect(inactive).toContain('aria-label="Text Shadow"');
    expect(inactive).toContain('aria-label="Glow"');
    expect(inactive).not.toContain('aria-label="Shadow Color"');
    expect(inactive).not.toContain('aria-label="Glow Color"');
    const active = renderEditor({ ...base, appearance: { textShadow: "soft", glow: "medium" } });
    expect(active).toContain('aria-label="Shadow Color"');
    expect(active).toContain('aria-label="Glow Color"');
  });
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
    expect(html).toContain('aria-label="Font weight"');
    expect(html).toContain("Bold");
    expect(html).not.toContain('aria-label="Italic"');
    expect(html).toContain('aria-label="Text case"');
    expect(html).not.toContain("Semantic");
  });

  it("uses direct formatting toggles and the shared font-weight control on mobile", () => {
    const html = renderEditor({ ...base, appearance: { fontWeight: 700 } }, "mobile");
    expect(html).toContain('aria-label="Bold"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Font weight"');
  });

  it("shows only weights supported by the selected family", () => {
    expect(friendlyFontWeightOptions("dm-serif-display")).toEqual([{ value: "400", label: "Normal" }]);
    expect(friendlyFontWeightOptions("old-standard-tt")).toEqual([{ value: "400", label: "Normal" }, { value: "700", label: "Bold" }]);
    expect(friendlyFontWeightOptions("old-standard-tt").some(({ label }) => label === "Semi-bold")).toBe(false);
    expect(friendlyFontWeightOptions("inter")).toEqual([{ value: "400", label: "Normal" }, { value: "600", label: "Semi-bold" }, { value: "700", label: "Bold" }]);
  });

  it("curates semantic colors, hides unrelated shades, and retains project colors", () => {
    expect(curatedTextColors(library, ["primary", "text", "muted", "accent", "shade"], context).map(({ displayName }) => displayName)).toEqual(["Primary", "Accent", "Text", "Muted"]);
    const html = renderEditor();
    expect(html).not.toContain("Internal shade");
    expect(html).toContain("Custom color #ff0000");
    expect(html).toContain("Add color");
  });

  it.each(["desktop", "tablet", "mobile"] as const)("uses effective values without reset affordances on %s", (viewport) => {
    const html = renderEditor(base, viewport);
    expect(html).not.toContain("Reset");
    expect(html).not.toContain('aria-label="Inherited"');
    expect(html.match(/aria-label="Normal"[^>]*aria-pressed="true"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toMatch(/aria-checked="true"[^>]*aria-label="Text"/);
  });

  it("displays authored global values instead of their effective defaults", () => {
    const html = renderEditor({ ...base, appearance: { lineHeight: "relaxed", letterSpacing: "wide", colorId: "accent" } });
    expect(html).toMatch(/aria-label="Relaxed"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/aria-label="Wide"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/aria-checked="true"[^>]*aria-label="Accent"/);
  });

  it("prunes the appearance object after its final default-equivalent value is selected", () => {
    expect(withTextAppearance({ ...base, appearance: { lineHeight: "tight" } }, {})).toEqual(base);
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
    expect(resolveTextStyle({ ...textStylePreset("heading", "classic-filipiniana-v1", library, context), fontSize: "s" }, "classic-filipiniana-v1", library, context)).toBe("custom");
    expect(resolveTextStyle({ ...textStylePreset("heading", "classic-filipiniana-v1", library, context), underline: true, responsive: { mobile: { fontSize: "s" } } }, "classic-filipiniana-v1", library, context)).toBe("heading");
    expect(textStylePreset("heading", "classic-filipiniana-v1", library, context).alignment).toBe("center");
    expect(textStylePreset("heading", "modern-editorial-v1", library, context).alignment).toBe("start");
  });

  it("merges Heading into base appearance without changing responsive or unrelated fields", () => {
    const appearance = { fontFamilyId: "inter", underline: true, responsive: { tablet: { fontSize: "m" as const }, mobile: { alignment: "end" as const } } };
    const merged = applyTextStylePreset(appearance, textStylePreset("heading", "classic-filipiniana-v1", library, context));
    expect(merged.responsive).toEqual(appearance.responsive);
    expect(merged.fontFamilyId).toBe("inter");
    expect(merged.underline).toBe(true);
    expect(resolveTextStyle(merged, "classic-filipiniana-v1", library, context)).toBe("heading");
  });

  it("keeps Body sparse while preserving responsive and unrelated fields", () => {
    const heading = textStylePreset("heading", "classic-filipiniana-v1", library, context);
    const appearance = { ...heading, italic: true, responsive: { tablet: { fontSize: "m" as const }, mobile: { alignment: "end" as const } } };
    const body = applyTextStylePreset(appearance, textStylePreset("body", "classic-filipiniana-v1", library, context));
    expect(body).toEqual({ italic: true, responsive: appearance.responsive });
    expect(resolveTextStyle(body, "classic-filipiniana-v1", library, context)).toBe("body");
  });

  it.each(["tablet", "mobile"] as const)("shows effective Desktop font size and alignment on untouched %s controls", (viewport) => {
    const html = renderEditor({ ...base, appearance: { fontSize: "xl", alignment: "center" } }, viewport);
    expect(html).toMatch(/aria-label="Xl"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/aria-label="Center"[^>]*aria-pressed="true"/);
    expect(html).not.toContain("Use desktop size");
    expect(html).not.toContain("Use desktop alignment");
  });
});
