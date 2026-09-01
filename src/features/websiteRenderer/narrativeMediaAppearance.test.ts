import { describe, expect, it } from "vitest";
import type { ElementCapability } from "../websiteCapabilities/types";
import { applyNarrativeMediaCornerStyle, applyNarrativeMediaFrameColor, applyNarrativeMediaFrameSize, applyNarrativeMediaFrameStyle } from "../websiteEditor/narrativeMediaAppearance";
import type { StoryBlock } from "../websiteEditor/types";
import {
  narrativeMediaCornerClass,
  resolveNarrativeMediaCornerStyle,
} from "./narrativeMediaAppearance";
import { resetNarrativeComposition } from "./narrativeComposition";

const block: StoryBlock = {
  id: "narrative",
  type: "narrativeBlock",
  isHidden: false,
  composition: { presentation: "editorial", mediaTreatment: "cinematic" },
  slots: {
    eyebrow: { isHidden: true, text: "" },
    heading: { isHidden: false, text: "Heading" },
    divider: { isHidden: true },
    body: { isHidden: false, text: "Body" },
    quote: { isHidden: true, text: "" },
    media: {
      isHidden: false,
      content: { type: "image", mediaId: "01M0Q08NQ9XJB9A7B5SGC45YD9" },
    },
    caption: { isHidden: true, text: "" },
    cta: { isHidden: true, label: "", action: null },
  },
};

const capability = {
  appearance: { media: { cornerStyles: ["square", "soft", "rounded"], frameStyles: [], frameColorIds: [] } },
} as unknown as NonNullable<ElementCapability["narrativeBlock"]>;

describe("Narrative Media appearance", () => {
  it.each(["square", "soft", "rounded"] as const)(
    "persists and resolves supported %s corners without changing content or composition",
    (cornerStyle) => {
      const authored = applyNarrativeMediaCornerStyle(block, cornerStyle);
      expect(authored.slots.media.appearance).toEqual({ cornerStyle });
      expect(authored.slots.media.content).toEqual(block.slots.media.content);
      expect(authored.composition).toEqual(block.composition);
      expect(resolveNarrativeMediaCornerStyle(authored, capability)).toBe(cornerStyle);
    },
  );

  it("removes the sparse appearance container for Template Default", () => {
    const authored = applyNarrativeMediaCornerStyle(block, "rounded");
    const inherited = applyNarrativeMediaCornerStyle(authored);
    expect(inherited.slots.media.appearance).toBeUndefined();
    expect(resolveNarrativeMediaCornerStyle(inherited, capability)).toBeUndefined();
  });

  it("keeps individual Layout resets and legacy Text Only non-destructive to Corners", () => {
    const authored = applyNarrativeMediaCornerStyle(block, "soft");
    const textOnly = {
      ...authored,
      composition: { ...authored.composition, presentation: "textOnly" as const },
    };
    expect(textOnly.slots.media.appearance?.cornerStyle).toBe("soft");
    expect({ ...textOnly, composition: resetNarrativeComposition(textOnly.composition, "mediaTreatment") }.slots.media.appearance?.cornerStyle).toBe("soft");
  });

  it("maps inherited, square, soft, and rounded wrapper clipping without treatment coupling", () => {
    expect(narrativeMediaCornerClass(undefined)).toBe("");
    expect(narrativeMediaCornerClass("square")).toBe("");
    expect(narrativeMediaCornerClass("soft")).toBe("rounded-sm");
    expect(narrativeMediaCornerClass("rounded")).toBe("rounded-xl");
    for (const treatment of ["standard", "cinematic", "fullBleed"] as const) {
      const composition = { ...block.composition, mediaTreatment: treatment };
      expect(composition.mediaTreatment).toBe(treatment);
      expect(narrativeMediaCornerClass("rounded")).toBe("rounded-xl");
    }
  });

  it("falls back to native corners without deleting unsupported authored intent", () => {
    const narrowed = {
      ...capability,
      appearance: { ...capability.appearance, media: { cornerStyles: ["square"], frameStyles: [], frameColorIds: [] } },
    } as NonNullable<ElementCapability["narrativeBlock"]>;
    const authored = applyNarrativeMediaCornerStyle(block, "rounded");
    expect(resolveNarrativeMediaCornerStyle(authored, narrowed)).toBeUndefined();
    expect(authored.slots.media.appearance?.cornerStyle).toBe("rounded");
  });

  it("authors None and named frames sparsely without changing media or composition", () => {
    const none = applyNarrativeMediaFrameStyle(block, "none");
    expect(none.slots.media.appearance).toEqual({ frameStyle: "none" });
    const named = applyNarrativeMediaFrameStyle(none, "ornamentalCorners");
    expect(named.slots.media.appearance).toEqual({ frameStyle: "ornamentalCorners" });
    expect(named.slots.media.content).toEqual(block.slots.media.content);
    expect(named.composition).toEqual(block.composition);
  });

  it("resets only Frame and prunes an otherwise empty appearance", () => {
    expect(applyNarrativeMediaFrameStyle(applyNarrativeMediaFrameStyle(block, "none")).slots.media.appearance).toBeUndefined();
    const withCorners = applyNarrativeMediaCornerStyle(block, "soft");
    expect(applyNarrativeMediaFrameStyle(applyNarrativeMediaFrameStyle(withCorners, "none")).slots.media.appearance).toEqual({ cornerStyle: "soft" });
  });

  it("authors and independently resets Frame Color and every Frame Size", () => {
    for (const frameSize of ["small", "medium", "large"] as const) {
      const authored = applyNarrativeMediaFrameSize(applyNarrativeMediaFrameColor(applyNarrativeMediaCornerStyle(applyNarrativeMediaFrameStyle(block, "ornamentalCorners"), "soft"), "project-color-01KED9H9XR7WQBP4JTKP1YYQ3G"), frameSize);
      expect(authored.slots.media.appearance).toEqual({ frameStyle: "ornamentalCorners", cornerStyle: "soft", frameColorId: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3G", frameSize });
      expect(applyNarrativeMediaFrameSize(authored).slots.media.appearance).toEqual({ frameStyle: "ornamentalCorners", cornerStyle: "soft", frameColorId: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3G" });
      expect(applyNarrativeMediaFrameColor(authored).slots.media.appearance).toEqual({ frameStyle: "ornamentalCorners", cornerStyle: "soft", frameSize });
    }
    expect(applyNarrativeMediaFrameColor(applyNarrativeMediaFrameColor(block, "terracotta-accent")).slots.media.appearance).toBeUndefined();
    expect(applyNarrativeMediaFrameSize(applyNarrativeMediaFrameSize(block, "medium")).slots.media.appearance).toBeUndefined();
  });

  it("keeps Frame Color and Size dormant when Frame becomes None", () => {
    const configured = applyNarrativeMediaFrameSize(applyNarrativeMediaFrameColor(applyNarrativeMediaFrameStyle(block, "ornamentalCorners"), "terracotta-accent"), "large");
    const none = applyNarrativeMediaFrameStyle(configured, "none");
    expect(none.slots.media.appearance).toEqual({ frameStyle: "none", frameColorId: "terracotta-accent", frameSize: "large" });
    expect(applyNarrativeMediaFrameStyle(none, "ornamentalCorners").slots.media.appearance).toEqual({ frameStyle: "ornamentalCorners", frameColorId: "terracotta-accent", frameSize: "large" });
  });
});
