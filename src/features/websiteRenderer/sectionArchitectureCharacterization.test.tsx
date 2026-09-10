import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WebsiteDraft, WebsiteSection } from "../websiteEditor/types";
import { ClassicFilipinianaRenderer } from "./templates/ClassicFilipinianaRenderer";
import { ModernEditorialRenderer } from "./templates/ModernEditorialRenderer";

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

  it.each(["classic", "modern"] as const)("uses shared %s Section decorations for Story in editor and public output", (template) => {
    const value = section("story", "story", { heading: "Our Story", intro: null, elements: [], mediaFraming: {} });
    value.appearance = {
      ...appearance,
      backgroundTreatment: "custom",
      decorativeAppearance: {
        background: { customColor: "#123456", texture: "paper", pattern: "botanical", overlay: "soft" },
        frame: { style: "fine" },
      },
    };
    for (const mode of ["editor", "public"] as const) {
      const markup = render(template, [value], "desktop", mode);
      expect(markup).toContain("data-section-decoration");
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain("background-color:#123456");
      expect(markup.indexOf("data-section-decoration")).toBeLessThan(markup.indexOf("Our Story"));
    }
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
      section("gallery", "first", { heading: "Gallery", items: [] }),
    ]);
    expect(markup.indexOf('data-preview-section="second"')).toBeLessThan(markup.indexOf('data-preview-section="first"'));
  });

  it.each(["classic", "modern"] as const)("isolates every supported %s Blank generic child kind", (template) => {
    const elements = [
      { id: "text", type: "text", editorName: "Text 1", text: "Plain text", appearance: {} },
      { id: "rich", type: "richText", editorName: "Rich Text 1", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Rich text" }] }] }, appearance: {} },
      { id: "divider", type: "divider", editorName: "Divider 1", appearance: {} },
      { id: "media", type: "media", editorName: "Media 1", items: [], presentation: { width: "full" }, appearance: {} },
      { id: "group", type: "compositionGroup", editorName: "Group 1", children: [], layout: { width: "full" } },
    ];
    const order = [
      { kind: "element", id: "text" },
      { kind: "element", id: "rich" },
      { kind: "element", id: "divider" },
      { kind: "element", id: "media" },
      { kind: "element", id: "group" },
    ];
    const markup = render(template, [section("blank", "blank", { childFlow: { elements, order } })], "desktop", "editor");
    expect(markup.match(/data-section-generic-child/g)).toHaveLength(elements.length);
    for (const element of elements) expect(markup).toContain(`data-section-child-element="${element.id}"`);
    expect(markup.indexOf("Plain text")).toBeLessThan(markup.indexOf("Rich text"));
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
      expect(surface).toContain(`[&amp;_[data-section-specialized-content]_[data-section-heading]]:text-${alignment}`);
      expect(surface).toContain(`[&amp;_[data-section-specialized-content]_[data-section-body]]:text-${alignment}`);
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
