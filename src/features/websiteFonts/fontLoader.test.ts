import { describe, expect, it } from "vitest";
import { collectRequiredFontIds, platformFont } from "./platformFonts";
import type { WebsiteDraft } from "../websiteEditor/types";
import { fontStylesheetUrl } from "./fontLoader";

describe("fontStylesheetUrl", () => {
  it("loads every advertised weight in normal and italic style", () => {
    const font = platformFont("inter");
    expect(font).toBeDefined();
    const url = fontStylesheetUrl(font!);
    expect(url).toContain("ital,wght@0,400;0,600;0,700;1,400;1,600;1,700");
  });

  it("does not advertise italic for normal-only families", () => {
    expect(fontStylesheetUrl(platformFont("quicksand")!)).toContain("wght@400;600;700");
    expect(fontStylesheetUrl(platformFont("quicksand")!)).not.toContain("ital,wght");
  });

  it("collects an authored Text font from a Date child flow", () => {
    const website = {
      designSettings: { fontSet: "none", projectDefaults: {} },
      projectDesignDefaults: null,
      template: { capabilities: { designLibrary: { typographyPresets: [] } } },
      sections: [{
        type: "date",
        resolvedDesignContext: null,
        designDefaults: {},
        content: {
          childFlow: {
            elements: [{ id: "text-1", type: "text", text: "Details", appearance: { fontFamilyId: "inter" } }],
            order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "text-1" }],
          },
        },
      }],
    } as unknown as WebsiteDraft;
    expect(collectRequiredFontIds(website)).toContain("inter");
  });
});
