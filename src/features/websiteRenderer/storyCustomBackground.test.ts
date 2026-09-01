import { describe, expect, it } from "vitest";
import { backgroundTreatmentSchema, opaqueHexColorSchema } from "../websiteEditor/schemas";
import type { WebsiteDesignSettings, WebsiteSectionAppearance } from "../websiteEditor/types";
import { resolveClassicFilipinianaSectionAppearance } from "./templates/classicFilipiniana/appearance";
import { resolveModernEditorialSectionAppearance } from "./templates/modernEditorial/appearance";
import { normalizeOpaqueHex, resolveStoryCustomBackground } from "./storyCustomBackground";

const library = { colors: [
  { id: "sage-surface", displayName: "Sage Surface", value: "#E6EBDD", allowedProjectRoles: [], allowedElementRoles: [], allowedContainerRoles: [] },
] } as unknown as import("../websiteCapabilities/types").TemplateDesignLibrary;
const projectColors = [{ id: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3F", value: "#1A1A1A" }];

const appearance = (backgroundTreatment: WebsiteSectionAppearance["backgroundTreatment"], customColor?: string): WebsiteSectionAppearance => ({
  headingAlignment: "inherit",
  bodyAlignment: "inherit",
  backgroundTreatment,
  emphasis: "inherit",
  decorativeAppearance: customColor ? { background: { customColor } } : undefined,
});

describe("Story custom background", () => {
  it("parses Custom and normalizes only opaque six-digit hex", () => {
    expect(backgroundTreatmentSchema.parse("custom")).toBe("custom");
    expect(opaqueHexColorSchema.parse("#a1b2c3")).toBe("#A1B2C3");
    for (const invalid of ["#FFF", "#11223344", "rgb(1,2,3)", "rgba(1,2,3,.5)", "red", "var(--x)", "linear-gradient(red, blue)", "url(x)"]) expect(opaqueHexColorSchema.safeParse(invalid).success).toBe(false);
    expect(normalizeOpaqueHex("#abcdef")).toBe("#ABCDEF");
  });
  it("uses Custom only when active and ignores dormant or invalid values", () => {
    expect(resolveStoryCustomBackground("story", appearance("custom", "#123456"), library, projectColors)).toEqual({ backgroundColor: "#123456" });
    expect(resolveStoryCustomBackground("story", appearance("soft", "#123456"), library, projectColors)).toBeNull();
    expect(resolveStoryCustomBackground("story", appearance("custom", "not-css"), library, projectColors)).toBeNull();
    expect(resolveStoryCustomBackground("hero", appearance("custom", "#123456"), library, projectColors)).toBeNull();
  });
  it("prefers semantic colorId and fails safely to legacy or inheritance", () => {
    const custom = appearance("custom", "#123456");
    custom.decorativeAppearance!.background!.colorId = "sage-surface";
    expect(resolveStoryCustomBackground("story", custom, library, projectColors)).toEqual({ backgroundColor: "#E6EBDD" });
    custom.decorativeAppearance!.background!.colorId = projectColors[0].id;
    expect(resolveStoryCustomBackground("story", custom, library, projectColors)).toEqual({ backgroundColor: "#1A1A1A" });
    custom.decorativeAppearance!.background!.colorId = "missing";
    expect(resolveStoryCustomBackground("story", custom, library, projectColors)).toEqual({ backgroundColor: "#123456" });
    delete custom.decorativeAppearance!.background!.customColor;
    expect(resolveStoryCustomBackground("story", custom, library, projectColors)).toBeNull();
  });
  it("applies the same mechanism in Classic and Modern", () => {
    const custom = appearance("custom", "#234567");
    expect(resolveClassicFilipinianaSectionAppearance("story", {} as WebsiteDesignSettings, custom, 0, library, projectColors).sectionStyle?.backgroundColor).toBe("#234567");
    expect(resolveModernEditorialSectionAppearance("story", custom, 0, library, projectColors).sectionStyle?.backgroundColor).toBe("#234567");
  });
  it.each(["plain", "soft", "accent"] as const)("preserves legacy %s rendering", (treatment) => {
    const legacy = appearance(treatment);
    expect(resolveClassicFilipinianaSectionAppearance("story", {} as WebsiteDesignSettings, legacy, 0, library, projectColors).sectionClass).toBeTruthy();
    expect(resolveModernEditorialSectionAppearance("story", legacy, 0, library, projectColors).sectionClass).toBeTruthy();
  });
});
