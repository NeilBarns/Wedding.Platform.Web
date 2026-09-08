import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { StoryBlock, StoryContent } from "../websiteEditor/types";
import { createEmptyStoryBlock } from "../websiteEditor/storyBlockOperations";
import { normalizeNarrativeBlock } from "../websiteElements/narrativeBlock";
import { narrativeBlockElementSchema } from "../websiteElements/schemas";
import { ClassicFilipinianaStoryBlock } from "./templates/classicFilipiniana/sections";
import { ModernEditorialStoryBlock } from "./templates/modernEditorial/sections";
import { SectionDecorativeLayers } from "./SectionDecorativeLayers";
import { ZoomedMediaImage } from "./ZoomedMediaImage";
import { resolveEffectiveStorySequence } from "./storyEffectiveSequence";
import { resolveStoryRenderItems } from "./storyRenderSequence";
import {
  narrativeResponsiveOrderClasses,
  resolveNarrativeComposition,
  type NarrativeCompositionCapability,
} from "./narrativeComposition";

const placements = ["leading", "trailing", "above", "below", "splitStart", "splitEnd", "inset"] as const;
const treatments = ["standard", "wide", "cinematic", "fullBleed"] as const;
const treatmentMap = Object.fromEntries(placements.map((placement) => [placement, placement === "inset" ? ["standard"] : [...treatments]]));
const capability = {
  presentations: ["editorial", "mediaFirst", "quoteLed", "textOnly"],
  mediaPlacements: [...placements],
  mediaTreatmentsByPlacement: treatmentMap,
  mediaPlacementsByPresentation: {
    editorial: [...placements],
    mediaFirst: ["leading", "trailing", "above", "below", "splitStart", "splitEnd"],
    quoteLed: ["leading", "trailing", "above", "inset"],
    textOnly: [],
  },
  mediaTreatmentsByPresentationAndPlacement: {
    editorial: treatmentMap,
    mediaFirst: treatmentMap,
    quoteLed: treatmentMap,
    textOnly: {},
  },
  textAlignments: ["start", "center", "end"],
  surfaces: ["none", "soft", "feature"],
  defaults: {
    presentation: "editorial",
    mediaPlacement: "above",
    mediaPlacementByPresentation: { editorial: "above", mediaFirst: "above", quoteLed: "inset" },
    mediaTreatment: "standard",
    textAlignment: "start",
    textAlignmentByPresentation: { editorial: "start", mediaFirst: "start", quoteLed: "start", textOnly: "start" },
    surface: "none",
  },
} as NarrativeCompositionCapability;

const library = { colors: [], fontFamilies: [] } as unknown as TemplateDesignLibrary;

function storyBlock(presentation: StoryBlock["composition"]["presentation"] = "editorial"): StoryBlock {
  return {
    id: "presentation-lock",
    type: "narrativeBlock",
    isHidden: false,
    composition: { presentation },
    slots: {
      eyebrow: { isHidden: false, text: "Eyebrow" },
      heading: { isHidden: false, text: "Heading" },
      divider: { isHidden: false },
      body: { isHidden: false, text: "Body" },
      quote: { isHidden: false, text: "Quote", attribution: "Attribution" },
      media: {
        isHidden: false,
        content: { type: "image", mediaId: "01M0Q08NQ9XJB9A7B5SGC45YD9" },
        appearance: {
          cornerStyle: "rounded",
          frameStyle: "ornamentalCorners",
          frameColorId: "terracotta-accent",
          frameSize: "large",
        },
      },
      caption: { isHidden: false, text: "Caption lock" },
      cta: { isHidden: false, label: "Act", action: null },
    },
  };
}

function resolve(block: StoryBlock) {
  return resolveNarrativeComposition({ block, capability });
}

function renderClassic(block: StoryBlock, choreography?: Parameters<typeof ClassicFilipinianaStoryBlock>[0]["choreography"], viewport: "desktop" | "tablet" | "mobile" = "desktop", mode: "editor" | "public" = "public", media: React.ReactNode = <img alt="Media lock" />) {
  return renderToStaticMarkup(<ClassicFilipinianaStoryBlock sectionId="story" block={block} index={0} library={library} projectColors={[]} viewport={viewport} mode={mode} composition={resolve(block)} media={media} choreography={choreography} />);
}

function renderModern(block: StoryBlock, choreography?: Parameters<typeof ModernEditorialStoryBlock>[0]["choreography"], viewport: "desktop" | "tablet" | "mobile" = "desktop", mode: "editor" | "public" = "public", media: React.ReactNode = <img alt="Media lock" />) {
  return renderToStaticMarkup(<ModernEditorialStoryBlock sectionId="story" block={block} index={0} library={library} projectColors={[]} viewport={viewport} mode={mode} composition={resolve(block)} media={media} choreography={choreography} />);
}

describe("Narrative Presentation resolver characterization", () => {
  it("resolves the presentation-free baseline without warnings or suppression", () => {
    const block = storyBlock();
    block.composition = {};
    const result = resolve(block);
    expect(result.effective).toEqual({ legacyPresentation: undefined, mediaPlacement: "above", mediaTreatment: "standard", textAlignment: "start", surface: "none" });
    expect(result.warning).toBeUndefined();
    expect(result.rendering.slots).toMatchObject({ media: true, caption: true });

    block.composition = { mediaPlacement: "splitStart", mediaTreatment: "wide", textAlignment: "center" };
    expect(resolve(block).effective).toMatchObject({ legacyPresentation: undefined, mediaPlacement: "splitStart", mediaTreatment: "wide", textAlignment: "center" });
  });

  it("locks Editorial baseline defaults and normal Media/Caption participation", () => {
    const block = storyBlock();
    const result = resolve(block);
    expect(result.effective).toEqual({ legacyPresentation: "editorial", mediaPlacement: "above", mediaTreatment: "standard", textAlignment: "start", surface: "none" });
    expect(result.rendering.slots.media).toBe(true);
    expect(result.rendering.slots.caption).toBe(true);
    expect(result.warning).toBeUndefined();

    block.slots.media.isHidden = true;
    const hidden = resolve(block);
    expect(hidden.rendering.slots.media).toBe(false);
    expect(hidden.rendering.slots.caption).toBe(false);
    expect(block.slots.caption).toEqual({ isHidden: false, text: "Caption lock" });
  });

  it("locks Media First defaults, warning, catalog, and treatment filtering", () => {
    const block = storyBlock("mediaFirst");
    const result = resolve(block);
    expect(result.effective.mediaPlacement).toBe("above");
    expect(result.options.mediaPlacements).toEqual(["leading", "trailing", "above", "below", "splitStart", "splitEnd"]);
    expect(result.rendering.slots.media).toBe(true);
    expect(result.warning).toBeUndefined();

    block.composition.mediaPlacement = "inset";
    block.composition.mediaTreatment = "cinematic";
    const filteredPlacement = resolve(block);
    expect(filteredPlacement.effective).toMatchObject({ mediaPlacement: "above", mediaTreatment: "cinematic" });
    expect(filteredPlacement.compatibility.mediaPlacementAuthoredIsActive).toBe(false);
    block.slots.media.isHidden = true;
    expect(resolve(block).warning).toEqual({ type: "mediaUnavailable", message: "Media First works best with Media visible." });
  });

  it("locks Quote Led default Inset, warning, restricted catalog, and Standard treatment", () => {
    const block = storyBlock("quoteLed");
    const result = resolve(block);
    expect(result.effective).toMatchObject({ mediaPlacement: "inset", mediaTreatment: "standard" });
    expect(result.options.mediaPlacements).toEqual(["leading", "trailing", "above", "inset"]);
    expect(result.options.mediaTreatments).toEqual(["standard"]);
    expect(result.rendering.slots.media).toBe(true);
    block.composition.mediaTreatment = "cinematic";
    expect(resolve(block).effective.mediaTreatment).toBe("standard");
    expect(resolve(block).compatibility.mediaTreatmentAuthoredIsActive).toBe(false);
    block.slots.quote.isHidden = true;
    expect(resolve(block).warning).toEqual({ type: "quoteUnavailable", message: "Quote Led works best with Quote visible." });
  });

  it("locks Text Only suppression as non-destructive and switching away restores Media", () => {
    const block = storyBlock("textOnly");
    block.composition.mediaPlacement = "splitEnd";
    block.composition.mediaTreatment = "cinematic";
    const before = structuredClone(block);
    const textOnly = resolve(block);
    expect(textOnly.rendering.suppressMedia).toBe(true);
    expect(textOnly.rendering.suppressCaption).toBe(true);
    expect(textOnly.rendering.slots.media).toBe(false);
    expect(textOnly.rendering.slots.caption).toBe(false);
    expect(textOnly.effective.mediaPlacement).toBeUndefined();
    expect(textOnly.effective.mediaTreatment).toBeUndefined();
    expect(block).toEqual(before);
    expect(block.slots.media.appearance).toEqual(before.slots.media.appearance);

    block.composition.presentation = "editorial";
    const restored = resolve(block);
    expect(restored.rendering.slots.media).toBe(true);
    expect(restored.rendering.slots.caption).toBe(true);
    expect(restored.effective).toMatchObject({ mediaPlacement: "splitEnd", mediaTreatment: "cinematic" });
  });
});

describe("Narrative Presentation Web persistence compatibility", () => {
  it("keeps presentation-free creation and normalization sparse", () => {
    expect(createEmptyStoryBlock().composition).toEqual({});
    expect(normalizeNarrativeBlock({ id: "legacy", type: "narrativeBlock", body: "Body" }).composition).toEqual({});
    const missing = storyBlock();
    expect(narrativeBlockElementSchema.safeParse({ ...missing, composition: {} }).success).toBe(true);
    expect(narrativeBlockElementSchema.safeParse({ ...missing, composition: { presentation: "unknown" } }).success).toBe(false);
  });

  it.each(["editorial", "mediaFirst", "quoteLed", "textOnly"] as const)("preserves existing %s values", (presentation) => {
    expect(normalizeNarrativeBlock(storyBlock(presentation)).composition.presentation).toBe(presentation);
  });
});

describe("Narrative Presentation responsive ordering characterization", () => {
  it.each([
    ["above", { media: "order-[-2]", caption: "-order-1" }],
    ["leading", { media: "order-[-2]", caption: "-order-1" }],
    ["splitStart", { media: "order-[-2] md:order-0", caption: "-order-1 md:order-0" }],
    ["below", { media: "", caption: "" }],
    ["trailing", { media: "", caption: "" }],
    ["splitEnd", { media: "", caption: "" }],
  ] as const)("derives presentation-free %s Media+Caption ordering from placement", (placement, expected) => {
    const block = storyBlock();
    block.composition = { mediaPlacement: placement };
    expect(narrativeResponsiveOrderClasses(resolve(block))).toEqual(expected);
  });

  it.each(placements.filter((placement) => placement !== "inset"))("preserves Editorial %s intent when split layouts stack", (placement) => {
    const block = storyBlock("editorial");
    block.composition.mediaPlacement = placement;
    expect(narrativeResponsiveOrderClasses(resolve(block))).toEqual(
      placement === "splitStart"
        ? { media: "order-[-2] md:order-0", caption: "-order-1 md:order-0" }
        : { media: "", caption: "" },
    );
  });

  it.each([
    ["above", { media: "order-[-2]", caption: "-order-1" }],
    ["leading", { media: "order-[-2]", caption: "-order-1" }],
    ["below", { media: "", caption: "" }],
    ["trailing", { media: "", caption: "" }],
    ["splitStart", { media: "order-[-2] md:order-0", caption: "-order-1 md:order-0" }],
    ["splitEnd", { media: "order-[-2] md:order-0", caption: "-order-1 md:order-0" }],
  ] as const)("locks Media First %s Media+Caption order and canonical reset", (placement, expected) => {
    const block = storyBlock("mediaFirst");
    block.composition.mediaPlacement = placement;
    expect(narrativeResponsiveOrderClasses(resolve(block))).toEqual(expected);
  });
});

describe("Classic Narrative Presentation renderer characterization", () => {
  it("renders presentation-free baseline without Media First or Quote Led styling", () => {
    const block = storyBlock();
    block.composition = {};
    const markup = renderClassic(block);
    expect(markup).toContain("py-14 md:py-20");
    expect(markup).not.toContain("border-y");
  });

  it("locks Editorial baseline and fixed Split geometry even with Media-only content", () => {
    const editorial = storyBlock();
    expect(renderClassic(editorial)).toContain("py-14 md:py-20");
    editorial.composition.mediaPlacement = "splitStart";
    for (const slot of ["eyebrow", "heading", "divider", "body", "quote", "caption", "cta"] as const) editorial.slots[slot].isHidden = true;
    const mediaOnly = renderClassic(editorial);
    expect(mediaOnly).toContain("gap-x-10 md:grid-cols-2");
    expect(mediaOnly).toContain("md:col-start-1 md:row-start-1 md:row-span-8");
  });

  it("locks Media First spacing, consecutive rhythm, and ordering hooks", () => {
    const block = storyBlock("mediaFirst");
    expect(renderClassic(block)).toContain("py-10 md:py-14");
    const consecutive = renderClassic(block, { effectiveIndex: 1, effectiveCount: 2, hasPredecessor: true, hasSuccessor: false, previousKind: "narrative", previousPresentation: "mediaFirst" });
    expect(consecutive).toContain("pb-10 pt-6 md:pb-14 md:pt-8");
    expect(consecutive).toContain("order-[-2]");
    expect(consecutive).toContain("-order-1");
  });

  it("locks Quote Led horizontal accent feature treatment", () => {
    const markup = renderClassic(storyBlock("quoteLed"));
    for (const value of ["border-y", "border-[var(--cf-section-accent)]", "py-8", "text-3xl", "md:text-4xl", "italic"]) expect(markup).toContain(value);
  });

  it("locks Text Only Media and Caption suppression", () => {
    const markup = renderClassic(storyBlock("textOnly"));
    expect(markup).not.toContain("Media lock");
    expect(markup).not.toContain("Caption lock");
  });
});

describe("Modern Narrative Presentation renderer characterization", () => {
  it("renders presentation-free baseline without Media First or Quote Led styling", () => {
    const block = storyBlock();
    block.composition = {};
    const markup = renderModern(block);
    expect(markup).toContain("py-12 md:py-16");
    expect(markup).not.toContain("min-h-[28rem]");
    expect(markup).not.toContain("border-l-4");
  });
  it("locks Editorial baseline and fixed Split geometry with Caption in the text column", () => {
    const block = storyBlock();
    expect(renderModern(block)).toContain("py-12 md:py-16");
    block.composition.mediaPlacement = "splitStart";
    const split = renderModern(block);
    expect(split).toContain("gap-x-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
    expect(split).toContain("md:col-start-1 md:row-start-1 md:row-span-8");
    expect(split).toMatch(/Caption lock[\s\S]*?<\/p>/);
    expect(split.slice(split.lastIndexOf("<p", split.indexOf("Caption lock")), split.indexOf("Caption lock"))).toContain("md:col-start-2");
  });

  it("locks Media First consecutive rhythm and Modern minimum image height", () => {
    const block = storyBlock("mediaFirst");
    expect(renderModern(block)).toContain("min-h-[28rem]");
    const consecutive = renderModern(block, { effectiveIndex: 1, effectiveCount: 2, hasPredecessor: true, hasSuccessor: false, previousKind: "narrative", previousPresentation: "mediaFirst" });
    expect(consecutive).toContain("pb-12 pt-5 md:pb-16 md:pt-7");
  });

  it("locks Quote Led left-accent large semibold non-italic treatment", () => {
    const markup = renderModern(storyBlock("quoteLed"));
    for (const value of ["border-l-4", "border-[var(--me-section-accent)]", "text-3xl", "md:text-5xl", "font-semibold", "not-italic"]) expect(markup).toContain(value);
  });

  it("locks Text Only Media and Caption suppression", () => {
    const markup = renderModern(storyBlock("textOnly"));
    expect(markup).not.toContain("Media lock");
    expect(markup).not.toContain("Caption lock");
  });

  it("locks Media-only Split to the current fixed half-width track", () => {
    const block = storyBlock();
    block.composition.mediaPlacement = "splitEnd";
    for (const slot of ["eyebrow", "heading", "divider", "body", "quote", "caption", "cta"] as const) block.slots[slot].isHidden = true;
    const markup = renderModern(block);
    expect(markup).toContain("gap-x-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
    expect(markup).toContain("md:col-start-2 md:row-start-1 md:row-span-8");
  });
});

describe("Story responsive safety", () => {
  it("preserves structureOrder and represents hidden items only in editor rendering", () => {
    const visible = { ...storyBlock(), id: "visible" };
    const hidden = { ...storyBlock(), id: "hidden", isHidden: true };
    const content: StoryContent = {
      eyebrow: "Eyebrow",
      heading: "Heading",
      intro: "Intro",
      elements: [visible, hidden],
      mediaFraming: {},
      structureOrder: ["story:intro", "narrative:visible", "story:heading", "narrative:hidden", "story:eyebrow"],
    };
    const effective = resolveEffectiveStorySequence({ content, capability, isMediaRenderable: () => true });
    expect(effective.map(({ reference }) => reference)).toEqual(["story:intro", "narrative:visible", "story:heading", "story:eyebrow"]);
    expect(resolveStoryRenderItems(content, effective, "public").flatMap((item) => item.kind === "singletonRun" ? item.references : [`narrative:${item.block.id}`])).toEqual(["story:intro", "narrative:visible", "story:heading", "story:eyebrow"]);
    expect(resolveStoryRenderItems(content, effective, "editor").flatMap((item) => item.kind === "singletonRun" ? item.references : [`narrative:${item.block.id}`])).toEqual(content.structureOrder);
  });

  it.each(["classic", "modern"] as const)("uses canonical Story split, padding, and order boundaries for %s", (template) => {
    const block = storyBlock("editorial");
    block.composition.mediaPlacement = "splitStart";
    const markup = template === "classic" ? renderClassic(block) : renderModern(block);
    expect(markup).toContain("px-7 md:px-12");
    expect(markup).toContain("md:grid-cols-");
    expect(markup).toContain("order-[-2] md:order-0");
    expect(markup).not.toMatch(/\bsm:(?:grid|col|row|order|p[trblxy]?|gap)-/);
  });

  it.each(["classic", "modern"] as const)("keeps every %s media placement DOM-stable across semantic viewports", (template) => {
    for (const placement of placements) {
      const block = storyBlock("editorial");
      block.composition.mediaPlacement = placement;
      for (const viewport of ["mobile", "tablet", "desktop"] as const) {
        const markup = template === "classic" ? renderClassic(block, undefined, viewport) : renderModern(block, undefined, viewport);
        expect(markup.indexOf("Heading")).toBeLessThan(markup.indexOf("Media lock"));
        expect(markup).toContain("min-w-0");
        expect(markup).not.toContain("100vw");
      }
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s full-bleed media bounded by its exactly paired Story inset", (template) => {
    const block = storyBlock("editorial");
    block.composition.mediaTreatment = "fullBleed";
    const markup = template === "classic" ? renderClassic(block) : renderModern(block);
    expect(markup).toContain("overflow-hidden px-7 md:px-12");
    expect(markup).toContain("-mx-7 w-[calc(100%+3.5rem)] md:-mx-12 md:w-[calc(100%+6rem)]");
    expect(markup).not.toContain("w-screen");
    expect(markup).not.toContain("100vw");
  });

  it.each(["classic", "modern"] as const)("preserves %s Story focal point and zoom in editor and public geometry", (template) => {
    const block = storyBlock();
    const media = <ZoomedMediaImage src="/story.jpg" width={1200} height={900} className="block w-full object-cover" reference={{ focalPoint: { x: 0.2, y: 0.8 }, zoom: 1.4 }} />;
    for (const mode of ["editor", "public"] as const) {
      const markup = template === "classic" ? renderClassic(block, undefined, "mobile", mode, media) : renderModern(block, undefined, "mobile", mode, media);
      expect(markup).toContain('data-media-focal-x="0.2"');
      expect(markup).toContain('data-media-focal-y="0.8"');
      expect(markup).toContain('data-media-zoom="1.4"');
    }
  });

  it.each(["classic-filipiniana-v1", "modern-editorial-v1"] as const)("clips %s Story decorations to the Story surface", (templateKey) => {
    for (const viewport of ["mobile", "tablet", "desktop"] as const) {
      const markup = renderToStaticMarkup(<SectionDecorativeLayers templateKey={templateKey} viewport={viewport} appearance={{}} />);
      expect(markup).toContain("absolute inset-0 overflow-hidden");
      expect(markup).toContain("pointer-events-none");
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain("data-section-decoration");
    }
  });
});
