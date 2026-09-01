import { describe, expect, it } from "vitest";
import type { WebsiteSectionAppearance } from "./types";
import { applyStoryBackgroundColor } from "./storyBackgroundAuthoring";

const base: WebsiteSectionAppearance = {
  headingAlignment: "inherit",
  bodyAlignment: "inherit",
  backgroundTreatment: "inherit",
  emphasis: "inherit",
};

describe("Story background color authoring", () => {
  it("writes template and project semantic IDs with Custom treatment", () => {
    expect(applyStoryBackgroundColor(base, "sage-surface")).toMatchObject({ backgroundTreatment: "custom", decorativeAppearance: { background: { colorId: "sage-surface" } } });
    expect(applyStoryBackgroundColor(base, "project-color-01KED9H9XR7WQBP4JTKP1YYQ3F")).toMatchObject({ backgroundTreatment: "custom", decorativeAppearance: { background: { colorId: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3F" } } });
  });

  it("restores inheritance without writing raw color and preserves dormant legacy data", () => {
    const legacy = { ...base, backgroundTreatment: "custom" as const, decorativeAppearance: { background: { customColor: "#123456", colorId: "sage-surface", texture: "paper" as const } } };
    const inherited = applyStoryBackgroundColor(legacy, undefined);
    expect(inherited.backgroundTreatment).toBe("inherit");
    expect(inherited.decorativeAppearance?.background).toEqual({ customColor: "#123456", texture: "paper" });
    expect(applyStoryBackgroundColor(base, "sage-surface").decorativeAppearance?.background?.customColor).toBeUndefined();
  });
});
