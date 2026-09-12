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

function hero(height: "auto" | "screen" = "screen"): WebsiteSection {
  return {
    ...section("hero", "hero", { backgroundMedia: { assetId: "image" }, childFlow: { elements: [{ id: "text", type: "text", editorName: "Text 1", document: { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Alex & Sam"  }] }] }}], order: [{ kind: "element", id: "text" }] } }),
    appearance: { ...appearance, ...(height === "screen" ? { height } : {}) },
    mediaCapability: { mode: "single" },
    presentationCapability: null,
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
    expect(markup).toContain("data-hero-background-image");
    expect(markup).toContain("data-hero-foreground");
    expect(markup).not.toContain("data-section-content-inset");
    expect(markup.indexOf("data-section-full-bleed")).toBeLessThan(markup.indexOf("data-hero-foreground"));
  });

  it.each(["classic", "modern"] as const)("lets a zero-spacing full-width root Group reach every %s Hero edge in editor and public", (template) => {
    const value = hero();
    const group = {
      id: "edge-group",
      type: "compositionGroup" as const,
      editorName: "Group 1",
      children: [{ id: "edge-text", type: "text" as const, editorName: "Text 1", document: { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Edge content"  }] }] }}],
      layout: { width: "full" as const, gap: "none" as const, padding: { top: "none" as const, right: "none" as const, bottom: "none" as const, left: "none" as const } },
    };
    value.content = { backgroundMedia: { assetId: "image" }, childFlow: { elements: [group], order: [{ kind: "element", id: group.id }] } };

    for (const viewport of ["desktop", "tablet", "mobile"] as const) {
      for (const mode of ["editor", "public"] as const) {
        const markup = render(template, [value], viewport, mode);
        const foregroundClass = markup.match(/data-hero-foreground="true" class="([^"]*)"/)?.[1] ?? "";
        expect(foregroundClass).not.toMatch(/(?:^|\s)(?:p|px|py|pt|pr|pb|pl)-/);
        expect(markup).toContain('data-section-root-flow="true"');
        expect(markup).toMatch(/data-website-element="group"[^>]*style="[^"]*padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;[^"]*width:100%;max-width:100%/);
      }
    }
  });

  it.each(["classic", "modern"] as const)("keeps authored Group padding as the %s Hero inset owner", (template) => {
    const value = hero();
    const group = {
      id: "inset-group",
      type: "compositionGroup" as const,
      editorName: "Group 1",
      children: [{ id: "inset-text", type: "text" as const, editorName: "Text 1", document: { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Inset content"  }] }] }}],
      layout: { width: "full" as const, padding: { top: "l" as const, right: "m" as const, bottom: "s" as const, left: "xl" as const } },
    };
    value.content = { backgroundMedia: { assetId: "image" }, childFlow: { elements: [group], order: [{ kind: "element", id: group.id }] } };

    for (const mode of ["editor", "public"] as const) {
      const markup = render(template, [value], "mobile", mode);
      expect(markup).toMatch(/data-website-element="group"[^>]*style="[^"]*padding-top:1\.5rem;padding-right:1rem;padding-bottom:0\.5rem;padding-left:2rem/);
    }
  });

  it.each(["classic", "modern"] as const)("uses shared %s Section decorations for Blank in editor and public output", (template) => {
    const value = section("blank", "blank", { childFlow: { elements: [], order: [] } });
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
    }
  });

  it.each(["classic", "modern"] as const)("uses safe viewport height for %s immersive Hero on every semantic viewport", (template) => {
    for (const viewport of ["desktop", "tablet", "mobile"] as const) {
      const markup = render(template, [hero()], viewport);
      expect(markup).toContain("min-h-[100svh]");
      expect(markup).not.toContain("min-h-screen");
    }
  });

  it.each(["classic", "modern"] as const)("does not make %s automatic Hero viewport-height", (template) => {
    const markup = render(template, [hero("auto")]);
    expect(markup).not.toContain("min-h-[100svh]");
    expect(markup).not.toContain("min-h-screen");
  });

  it.each(["classic", "modern"] as const)("keeps %s screen height without resolved background media", (template) => {
    const value = hero();
    value.content = { ...(value.content as object), backgroundMedia: null } as never;
    const markup = render(template, [value]);
    expect(markup).toContain("data-hero-shell");
    expect(markup).toContain("min-h-[100svh]");
    expect(markup).not.toContain("data-hero-background-image");
  });

  it.each(["classic", "modern"] as const)("applies sparse %s Hero image opacity to the image layer only", (template) => {
    for (const opacity of [0, 45, 100]) {
      const value = hero();
      value.appearance = { ...value.appearance, backgroundImageOpacity: opacity };
      const markup = render(template, [value]);
      expect(markup).toContain(`data-hero-background-image="true" class="pointer-events-none absolute inset-0" style="opacity:${opacity / 100}"`);
    }
  });

  it.each(["classic", "modern"] as const)("keeps %s Hero background zero-inset at every semantic width", (template) => {
    for (const viewport of ["desktop", "tablet", "mobile"] as const) {
      const markup = render(template, [hero()], viewport);
      expect(markup).toContain('data-hero-shell="true"');
      expect(markup).toMatch(/data-hero-background-image="true" class="pointer-events-none absolute inset-0"/);
    }
  });

  it.each(["classic", "modern"] as const)("preserves %s Hero focal point and zoom in editor and public output", (template) => {
    const value = hero();
    value.content = { ...(value.content as object), backgroundMedia: { assetId: "image", focalPoint: { x: 0.2, y: 0.8 }, zoom: 1.4 } } as never;
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
      { id: "text", type: "text", editorName: "Text 1", document: { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Plain text" }] }] }, appearance: {} },
      { id: "rich", type: "text", editorName: "Text 1", document: { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Rich text" }] }] }, appearance: {} },
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

});
