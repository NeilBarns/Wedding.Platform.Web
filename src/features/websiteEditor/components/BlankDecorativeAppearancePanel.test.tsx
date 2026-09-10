import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SectionCapability, TemplateDesignLibrary } from "../../websiteCapabilities/types";
import type { WebsiteSectionAppearance } from "../types";
import { AppearancePanel } from "./AppearancePanel";

const appearance: WebsiteSectionAppearance = { headingAlignment: "inherit", bodyAlignment: "inherit", backgroundTreatment: "inherit", emphasis: "inherit" };
const capability = {
  id: "blank", appearanceControls: [], defaultPresentation: null, presentations: [],
  contextDefaults: { typography: [], colors: [] },
  allowedElementTypes: [], maximumElementCount: 20, compositionGroups: null,
  decorativeAppearance: {
    textures: ["none", "paper"], patterns: ["none", "botanical"], overlays: ["none", "soft"], frames: ["none", "fine"], backgroundColorIds: [],
  },
} as unknown as SectionCapability;
const library = { colors: [], fontFamilies: [], palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;

describe("Blank decorative appearance controls", () => {
  it("exposes the shared controls without persisting defaults when opened", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(<AppearancePanel appearance={appearance} templateKey="classic-filipiniana-v1" sectionCapability={capability} targetViewport="desktop" error={null} library={library} projectColors={[]} onAddColor={async () => { throw new Error("not called"); }} onChange={onChange} />);
    expect(html).toContain("Section background color");
    for (const label of ["Texture", "Pattern", "Overlay", "Frame"]) expect(html).toContain(label);
    for (const removed of ["Heading alignment", "Content alignment", "Use Template", ">Emphasis<", 'title="Standard"', 'title="Featured"', 'title="Subtle"', "Heading Font", "Body Font", "Heading Color", "Body Color", "Accent Color"]) expect(html).not.toContain(removed);
    expect(html).not.toContain("Story background color");
    expect(onChange).not.toHaveBeenCalled();
  });
});
