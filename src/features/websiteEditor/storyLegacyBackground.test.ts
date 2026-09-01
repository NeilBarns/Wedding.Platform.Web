import { describe, expect, it } from "vitest";
import type { WebsiteSectionAppearance } from "./types";
import { storyLegacyBackgroundState } from "./storyLegacyBackground";

const appearance = (backgroundTreatment: WebsiteSectionAppearance["backgroundTreatment"]): WebsiteSectionAppearance => ({
  headingAlignment: "inherit",
  bodyAlignment: "inherit",
  backgroundTreatment,
  emphasis: "inherit",
});

describe("Story legacy background state", () => {
  it.each(["plain", "soft", "accent"] as const)("describes legacy %s without changing appearance", (treatment) => {
    const source = appearance(treatment);
    const before = structuredClone(source);
    expect(storyLegacyBackgroundState(source)?.label).toBe(`${treatment[0].toUpperCase()}${treatment.slice(1)} · Legacy`);
    expect(source).toEqual(before);
  });

  it("shows the saved raw legacy custom color", () => {
    const source = appearance("custom");
    source.decorativeAppearance = { background: { customColor: "#A1B2C3" } };
    expect(storyLegacyBackgroundState(source)).toEqual({ label: "Legacy Custom · #A1B2C3", color: "#A1B2C3" });
  });

  it("does not describe canonical color IDs or inheritance as legacy", () => {
    expect(storyLegacyBackgroundState(appearance("inherit"))).toBeNull();
    const canonical = appearance("custom");
    canonical.decorativeAppearance = { background: { colorId: "sage-accent" } };
    expect(storyLegacyBackgroundState(canonical)).toBeNull();
  });
});
