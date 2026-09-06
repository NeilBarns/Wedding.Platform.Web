import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WebsiteDraft, WebsiteSection } from "../websiteEditor/types";
import { ClassicFilipinianaRenderer } from "./templates/ClassicFilipinianaRenderer";
import { ModernEditorialRenderer } from "./templates/ModernEditorialRenderer";
import { resolveModernEditorialSectionAppearance } from "./templates/modernEditorial/appearance";
import { resolveClassicFilipinianaSectionAppearance } from "./templates/classicFilipiniana/appearance";

const event = { id: "event", name: "Alex & Sam", eventDate: "2027-01-02", type: "wedding" as const };
const appearance = {
  headingAlignment: "inherit" as const,
  bodyAlignment: "inherit" as const,
  backgroundTreatment: "inherit" as const,
  emphasis: "inherit" as const,
};
const resolvedMedia = {
  image: {
    id: "image",
    originalFilename: "hero.jpg",
    width: 1600,
    height: 1200,
    web: { width: 1200, height: 900, url: "/hero.jpg" },
  },
};

function section(type: string, id = type, content: Record<string, unknown> = {}): WebsiteSection {
  return {
    id,
    type,
    displayName: type,
    sortOrder: 10,
    isEnabled: true,
    content,
    appearance,
    designDefaults: {},
    resolvedDesignContext: null,
    appearanceOptions: null,
    mediaCapability: null,
    itemMediaCapability: null,
    presentationCapability: null,
  } as WebsiteSection;
}

function draft(templateKey: "classic-filipiniana-v1" | "modern-editorial-v1", sections: WebsiteSection[]): WebsiteDraft {
  return {
    schemaVersion: 5,
    id: "website",
    eventId: event.id,
    name: "Website",
    templateKey,
    designSettings: { colorTheme: templateKey.startsWith("classic") ? "terracotta" : "ink", fontSet: "editorial", artStyle: "clean", projectDefaults: {}, customColors: [] },
    projectDesignDefaults: null,
    template: {
      key: templateKey,
      displayName: templateKey,
      designOptions: { colorThemes: [], fontSets: [], artStyles: [] },
      capabilities: { sections: [], elementCapabilities: [], designLibrary: { colors: [], fontFamilies: [], palettePresets: [], typographyPresets: [] } },
    },
    sections,
    media: resolvedMedia,
  } as unknown as WebsiteDraft;
}

function render(template: "classic" | "modern", sections: WebsiteSection[], viewport: "desktop" | "tablet" | "mobile" = "desktop", mode: "editor" | "public" = "public") {
  const templateKey = template === "classic" ? "classic-filipiniana-v1" : "modern-editorial-v1";
  const Renderer = template === "classic" ? ClassicFilipinianaRenderer : ModernEditorialRenderer;
  return renderToStaticMarkup(<Renderer event={event} website={draft(templateKey, sections)} targetViewport={viewport} mode={mode} />);
}

function hero(): WebsiteSection {
  return {
    ...section("hero", "hero", { headline: "Alex & Sam", subheadline: "Together", media: { assetId: "image" } }),
    appearance: { ...appearance, presentation: "immersive" },
    mediaCapability: { mode: "single" },
    presentationCapability: {
      default: "immersive",
      options: [{ key: "immersive", displayName: "Immersive", description: "Full bleed", preview: "overlay", mediaControls: { overlayStrength: { default: 0.5, min: 0.2, max: 0.8, step: 0.1 }, foregroundColors: { default: "#FFFFFF", options: [{ key: "#FFFFFF", displayName: "Light" }] } } }],
    },
  } as WebsiteSection;
}

function containedHero(template: "classic" | "modern", placement: "top" | "bottom" | "left" = "top"): WebsiteSection {
  const presentation = template === "classic" ? "classic" : "editorial";
  return {
    ...hero(),
    appearance: {
      ...appearance,
      presentation,
      mediaPlacement: placement,
      mediaSize: "balanced",
      mediaContentGap: "comfortable",
      mediaSpacing: { top: "none", right: "none", bottom: "none", left: "none" },
    },
    presentationCapability: {
      default: presentation,
      options: [{ key: presentation, displayName: presentation, description: "Contained Hero", preview: "contained", mediaControls: {
        mediaPlacements: { default: placement, options: ["top", "bottom", "left", "right"].map((key) => ({ key, displayName: key })) },
        mediaSizes: { default: "balanced", options: [{ key: "balanced", displayName: "Balanced" }] },
        mediaContentGaps: { default: "comfortable", options: [{ key: "comfortable", displayName: "Comfortable" }] },
        mediaSpacing: { default: { top: "none", right: "none", bottom: "none", left: "none" }, options: [{ key: "none", displayName: "None" }] },
      } }],
    },
  } as WebsiteSection;
}

function venue(template: "classic" | "modern", placement: "top" | "bottom" | "left" | "right" = "left", text = "Garden Pavilion"): WebsiteSection {
  const presentation = template === "classic" ? "detailsFirst" : "editorial";
  return {
    ...section("venue", "venue", { heading: "Venue", name: text, address: text, description: text, media: { assetId: "image", focalPoint: { x: 0.2, y: 0.8 }, zoom: 1.4 } }),
    appearance: { ...appearance, presentation, mediaPlacement: placement, mediaSize: "balanced", mediaContentGap: "comfortable", mediaSpacing: { top: "none", right: "none", bottom: "none", left: "none" } },
    mediaCapability: { mode: "single" },
    presentationCapability: {
      default: presentation,
      options: [{ key: presentation, displayName: presentation, description: "Venue", preview: "contained", mediaControls: {
        mediaPlacements: { default: placement, options: ["top", "bottom", "left", "right"].map((key) => ({ key, displayName: key })) },
        mediaSizes: { default: "balanced", options: [{ key: "balanced", displayName: "Balanced" }] },
        mediaContentGaps: { default: "comfortable", options: [{ key: "comfortable", displayName: "Comfortable" }] },
        mediaSpacing: { default: { top: "none", right: "none", bottom: "none", left: "none" }, options: [{ key: "none", displayName: "None" }] },
      } }],
    },
  } as WebsiteSection;
}

function people(template: "classic" | "modern", groupCount = 2, peoplePerGroup = 3, presentation?: string): WebsiteSection {
  const selectedPresentation = presentation ?? (template === "classic" ? "portraitCards" : "editorialPortraits");
  return {
    ...section("people", "people", {
      heading: "Wedding Party",
      groups: Array.from({ length: groupCount }, (_, groupIndex) => ({
        id: `group-${groupIndex}`,
        name: `Group ${groupIndex + 1}`,
        people: Array.from({ length: peoplePerGroup }, (_, personIndex) => ({
          id: `person-${groupIndex}-${personIndex}`,
          name: `Person ${groupIndex + 1}-${personIndex + 1}`,
          role: "Wedding party role",
          media: { assetId: "image", focalPoint: { x: 0.25, y: 0.75 }, zoom: 1.3 },
        })),
      })),
    }),
    appearance: { ...appearance, presentation: selectedPresentation },
    itemMediaCapability: { itemType: "person" },
  } as WebsiteSection;
}

describe("Section renderer boundary", () => {
  it.each(["classic", "modern"] as const)("keeps the %s surface and ordinary content boundary free of Section padding", (template) => {
    const markup = render(template, [section("rsvp", "rsvp", { heading: "RSVP", description: "Join us", buttonLabel: "Reply" })]);
    expect(markup).toContain('data-preview-section="rsvp"');
    expect(markup).toContain("data-section-surface");
    expect(markup).toContain("data-section-content-inset");
    const boundaryClass = markup.match(/data-section-content-inset="true" class="([^"]*)"/)?.[1] ?? "";
    expect(boundaryClass).not.toMatch(/(?:^|\s)(?:p|px|py|pt|pr|pb|pl)-/);
  });

  it.each(["classic", "modern"] as const)("keeps %s immersive Hero media outside the ordinary content inset", (template) => {
    const markup = render(template, [hero()]);
    expect(markup).toContain("data-section-full-bleed");
    expect(markup).toContain("data-section-full-bleed-foreground");
    expect(markup).toContain("data-hero-foreground-inset");
    expect(markup).not.toContain("data-section-content-inset");
    expect(markup.indexOf("data-section-full-bleed")).toBeLessThan(markup.indexOf("data-hero-foreground-inset"));
  });

  it.each(["classic", "modern"] as const)("uses safe viewport height for %s immersive Hero on every semantic viewport", (template) => {
    for (const viewport of ["desktop", "tablet", "mobile"] as const) {
      const markup = render(template, [hero()], viewport);
      expect(markup).toContain("min-h-[100svh]");
      expect(markup).not.toContain("min-h-screen");
    }
  });

  it.each(["classic", "modern"] as const)("does not make %s contained Hero viewport-height", (template) => {
    const markup = render(template, [containedHero(template)]);
    expect(markup).not.toContain("min-h-[100svh]");
    expect(markup).not.toContain("min-h-screen");
  });

  it("keeps Modern mobile vertical Hero seam spacing separate from media spacing", () => {
    const top = render("modern", [containedHero("modern", "top")], "mobile");
    const bottom = render("modern", [containedHero("modern", "bottom")], "mobile");
    expect(top).toContain('data-hero-vertical-composition="top"');
    expect(top).toContain("[&amp;_[data-section-specialized-content]]:pt-0");
    expect(bottom).toContain('data-hero-vertical-composition="bottom"');
    expect(bottom).toContain("[&amp;_[data-section-specialized-content]]:pb-0");
    expect(top).not.toMatch(/data-media-focal-x="[^"]+"[^>]*\bpt-/);
    expect(bottom).not.toMatch(/data-media-focal-x="[^"]+"[^>]*\bpb-/);
    expect(top).toContain("transform:translateX(0rem)");
  });

  it.each(["classic", "modern"] as const)("preserves %s Hero focal point and zoom in editor and public output", (template) => {
    const value = hero();
    value.content = { ...(value.content as object), media: { assetId: "image", focalPoint: { x: 0.2, y: 0.8 }, zoom: 1.4 } } as never;
    for (const mode of ["editor", "public"] as const) {
      const markup = render(template, [value], "mobile", mode);
      expect(markup).toContain('data-media-focal-x="0.2"');
      expect(markup).toContain('data-media-focal-y="0.8"');
      expect(markup).toContain('data-media-zoom="1.4"');
      expect(markup).toContain("absolute inset-0");
      expect(markup).not.toContain("100vw");
    }
  });

  it.each(["classic", "modern"] as const)("renders %s Sections in persisted array order", (template) => {
    const markup = render(template, [
      section("rsvp", "second", { heading: "RSVP", description: "", buttonLabel: "Reply" }),
      section("date", "first", { heading: "Date", description: "" }),
    ]);
    expect(markup.indexOf('data-preview-section="second"')).toBeLessThan(markup.indexOf('data-preview-section="first"'));
  });

  it("keeps Modern inherited appearance stable across persisted-order indices", () => {
    const library = { colors: [], fontFamilies: [], palettePresets: [], typographyPresets: [] } as never;
    const first = resolveModernEditorialSectionAppearance("date", appearance, 0, library, []);
    const second = resolveModernEditorialSectionAppearance("date", appearance, 1, library, []);
    expect(first.sectionClass).toContain("bg-[var(--me-surface)]");
    expect(first.sectionClass).toContain("text-left");
    expect(second.sectionClass).toContain("bg-[var(--me-surface)]");
    expect(second.sectionClass).toContain("text-left");
  });

  it("keeps Classic inherited background stable across reorder and neighboring visibility changes", () => {
    const library = { colors: [], fontFamilies: [], palettePresets: [], typographyPresets: [] } as never;
    const design = { colorTheme: "terracotta", fontSet: "editorial", artStyle: "clean", projectDefaults: {}, customColors: [] };
    const before = resolveClassicFilipinianaSectionAppearance("date", design, appearance, 0, library, []);
    const afterReorderOrVisibilityChange = resolveClassicFilipinianaSectionAppearance("date", design, appearance, 7, library, []);
    expect(afterReorderOrVisibilityChange.sectionClass).toBe(before.sectionClass);
  });

  it.each(["classic", "modern"] as const)("keeps %s Date and Dress Code markup identical for absent and specialized-only child flow", (template) => {
    for (const [type, content] of [
      ["date", { heading: "When", description: "At noon" }],
      ["dressCode", { heading: "Attire", description: "Formal" }],
    ] as const) {
      const withoutFlow = render(template, [section(type, type, content)]);
      const specializedOnly = render(template, [section(type, type, { ...content, childFlow: { elements: [], order: [{ kind: "specialized", key: "content" }] } })]);
      expect(specializedOnly).toBe(withoutFlow);
      expect(withoutFlow).not.toContain("data-section-root-flow");
    }
  });

  it.each(["classic", "modern"] as const)("uses a gapless %s root flow and authoritative Text/specialized/Text order", (template) => {
    const childFlow = {
      elements: [
        { id: "before", type: "text", text: "Before content", appearance: {} },
        { id: "after", type: "text", text: "After content", appearance: {} },
      ],
      order: [
        { kind: "element", id: "before" },
        { kind: "specialized", key: "content" },
        { kind: "element", id: "after" },
      ],
    };
    const markup = render(template, [section("date", "date", { heading: "Specialized content", description: "At noon", childFlow })]);
    expect(markup).toContain("data-section-root-flow");
    expect(markup).toContain('data-section-root-flow="true" class="flex flex-col"');
    expect(markup).not.toMatch(/data-section-root-flow="true" class="[^"]*\bgap-/);
    expect(markup.indexOf("Before content")).toBeLessThan(markup.indexOf("Specialized content"));
    expect(markup.indexOf("Specialized content")).toBeLessThan(markup.indexOf("After content"));
    expect(markup).toMatch(/style="[^"]*margin:0;padding:0;/);
  });

  it.each(["classic", "modern"] as const)("isolates %s emphasis spacing from Date generic children", (template) => {
    const childFlow = { elements: [{ id: "group", type: "compositionGroup", children: [], layout: { width: "full", padding: { top: "none", right: "none", bottom: "none", left: "none" } } }], order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "group" }] };
    const emphasized = { ...section("date", "date", { heading: "Date", description: "At noon", childFlow }), appearance: { ...appearance, emphasis: "featured" as const } };
    const markup = render(template, [emphasized]);
    expect(markup).toContain("data-section-specialized-content");
    expect(markup).toContain("data-section-generic-child");
    expect(markup).not.toContain("[&amp;_[data-section-content]]:py-");
  });

  it.each(["classic", "modern"] as const)("keeps %s Date and Dress Code ordering authoritative at every viewport", (template) => {
    const cases = [
      {
        order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "a" }, { kind: "element", id: "b" }],
        expected: ["Specialized", "First", "Second"],
      },
      {
        order: [{ kind: "element", id: "a" }, { kind: "element", id: "b" }, { kind: "specialized", key: "content" }],
        expected: ["First", "Second", "Specialized"],
      },
    ] as const;
    for (const type of ["date", "dressCode"] as const) {
      for (const viewport of ["mobile", "tablet", "desktop"] as const) {
        for (const { order, expected } of cases) {
          const markup = render(template, [section(type, type, {
            heading: "Specialized",
            description: "Formal",
            childFlow: {
              elements: [{ id: "a", type: "text", text: "First", appearance: {} }, { id: "b", type: "text", text: "Second", appearance: {} }],
              order,
            },
          })], viewport);
          const positions = expected.map((value) => markup.indexOf(value));
          expect(positions).toEqual([...positions].sort((a, b) => a - b));
        }
      }
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Date and Dress Code specialized width separate from Group width and padding", (template) => {
    for (const type of ["date", "dressCode"] as const) {
      const childFlow = {
        elements: [{
          id: "group",
          type: "compositionGroup",
          children: [],
          layout: { width: "full", gap: "l", padding: { top: "l", right: "s", bottom: "m", left: "xs" } },
        }],
        order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "group" }],
      };
      const markup = render(template, [section(type, type, { heading: "Specialized", description: "Formal", childFlow })]);
      const specializedTag = markup.match(/<div data-section-specialized-content[^>]*>/)?.[0] ?? "";
      const genericTag = markup.match(/<div data-section-generic-child[^>]*>/)?.[0] ?? "";
      expect(specializedTag).toMatch(/max-w-/);
      expect(specializedTag).toContain("px-5");
      expect(genericTag).not.toMatch(/max-w-|\b(?:p|px|py|pt|pr|pb|pl)-/);
      expect(markup).toContain("width:100%;max-width:100%");
      expect(markup).toContain("padding-top:1.5rem");
      expect(markup).toContain("padding-right:0.5rem");
    }
  });

  it.each(["classic", "modern"] as const)("supports independent %s Date and Dress Code heading/body alignment", (template) => {
    for (const type of ["date", "dressCode"] as const) {
      for (const alignment of ["left", "center", "right"] as const) {
        const value = section(type, type, { heading: "Heading", description: "Body" });
        value.appearance = { ...appearance, headingAlignment: alignment, bodyAlignment: alignment };
        const markup = render(template, [value]);
        const surfaceTag = markup.match(/<section[^>]*data-preview-section[^>]*>/)?.[0] ?? "";
        expect(surfaceTag).toContain(`[&amp;_[data-section-heading]]:text-${alignment}`);
        expect(surfaceTag).toContain(`[&amp;_[data-section-body]]:text-${alignment}`);
      }
    }
  });

  it.each(["classic", "modern"] as const)("isolates every supported %s Date and Dress Code generic child kind", (template) => {
    const elements = [
      { id: "text", type: "text", text: "Plain text", appearance: {} },
      { id: "rich", type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Rich text" }] }] }, appearance: {} },
      { id: "divider", type: "divider", appearance: {} },
      { id: "media", type: "media", items: [], presentation: { width: "full" }, appearance: {} },
      { id: "group", type: "compositionGroup", children: [], layout: { width: "full" } },
    ];
    const order = [
      { kind: "element", id: "text" },
      { kind: "element", id: "rich" },
      { kind: "specialized", key: "content" },
      { kind: "element", id: "divider" },
      { kind: "element", id: "media" },
      { kind: "element", id: "group" },
    ];
    for (const type of ["date", "dressCode"] as const) {
      const markup = render(template, [section(type, type, { heading: "Specialized", description: "Body", childFlow: { elements, order } })]);
      expect(markup.match(/data-section-generic-child/g)).toHaveLength(elements.length);
      for (const element of elements) expect(markup).toContain(`data-section-child-element="${element.id}"`);
      const positions = ["Plain text", "Rich text", "Specialized"].map((text) => markup.indexOf(text));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Date and Dress Code long content wrap-safe in editor and public output", (template) => {
    const longText = "A-very-long-unbroken-celebration-detail-".repeat(16);
    for (const type of ["date", "dressCode"] as const) {
      for (const mode of ["editor", "public"] as const) {
        const markup = render(template, [section(type, type, { heading: longText, description: longText })], "mobile", mode);
        const specializedTag = markup.match(/<div data-section-specialized-content[^>]*>/)?.[0] ?? "";
        expect(markup).toContain("break-words");
        expect(specializedTag).not.toContain("100vw");
        expect(specializedTag).not.toMatch(/\bwhitespace-nowrap\b/);
      }
    }
  });

  it.each(["classic", "modern"] as const)("preserves %s Date and Dress Code flow structure between editor and public output", (template) => {
    for (const type of ["date", "dressCode"] as const) {
      const childFlow = {
        elements: [{ id: "before", type: "text", text: "Before", appearance: {} }, { id: "after", type: "text", text: "After", appearance: {} }],
        order: [{ kind: "element", id: "before" }, { kind: "specialized", key: "content" }, { kind: "element", id: "after" }],
      };
      for (const viewport of ["mobile", "tablet", "desktop"] as const) {
        const publicMarkup = render(template, [section(type, type, { heading: "Specialized", description: "Body", childFlow })], viewport, "public");
        const editorMarkup = render(template, [section(type, type, { heading: "Specialized", description: "Body", childFlow })], viewport, "editor");
        for (const markup of [publicMarkup, editorMarkup]) {
          expect(markup).toContain("data-section-root-flow");
          expect(markup).toContain("data-section-specialized-content");
          expect(markup.match(/data-section-generic-child/g)).toHaveLength(2);
          expect(markup.indexOf("Before")).toBeLessThan(markup.indexOf("Specialized"));
          expect(markup.indexOf("Specialized")).toBeLessThan(markup.indexOf("After"));
        }
      }
    }
  });

  it.each(["classic", "modern"] as const)("uses canonical, safe %s Schedule tracks and responsive rhythm", (template) => {
    const markup = render(template, [section("schedule", "schedule", {
      heading: "Schedule",
      items: [{ time: "4:30 PM", title: "Ceremony", description: "Garden" }],
    })]);
    const row = markup.match(/<li class="([^"]*)"/)?.[1] ?? "";
    expect(row).toContain("min-w-0");
    expect(row).toContain("minmax(0,1fr)");
    expect(row).toContain("md:grid-cols-");
    expect(row).toContain("xl:grid-cols-");
    expect(row).toContain("py-4");
    expect(row).toContain("md:py-5");
    expect(row).toContain("xl:py-6");
    expect(row).not.toMatch(/\bsm:(?:grid|gap|p[trblxy]?)-/);
    expect(row).not.toMatch(/\b(?:h|min-h|max-h)-/);
  });

  it.each(["classic", "modern"] as const)("keeps %s Schedule long content wrap-safe without viewport-width calculations", (template) => {
    const long = "https://example.test/averylongunbrokenlocationsegment".repeat(8);
    const markup = render(template, [section("schedule", "schedule", {
      heading: long,
      items: [{ time: `10:30AM-${long}`, title: long, description: `Reception location: ${long}` }],
    })], "mobile");
    expect(markup.match(/break-words/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(markup).toContain("overflow-wrap:anywhere");
    expect(markup).not.toContain("whitespace-nowrap");
    expect(markup).not.toContain("100vw");
    expect(markup).not.toContain("w-screen");
    expect(markup).not.toMatch(/w-\[calc\(/);
  });

  it.each(["classic", "modern"] as const)("keeps %s Schedule rules aligned to content-driven rows", (template) => {
    const markup = render(template, [section("schedule", "schedule", {
      heading: "Schedule",
      items: [
        { time: "Morning through late afternoon", title: "A title that wraps across several lines", description: "A description that also wraps naturally." },
        { time: "Evening", title: "Dinner", description: "Reception" },
      ],
    })]);
    const rows = [...markup.matchAll(/<li class="([^"]*)"/g)].map((match) => match[1]);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toContain("border-t");
      expect(row).not.toMatch(/\babsolute\b|\bfixed\b/);
    }
  });

  it.each(["classic", "modern"] as const)("preserves %s Schedule geometry in editor and public rendering", (template) => {
    const value = section("schedule", "schedule", {
      heading: "Schedule",
      items: [{ time: "4:30 PM", title: "Ceremony", description: "Garden" }],
    });
    for (const viewport of ["mobile", "tablet", "desktop"] as const) {
      const editor = render(template, [value], viewport, "editor");
      const published = render(template, [value], viewport, "public");
      const editorRow = editor.match(/<li class="([^"]*)"/)?.[1];
      const publicRow = published.match(/<li class="([^"]*)"/)?.[1];
      expect(editorRow).toBe(publicRow);
      expect(editor).toContain("!text-left");
      expect(published).toContain("!text-left");
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Schedule heading alignment responsive without changing its internal rail", (template) => {
    for (const alignment of ["left", "center", "right"] as const) {
      const value = section("schedule", "schedule", { heading: "Schedule", items: [{ time: "Noon", title: "Lunch", description: "Garden" }] });
      value.appearance = { ...appearance, headingAlignment: alignment, bodyAlignment: alignment };
      const markup = render(template, [value]);
      const surface = markup.match(/<section[^>]*data-preview-section[^>]*>/)?.[0] ?? "";
      expect(surface).toContain(`[&amp;_[data-section-heading]]:text-${alignment}`);
      expect(markup).toContain("!text-left");
    }
  });

  it.each(["classic", "modern"] as const)("stacks %s Venue media safely on Mobile and uses safe split tracks above 768", (template) => {
    for (const placement of ["left", "right"] as const) {
      const mobile = render(template, [venue(template, placement)], "mobile");
      expect(mobile).toContain('data-venue-composition="stacked"');
      expect(mobile).toContain("aspect-[4/3] max-h-[24rem] object-cover");
      expect(mobile).not.toMatch(/data-venue-composition="stacked"[^>]*grid-cols-/);
      expect(mobile).not.toContain("min-h-[28rem]");
      expect(mobile).not.toContain("min-h-[24rem]");
      for (const viewport of ["tablet", "desktop"] as const) {
        const markup = render(template, [venue(template, placement)], viewport);
        const composition = markup.match(/<div data-venue-composition="split"[^>]*>/)?.[0] ?? "";
        expect(composition).toContain("minmax(0,");
        expect(composition).toContain("min-w-0");
      }
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Venue long names, addresses, and descriptions wrap-safe", (template) => {
    const long = "OneExtremelyLongUnbrokenVenueOrAddressToken".repeat(12);
    const markup = render(template, [venue(template, "left", `${long}\n${long}`)], "mobile");
    expect(markup.match(/break-words/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(markup).toContain("overflow-wrap:anywhere");
    expect(markup).toContain("whitespace-pre-line");
    expect(markup).not.toContain("whitespace-nowrap");
    expect(markup).not.toContain("100vw");
    expect(markup).not.toContain("w-screen");
    expect(markup).not.toMatch(/w-\[calc\(/);
  });

  it.each(["classic", "modern"] as const)("preserves %s Venue focal point, zoom, and frame geometry in editor/public output", (template) => {
    for (const mode of ["editor", "public"] as const) {
      const markup = render(template, [venue(template)], "mobile", mode);
      expect(markup).toContain('data-media-focal-x="0.2"');
      expect(markup).toContain('data-media-focal-y="0.8"');
      expect(markup).toContain('data-media-zoom="1.4"');
      expect(markup).toContain('data-venue-composition="stacked"');
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Venue text alignment scoped away from media composition", (template) => {
    for (const alignment of ["left", "center", "right"] as const) {
      const value = venue(template);
      value.appearance = { ...value.appearance, headingAlignment: alignment, bodyAlignment: alignment };
      const markup = render(template, [value], "tablet");
      const surface = markup.match(/<section[^>]*data-preview-section[^>]*>/)?.[0] ?? "";
      expect(surface).toContain(`[&amp;_[data-section-heading]]:text-${alignment}`);
      expect(surface).toContain(`[&amp;_[data-section-body]]:text-${alignment}`);
      expect(markup.match(/<div data-venue-composition="split"[^>]*>/)?.[0]).not.toContain(`text-${alignment}`);
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Venue responsive geometry identical in editor and public modes", (template) => {
    for (const viewport of ["mobile", "tablet", "desktop"] as const) {
      const editor = render(template, [venue(template, "right")], viewport, "editor");
      const published = render(template, [venue(template, "right")], viewport, "public");
      const marker = viewport === "mobile" ? "stacked" : "split";
      expect(editor.match(new RegExp(`<div data-venue-composition="${marker}"[^>]*>`))?.[0]).toBe(published.match(new RegExp(`<div data-venue-composition="${marker}"[^>]*>`))?.[0]);
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s People groups and person cards single-column on Mobile", (template) => {
    const markup = render(template, [people(template)], "mobile");
    const groups = markup.match(/<div data-people-groups[^>]*>/)?.[0] ?? "";
    const lists = [...markup.matchAll(/<ul data-people-list[^>]*>/g)].map((match) => match[0]);
    expect(groups).not.toMatch(/(?:^|\s)grid-cols-2/);
    expect(groups).toContain("md:grid-cols-2");
    expect(lists).toHaveLength(2);
    for (const list of lists) {
      expect(list).toContain("grid-cols-1");
      expect(list).toContain("xl:grid-cols-2");
      expect(list).not.toMatch(/(?:^|\s)grid-cols-2/);
    }
  });

  it.each(["classic", "modern"] as const)("uses readable %s People card density at Tablet and Desktop", (template) => {
    for (const viewport of ["tablet", "desktop"] as const) {
      const markup = render(template, [people(template)], viewport);
      const groups = markup.match(/<div data-people-groups[^>]*>/)?.[0] ?? "";
      expect(groups).toContain("md:grid-cols-2");
      expect(groups).not.toContain("sm:grid-cols");
      expect(groups).not.toContain("lg:grid-cols");
      expect(markup).toContain("min-w-0");
    }
  });

  it.each(["classic", "modern"] as const)("balances %s People group counts from one through five", (template) => {
    for (const count of [1, 2, 3, 4, 5]) {
      const markup = render(template, [people(template, count, 1)], "desktop");
      expect(markup.match(/data-people-group="true"/g)).toHaveLength(count);
      const groups = markup.match(/<div data-people-groups[^>]*>/)?.[0] ?? "";
      if (count === 1) expect(groups).not.toContain("md:grid-cols-2");
      if (count > 1 && count % 2 === 1) {
        const cards = [...markup.matchAll(/<section data-people-group[^>]*>/g)];
        expect(cards.at(-1)?.[0]).toContain("md:col-span-2");
        expect(cards.at(-1)?.[0]).toContain("md:mx-auto");
      }
    }
  });

  it.each(["classic", "modern"] as const)("renders %s People counts from one through five without empty card tracks", (template) => {
    for (const count of [1, 2, 3, 4, 5]) {
      const markup = render(template, [people(template, 1, count)], "mobile");
      expect(markup.match(/data-person-card="true"/g)).toHaveLength(count);
      const list = markup.match(/<ul data-people-list[^>]*>/)?.[0] ?? "";
      expect(list).toContain("grid-cols-1");
      expect(list).not.toMatch(/(?:^|\s)grid-cols-[2-9]/);
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s People names, roles, and group headings wrap-safe", (template) => {
    const value = people(template, 1, 1);
    const long = "ExtremelyLongUnbrokenWeddingPartyNameOrRole".repeat(10);
    const content = value.content as { heading: string; groups: Array<{ name: string; people: Array<{ name: string; role: string }> }> };
    content.heading = long;
    content.groups[0].name = long;
    content.groups[0].people[0].name = long;
    content.groups[0].people[0].role = long;
    const markup = render(template, [value], "mobile");
    expect(markup.match(/break-words/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(markup).toContain("overflow-wrap:anywhere");
    expect(markup).not.toContain("whitespace-nowrap");
    expect(markup).not.toContain("100vw");
    expect(markup).not.toContain("w-screen");
    expect(markup).not.toMatch(/w-\[calc\(/);
  });

  it("resets Modern People minimal card splits and editorial offsets on Mobile", () => {
    const mobile = render("modern", [people("modern", 2, 2, "minimal")], "mobile");
    expect(mobile).toContain("grid-cols-1");
    expect(mobile).toContain("md:grid-cols-[4rem_minmax(0,1fr)]");
    expect(mobile).not.toContain("md:translate-y-8");
    expect(mobile).toContain("xl:translate-y-8");
  });

  it.each(["classic", "modern"] as const)("preserves %s People crop, focal point, and zoom", (template) => {
    const markup = render(template, [people(template, 1, 1)], "mobile");
    expect(markup).toMatch(/aspect-(?:square|\[4\/5\])/);
    expect(markup).toContain("object-cover");
    expect(markup).toContain('data-media-focal-x="0.25"');
    expect(markup).toContain('data-media-focal-y="0.75"');
    expect(markup).toContain('data-media-zoom="1.3"');
  });

  it.each(["classic", "modern"] as const)("keeps %s People alignment scoped away from grid geometry", (template) => {
    for (const alignment of ["left", "center", "right"] as const) {
      const value = people(template, 2, 2);
      value.appearance = { ...value.appearance, headingAlignment: alignment, bodyAlignment: alignment };
      const markup = render(template, [value], "tablet");
      const surface = markup.match(/<section[^>]*data-preview-section[^>]*>/)?.[0] ?? "";
      const grid = markup.match(/<div data-people-groups[^>]*>/)?.[0] ?? "";
      expect(surface).toContain(`[&amp;_[data-section-heading]]:text-${alignment}`);
      expect(surface).toContain(`[&amp;_[data-section-body]]:text-${alignment}`);
      expect(grid).not.toContain(`text-${alignment}`);
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s People geometry identical in editor and public modes", (template) => {
    for (const viewport of ["mobile", "tablet", "desktop"] as const) {
      const value = people(template, 3, 2);
      const editor = render(template, [value], viewport, "editor");
      const published = render(template, [value], viewport, "public");
      expect(editor.match(/<div data-people-groups[^>]*>/)?.[0]).toBe(published.match(/<div data-people-groups[^>]*>/)?.[0]);
      expect(editor.match(/<ul data-people-list[^>]*>/)?.[0]).toBe(published.match(/<ul data-people-list[^>]*>/)?.[0]);
    }
  });
});
