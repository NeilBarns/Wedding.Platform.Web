import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DividerElementRenderer } from "./DividerElementRenderer";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";

const library = { colors: [{ id: "accent", displayName: "Accent", value: "#a6553f" }], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;
describe("DividerElementRenderer", () => {
  it("renders the Classic template default as a tintable mask", () => {
    const html = renderToStaticMarkup(<DividerElementRenderer element={{ id: "d", type: "divider" }} templateKey="classic-filipiniana-v1" library={library} context={{ headingFontId: "", bodyFontId: "", headingColorId: "accent", bodyColorId: "accent", accentColorId: "accent" }} />);
    expect(html).toContain("/template-assets/classic-filipiniana/dividers/botanical-vine.png");
    expect(html).toContain('data-divider-asset="botanical-vine"');
    expect(html).toContain("background-color:#a6553f");
    expect(html).not.toContain("<img");
    expect(html).toContain('role="separator"');
  });
  it("does not invent a procedural fallback when a template has no assets", () => {
    const published = renderToStaticMarkup(<DividerElementRenderer element={{ id: "d", type: "divider" }} templateKey="modern-editorial-v1" library={library} />);
    const editor = renderToStaticMarkup(<DividerElementRenderer element={{ id: "d", type: "divider" }} templateKey="modern-editorial-v1" library={library} mode="editor" />);
    expect(published).toBe("");
    expect(editor).toContain("No Divider assets for this template");
  });
  it.each([
    [0, "10%"],
    [25, "13.75%"],
    [50, "17.5%"],
    [100, "25%"],
  ] as const)("renders normalized width %s through the template range", (width, expected) => {
    const html = renderToStaticMarkup(<DividerElementRenderer element={{ id: "d", type: "divider", appearance: { width } }} templateKey="classic-filipiniana-v1" library={library} />);
    expect(html).toContain(`width:${expected}`);
  });
  it("falls back to the template default when a saved asset is unavailable", () => {
    const html = renderToStaticMarkup(<DividerElementRenderer element={{ id: "d", type: "divider", appearance: { assetId: "from-another-template", opacity: 50 } }} templateKey="classic-filipiniana-v1" library={library} />);
    expect(html).toContain('data-divider-asset="botanical-vine"');
    expect(html).toContain("opacity:0.5");
  });
});
