import { describe, expect, it } from "vitest";
import { applyNarrativeBackgroundColor, applyNarrativeDecoration, narrativeLegacyBackgroundLabel } from "./narrativeBackground";
import { normalizeNarrativeBlock } from "../websiteElements/narrativeBlock";

const block = () => normalizeNarrativeBlock({ id: "block", type: "narrativeBlock", body: "Body" });

describe("Narrative background authoring", () => {
  it("stores semantic template/project IDs and clears legacy Surface only after an explicit choice", () => {
    const legacy = block();
    legacy.composition.surface = "feature";
    expect(narrativeLegacyBackgroundLabel(legacy)).toBe("Feature · Legacy");
    const authored = applyNarrativeBackgroundColor(legacy, "sage-accent");
    expect(authored.appearance?.backgroundColorId).toBe("sage-accent");
    expect(authored.composition.surface).toBeUndefined();
    expect(narrativeLegacyBackgroundLabel(authored)).toBeNull();
    expect(legacy.composition.surface).toBe("feature");
  });

  it("None removes the color and exposes the transparent default", () => {
    const authored = applyNarrativeBackgroundColor(applyNarrativeBackgroundColor(block(), "project-color-01KED9H9XR7WQBP4JTKP1YYQ3F"));
    expect(authored.appearance).toBeUndefined();
    expect(authored.composition.surface).toBeUndefined();
  });

  it("authors decoration sparsely and preserves dormant strengths and unrelated appearance", () => {
    let decorated = applyNarrativeBackgroundColor(block(), "sage-accent");
    decorated = applyNarrativeDecoration(decorated, "texture", "fabric");
    decorated = applyNarrativeDecoration(decorated, "textureStrength", 70);
    decorated = applyNarrativeDecoration(decorated, "texture", "none");
    expect(decorated.appearance).toMatchObject({ backgroundColorId: "sage-accent", decorativeAppearance: { background: { texture: "none", textureStrength: 70 } } });
    decorated = applyNarrativeDecoration(decorated, "texture", "fabric");
    expect(decorated.appearance?.decorativeAppearance?.background?.textureStrength).toBe(70);
    decorated = applyNarrativeDecoration(decorated, "textureStrength");
    expect(decorated.appearance?.decorativeAppearance?.background?.texture).toBe("fabric");
    expect(decorated.appearance?.decorativeAppearance?.background?.textureStrength).toBeUndefined();
  });
});
