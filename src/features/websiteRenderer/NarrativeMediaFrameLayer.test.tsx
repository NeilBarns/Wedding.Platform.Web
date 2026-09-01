import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ElementCapability, TemplateDesignLibrary } from "../websiteCapabilities/types";
import { DecorativeAssetLayer } from "./DecorativeAssetLayer";
import { NarrativeMediaFrameLayer } from "./NarrativeMediaFrameLayer";
import { applyNarrativeMediaFrameOverrides, NARRATIVE_MEDIA_FRAME_CORNER_SIZES, resolveNarrativeMediaFrame } from "./narrativeMediaAppearance";

const frameStyles: NonNullable<ElementCapability["narrativeBlock"]>["appearance"]["media"]["frameStyles"] = [{ key: "ornamentalCorners", displayName: "Ornamental Corners", supportsColor: true, sizes: ["small", "medium", "large"] }];
const library = { colors: [{ id: "terracotta-accent", displayName: "Accent", value: "#9D5B45" }] } as TemplateDesignLibrary;
const layerProps = { templateKey: "classic-filipiniana-v1", viewport: "desktop" as const, frameStyles, frameColorIds: ["terracotta-accent"], library, projectColors: [] };

describe("Narrative Media Frame infrastructure", () => {
  it("resolves absence, None, and unsupported authored values safely to no frame", () => {
    expect(resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", undefined, [])).toBeNull();
    expect(resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "none", frameStyles)).toBeNull();
    expect(resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "futureFrame", frameStyles)).toBeNull();
    expect(renderToStaticMarkup(<NarrativeMediaFrameLayer {...layerProps} appearance={{ frameStyle: "futureFrame" }} />)).toBe("");
  });

  it("renders image, mask, CSS, and overridden four-corner decorations accessibly", () => {
    const image = renderToStaticMarkup(<DecorativeAssetLayer decoration={{ type: "asset", source: "/frame.png", tint: null, execution: { renderMode: "image", size: "fullFrame" } }} />);
    const mask = renderToStaticMarkup(<DecorativeAssetLayer decoration={{ type: "asset", source: "/frame.svg", tint: "red", execution: { renderMode: "mask", tintToken: "accent" } }} />);
    const css = renderToStaticMarkup(<DecorativeAssetLayer decoration={{ type: "cssFrame", tint: "red", execution: { thickness: "thin", inset: "small", opacity: 1, tintToken: "accent" } }} />);
    const corners = renderToStaticMarkup(<DecorativeAssetLayer decoration={{ type: "asset", source: "/corner.svg", tint: "red", execution: { renderMode: "mask", tintToken: "accent", position: "fourCorners", size: "corners" } }} cornerSizeOverride="77px" />);
    for (const markup of [image, mask, css, corners]) { expect(markup).toContain('aria-hidden="true"'); expect(markup).toContain("pointer-events-none"); }
    expect(image).toContain("background-image");
    expect(mask).toContain("mask-image");
    expect(css).toContain("border-style");
    expect((corners.match(/class="absolute"/g) ?? []).length).toBe(4);
    expect(corners).toContain("width:77px");
  });

  it("keeps registry tint, native size, and fixed opacity when overrides are absent", () => {
    const resolved = resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "ornamentalCorners", frameStyles);
    expect(resolved?.decoration.type).toBe("asset");
    expect(resolved?.decoration.tint).toBe("var(--cf-secondary)");
    expect(resolved?.decoration.execution.opacity).toBe(0.6);
    expect(resolved?.cornerSize).toBeUndefined();
  });

  it("overrides tint with allowed template and owned project colors and falls back for unavailable colors", () => {
    const template = resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "ornamentalCorners", frameStyles, undefined, { frameColorId: "terracotta-accent" }, ["terracotta-accent"], library, []);
    expect(template?.decoration.tint).toBe("#9D5B45");
    expect(template?.decoration.execution.opacity).toBe(0.6);
    const projectColors = [{ id: "project-color-01KED9H9XR7WQBP4JTKP1YYQ3G", value: "#121212" }];
    const project = resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "ornamentalCorners", frameStyles, undefined, { frameColorId: projectColors[0].id }, [], library, projectColors);
    expect(project?.decoration.tint).toBe("#121212");
    const unavailable = resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "ornamentalCorners", frameStyles, undefined, { frameColorId: "missing" }, ["terracotta-accent"], library, projectColors);
    expect(unavailable?.decoration.tint).toBe("var(--cf-secondary)");
  });

  it.each(Object.entries(NARRATIVE_MEDIA_FRAME_CORNER_SIZES))("maps %s to its responsive corner size", (frameSize, expected) => {
    const resolved = resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "ornamentalCorners", frameStyles, undefined, { frameSize: frameSize as "small" | "medium" | "large" });
    expect(resolved?.cornerSize).toBe(expected);
  });

  it("ignores unsupported affordances and Modern gains no frame", () => {
    const unsupported = [{ key: "ornamentalCorners", displayName: "Ornamental Corners" }];
    const resolved = resolveNarrativeMediaFrame("classic-filipiniana-v1", "desktop", "ornamentalCorners", unsupported, undefined, { frameColorId: "terracotta-accent", frameSize: "large" }, ["terracotta-accent"], library, []);
    expect(resolved?.decoration.tint).toBe("var(--cf-secondary)");
    expect(resolved?.cornerSize).toBeUndefined();
    expect(resolveNarrativeMediaFrame("modern-editorial-v1", "desktop", "ornamentalCorners", frameStyles)).toBeNull();
  });

  it("defensively ignores a color override for non-tintable image execution", () => {
    const base = { type: "asset" as const, source: "/frame.png", tint: null, execution: { renderMode: "image" as const, opacity: 0.6, position: "fourCorners" as const } };
    const resolved = applyNarrativeMediaFrameOverrides(base, frameStyles[0], { frameColorId: "terracotta-accent" }, ["terracotta-accent"], library, []);
    expect(resolved.decoration).toEqual(base);
    expect(resolved.decoration.execution.opacity).toBe(0.6);
  });

  it("renders combined color and size through the shared layer", () => {
    const markup = renderToStaticMarkup(<NarrativeMediaFrameLayer {...layerProps} appearance={{ frameStyle: "ornamentalCorners", frameColorId: "terracotta-accent", frameSize: "large" }} />);
    expect(markup).toContain("#9D5B45");
    expect(markup).toContain("width:clamp(60px, 10vw, 140px)");
  });
});
