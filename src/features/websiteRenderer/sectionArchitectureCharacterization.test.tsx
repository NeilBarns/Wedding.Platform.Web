import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WebsiteDraft, WebsiteSection } from "../websiteEditor/types";
import { ClassicFilipinianaRenderer } from "./templates/ClassicFilipinianaRenderer";
import { ModernEditorialRenderer } from "./templates/ModernEditorialRenderer";
import { resolveModernEditorialSectionAppearance } from "./templates/modernEditorial/appearance";

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

function render(template: "classic" | "modern", sections: WebsiteSection[], viewport: "desktop" | "mobile" = "desktop") {
  const templateKey = template === "classic" ? "classic-filipiniana-v1" : "modern-editorial-v1";
  const Renderer = template === "classic" ? ClassicFilipinianaRenderer : ModernEditorialRenderer;
  return renderToStaticMarkup(<Renderer event={event} website={draft(templateKey, sections)} targetViewport={viewport} />);
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

  it("preserves Classic immersive Hero viewport-relative height on desktop and mobile", () => {
    expect(render("classic", [hero()], "desktop")).toContain("min-h-screen");
    expect(render("classic", [hero()], "mobile")).toContain("min-h-[100svh]");
  });

  it.each(["classic", "modern"] as const)("renders %s Sections in persisted array order", (template) => {
    const markup = render(template, [
      section("rsvp", "second", { heading: "RSVP", description: "", buttonLabel: "Reply" }),
      section("date", "first", { heading: "Date", description: "" }),
    ]);
    expect(markup.indexOf('data-preview-section="second"')).toBeLessThan(markup.indexOf('data-preview-section="first"'));
  });

  it("characterizes Modern inherited appearance as persisted-order index dependent", () => {
    const library = { colors: [], fontFamilies: [], palettePresets: [], typographyPresets: [] } as never;
    const first = resolveModernEditorialSectionAppearance("date", appearance, 0, library, []);
    const second = resolveModernEditorialSectionAppearance("date", appearance, 1, library, []);
    expect(first.sectionClass).toContain("bg-[var(--me-page)]");
    expect(first.sectionClass).toContain("text-left");
    expect(second.sectionClass).toContain("bg-[var(--me-surface)]");
    expect(second.sectionClass).toContain("text-right");
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
    expect(markup).toContain('style="margin:0;padding:0;');
  });

  it.each([
    [[{ kind: "specialized", key: "content" }, { kind: "element", id: "a" }, { kind: "element", id: "b" }], ["Specialized", "First", "Second"]],
    [[{ kind: "element", id: "a" }, { kind: "element", id: "b" }, { kind: "specialized", key: "content" }], ["First", "Second", "Specialized"]],
  ] as const)("renders each persisted child ordering without inference", (order, expected) => {
    const markup = render("classic", [section("dressCode", "dress", {
      heading: "Specialized", description: "Formal",
      childFlow: { elements: [{ id: "a", type: "text", text: "First", appearance: {} }, { id: "b", type: "text", text: "Second", appearance: {} }], order },
    })]);
    expect(expected.map((value) => markup.indexOf(value))).toEqual([...expected].map((value) => markup.indexOf(value)).sort((a, b) => a - b));
  });
});
