import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  ElementCapability,
  TemplateDesignLibrary,
} from "../../websiteCapabilities/types";
import type { StoryBlock } from "../types";
import {
  authorNarrativeComposition,
  resetNarrativeComposition,
  resolveNarrativeComposition,
} from "../../websiteRenderer/narrativeComposition";
import { NarrativeBlockAppearancePanel } from "./NarrativeBlockAppearancePanel";

const compositionCapability = {
  presentations: ["editorial", "mediaFirst", "quoteLed", "textOnly"],
  mediaPlacements: ["above", "inset"],
  mediaTreatmentsByPlacement: {
    above: ["standard", "wide", "cinematic", "fullBleed"],
    inset: ["standard"],
  },
  mediaPlacementsByPresentation: {
    editorial: ["above", "inset"],
    mediaFirst: ["above"],
    quoteLed: ["inset"],
    textOnly: [],
  },
  mediaTreatmentsByPresentationAndPlacement: {
    editorial: {
      above: ["standard", "wide", "cinematic", "fullBleed"],
      inset: ["standard"],
    },
    mediaFirst: { above: ["standard", "wide"] },
    quoteLed: { inset: ["standard"] },
    textOnly: {},
  },
  textAlignments: ["start", "center", "end"],
  surfaces: ["none", "soft", "feature"],
  defaults: {
    presentation: "editorial",
    mediaPlacement: "above",
    mediaPlacementByPresentation: {
      editorial: "above",
      mediaFirst: "above",
      quoteLed: "inset",
    },
    mediaTreatment: "standard",
    textAlignment: "start",
    textAlignmentByPresentation: {
      editorial: "start",
      mediaFirst: "start",
      quoteLed: "start",
      textOnly: "start",
    },
    surface: "none",
  },
} as const;

const capability = {
  type: "narrativeBlock",
  appearance: { typography: [], colors: [] },
  narrativeBlock: {
    slots: ["eyebrow", "heading", "divider", "body", "quote", "media", "caption", "cta"],
    appearance: {
      controls: ["fontFamilyId", "fontSize", "lineSpacing", "letterSpacing", "colorId"],
      backgroundColorIds: ["background"],
      decorativeAppearance: { textures: ["none"], patterns: ["none"] },
      media: { cornerStyles: ["square", "soft", "rounded"], frameStyles: [], frameColorIds: [] },
      fontSizeOptions: ["xs", "s", "m", "l", "xl"],
      responsiveFontSizeViewports: ["desktop", "tablet", "mobile"],
    },
    composition: compositionCapability,
  },
} as unknown as ElementCapability;
const resolverCapability = capability.narrativeBlock!.composition;

const library = {
  colors: [
    { id: "background", displayName: "Background", value: "#FFFFFF", origin: "template", allowedProjectRoles: [], allowedElementRoles: [], allowedContainerRoles: ["backgroundColor"] },
    { id: "accent", displayName: "Accent", value: "#9D5B45", origin: "template", allowedProjectRoles: [], allowedElementRoles: [], allowedContainerRoles: ["accentColor"] },
  ],
  fontFamilies: [],
  fontRecommendations: { heading: [], body: [], accent: [] },
  palettePresets: [],
  typographyPresets: [],
} as TemplateDesignLibrary;

function block(overrides: Partial<StoryBlock["composition"]> = {}): StoryBlock {
  const text = { isHidden: false, text: "" };
  return {
    id: "narrative",
    type: "narrativeBlock",
    isHidden: false,
    composition: { ...overrides },
    slots: {
      eyebrow: text,
      heading: text,
      divider: { isHidden: true },
      body: text,
      quote: text,
      media: { isHidden: false, content: { type: "image", mediaId: "01M0Q08NQ9XJB9A7B5SGC45YD9" } },
      caption: text,
      cta: { isHidden: true, label: "", action: null },
    },
  };
}

function renderPanel(value = block()) {
  return renderToStaticMarkup(
    <NarrativeBlockAppearancePanel
      block={value}
      templateKey="classic-filipiniana-v1"
      viewport="desktop"
      capability={capability}
      library={library}
      projectColors={[]}
      onChange={() => undefined}
      activeDisclosure={null}
      onDisclosureChange={() => undefined}
      onAddColor={async () => { throw new Error("not used"); }}
      context={null}
    />,
  );
}

describe("NarrativeBlockAppearancePanel", () => {
  it("exposes presentation-independent Layout and Media sections", () => {
    const markup = renderPanel();
    const layout = markup.slice(markup.indexOf(">Layout<"), markup.indexOf(">Media<"));
    const media = markup.slice(markup.indexOf(">Media<"), markup.indexOf(">Background<"));

    expect(layout).toContain("Media placement");
    expect(layout).toContain("Text alignment");
    expect(layout).not.toContain("Block composition");
    expect(layout).not.toContain("Treatment");
    expect(media).toContain("Treatment");
    expect(media).not.toContain("Media treatment");
    for (const removed of ["Presentation", "Editorial", "Media First", "Quote Led", "Text Only"])
      expect(markup).not.toContain(removed);
  });

  it("shows the existing capability-filtered treatment choices", () => {
    const markup = renderPanel();
    const media = markup.slice(markup.indexOf(">Media<"), markup.indexOf(">Background<"));

    for (const label of ["Standard", "Wide", "Cinematic", "Full Bleed"])
      expect(media).toContain(label);
  });

  it("shows capability-driven Corners below Treatment", () => {
    const markup = renderPanel();
    const media = markup.slice(markup.indexOf(">Media<"), markup.indexOf(">Background<"));

    expect(media.indexOf("Treatment")).toBeLessThan(media.indexOf("Corners"));
    for (const label of ["Template Default", "Square", "Soft", "Rounded"])
      expect(media).toContain(label);
  });

  it("hides Frame with no meaningful choices and shows capability-provided frames", () => {
    expect(renderPanel()).not.toContain(">Frame<");
    const withFrames = { ...capability, narrativeBlock: { ...capability.narrativeBlock!, appearance: { ...capability.narrativeBlock!.appearance, media: { ...capability.narrativeBlock!.appearance.media, frameStyles: [{ key: "ornamentalCorners", displayName: "Ornamental Corners" }] } } } } as ElementCapability;
    const markup = renderToStaticMarkup(<NarrativeBlockAppearancePanel block={block()} capability={withFrames} viewport="desktop" library={library} projectColors={[]} templateKey="classic-filipiniana-v1" onChange={() => undefined} activeDisclosure={null} onDisclosureChange={() => undefined} onAddColor={async () => { throw new Error("not used"); }} context={null} />);
    expect(markup).toContain(">Frame<");
    expect(markup).toContain("Ornamental Corners");
  });

  it("shows frame-specific Color and Size only for a supported active frame", () => {
    const withFrames = { ...capability, narrativeBlock: { ...capability.narrativeBlock!, appearance: { ...capability.narrativeBlock!.appearance, media: { ...capability.narrativeBlock!.appearance.media, frameColorIds: ["accent"], frameStyles: [{ key: "ornamentalCorners", displayName: "Ornamental Corners", supportsColor: true, sizes: ["small", "medium", "large"] }] } } } } as ElementCapability;
    const render = (value: StoryBlock, projectColors: Array<{ id: string; value: string }> = []) => renderToStaticMarkup(<NarrativeBlockAppearancePanel block={value} capability={withFrames} viewport="desktop" library={library} projectColors={projectColors} templateKey="classic-filipiniana-v1" onChange={() => undefined} activeDisclosure={null} onDisclosureChange={() => undefined} onAddColor={async () => { throw new Error("not used"); }} context={null} />);
    const active = block();
    active.slots.media.appearance = { frameStyle: "ornamentalCorners", frameColorId: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3G", frameSize: "medium" };
    const markup = render(active, [{ id: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3G", value: "#121212" }]);
    expect(markup).toContain("Frame Color");
    expect(markup).toContain("Frame Size");
    expect(markup).toContain('title="Accent"');
    expect(markup).toContain('title="Custom color #121212"');
    expect(markup).toContain("Medium");
    for (const [frameSize, label] of [[undefined, "Template Default"], ["small", "Small"], ["large", "Large"]] as const) {
      const sized = block();
      sized.slots.media.appearance = { frameStyle: "ornamentalCorners", ...(frameSize ? { frameSize } : {}) };
      expect(render(sized)).toContain(`>${label}<`);
    }
    const none = block();
    none.slots.media.appearance = { frameStyle: "none", frameColorId: "accent", frameSize: "large" };
    expect(render(none)).not.toContain("Frame Color");
    expect(render(none)).not.toContain("Frame Size");
    const unsupported = block();
    unsupported.slots.media.appearance = { frameStyle: "futureFrame", frameColorId: "accent", frameSize: "large" };
    expect(render(unsupported)).not.toContain("Frame Color");
    expect(render(unsupported)).not.toContain("Frame Size");
  });

  it("keeps treatment disabled when media does not participate", () => {
    const value = block({ presentation: "textOnly", mediaTreatment: "wide" });
    const markup = renderPanel(value);
    const media = markup.slice(markup.indexOf(">Media<"), markup.indexOf(">Background<"));

    expect(media).toContain("Media controls are unavailable for this block.");
    expect(media).toContain("disabled");
    expect(markup).not.toContain("Text Only");
    expect(markup).not.toContain("works best");
  });

  it("keeps individual resets sparse and preserves hidden legacy Presentation", () => {
    const composition = {
      presentation: "mediaFirst",
      mediaPlacement: "above",
      mediaTreatment: "wide",
      textAlignment: "center",
    } as StoryBlock["composition"];

    expect(resetNarrativeComposition(composition, "mediaTreatment")).toEqual({
      presentation: "mediaFirst",
      mediaPlacement: "above",
      textAlignment: "center",
    });
    expect(resetNarrativeComposition(composition, "mediaPlacement")).toEqual({
      presentation: "mediaFirst",
      mediaTreatment: "wide",
      textAlignment: "center",
    });
    expect(resetNarrativeComposition(composition, "textAlignment")).toEqual({
      presentation: "mediaFirst",
      mediaPlacement: "above",
      mediaTreatment: "wide",
    });
  });

  it("authors placement, alignment, and treatment without introducing Presentation", () => {
    let composition: StoryBlock["composition"] = {};
    composition = authorNarrativeComposition(composition, "mediaPlacement", "splitStart");
    composition = authorNarrativeComposition(composition, "textAlignment", "center");
    composition = authorNarrativeComposition(composition, "mediaTreatment", "wide");
    expect(composition).toEqual({ mediaPlacement: "splitStart", textAlignment: "center", mediaTreatment: "wide" });
    expect(composition.presentation).toBeUndefined();
  });

  it.each(["mediaFirst", "quoteLed", "textOnly"] as const)("hides legacy %s authoring and warnings without mutating the block", (presentation) => {
    const value = block({ presentation });
    const before = structuredClone(value);
    const markup = renderPanel(value);
    expect(value).toEqual(before);
    expect(markup).not.toContain("Presentation");
    expect(markup).not.toContain("works best");
    expect(value.composition.presentation).toBe(presentation);
  });

  it("preserves an incompatible authored treatment for later reactivation", () => {
    const inset = block({ mediaPlacement: "inset", mediaTreatment: "wide" });
    const inactive = resolveNarrativeComposition({
      block: inset,
      capability: resolverCapability,
    });
    expect(inactive.authored.mediaTreatment).toBe("wide");
    expect(inactive.effective.mediaTreatment).toBe("standard");
    expect(inactive.compatibility.mediaTreatmentAuthoredIsActive).toBe(false);

    const compatible = resolveNarrativeComposition({
      block: { ...inset, composition: { ...inset.composition, mediaPlacement: "above" } },
      capability: resolverCapability,
    });
    expect(compatible.effective.mediaTreatment).toBe("wide");
    expect(compatible.compatibility.mediaTreatmentAuthoredIsActive).toBe(true);
  });
});
