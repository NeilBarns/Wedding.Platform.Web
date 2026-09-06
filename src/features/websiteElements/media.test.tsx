import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MediaElementRenderer } from "../websiteRenderer/MediaElementRenderer";
import { createMediaElement } from "../websiteEditor/sectionChildFlow";
import { MediaElementEditor } from "../websiteEditor/components/MediaElementEditor";
import { carouselAutoplayStep, carouselIndex, mediaAutoplayAllowed, resolveMediaPresentation, setMediaItems, setMediaPresentationProperty } from "./media";
import { mediaElementSchema } from "./schemas";
import { isPeekGeometryBounded, resolveCarouselStyle, resolvePeekCarouselGeometry, resolvePeekCarouselState } from "./peekCarousel";

const first = "01J00000000000000000000000";
const second = "01J00000000000000000000001";
const images = [{ id: "one", type: "image" as const, mediaId: first, alt: "First" }, { id: "two", type: "image" as const, mediaId: second, alt: "Second" }];

describe("Media element", () => {
  it("creates the sparse empty canonical shape", () => {
    const element = createMediaElement();
    expect(element).toEqual({ id: expect.any(String), type: "media", items: [] });
    expect(mediaElementSchema.parse(element)).toEqual(element);
  });

  it("accepts only one video or up to eight images and rejects gallery-scale state", () => {
    expect(mediaElementSchema.parse({ id: "media", type: "media", items: [{ id: "video", type: "video", url: "https://example.com/video.mp4", controls: true }] })).toBeTruthy();
    expect(() => mediaElementSchema.parse({ id: "media", type: "media", items: [...images, { id: "video", type: "video", url: "https://example.com/a.mp4" }] })).toThrow(/Mixed/);
    expect(() => mediaElementSchema.parse({ id: "media", type: "media", items: Array.from({ length: 9 }, (_, index) => ({ id: `i-${index}`, type: "image", mediaId: first, alt: "Photo" })) })).toThrow();
    for (const mode of ["grid", "masonry", "stack"]) expect(() => mediaElementSchema.parse({ id: "media", type: "media", items: images, presentation: { mode } })).toThrow();
    expect(() => mediaElementSchema.parse({ id: "media", type: "media", items: images, presentation: { mode: "carousel", columns: 3 } })).toThrow();
    expect(() => mediaElementSchema.parse({ id: "media", type: "media", items: images, motion: { type: "fade" } })).toThrow();
  });

  it("accepts stacked for two to five images and rejects invalid content", () => {
    const makeImages = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `item-${index}`, type: "image" as const, mediaId: first, alt: `Photo ${index + 1}` }));
    for (let count = 2; count <= 5; count++) expect(mediaElementSchema.safeParse({ id: "media", type: "media", items: makeImages(count), presentation: { mode: "stacked", stacked: { style: "editorial" } } }).success).toBe(true);
    expect(mediaElementSchema.safeParse({ id: "media", type: "media", items: makeImages(6), presentation: { mode: "stacked" } }).success).toBe(false);
    expect(mediaElementSchema.safeParse({ id: "media", type: "media", items: [{ id: "video", type: "video", url: "https://example.com/video.mp4" }], presentation: { mode: "stacked" } }).success).toBe(false);
    expect(mediaElementSchema.safeParse({ id: "media", type: "media", items: makeImages(8), presentation: { mode: "carousel" } }).success).toBe(true);
    const stacked = mediaElementSchema.parse({ id: "media", type: "media", items: images, presentation: { mode: "stacked", responsive: { mobile: { mode: "stacked" } } } });
    expect(setMediaItems(stacked, [images[0]]).presentation).toMatchObject({ mode: "single", responsive: { mobile: { mode: "single" } } });
  });

  it("accepts Peek, rejects unknown carousel styles, and defaults a missing style to Standard", () => {
    expect(mediaElementSchema.safeParse({ id: "media", type: "media", items: images, presentation: { mode: "carousel", carousel: { style: "peek" } } }).success).toBe(true);
    expect(mediaElementSchema.safeParse({ id: "media", type: "media", items: images, presentation: { mode: "carousel", carousel: { style: "cinematic" } } }).success).toBe(false);
    expect(resolveCarouselStyle()).toBe("standard");
    expect(resolveCarouselStyle("peek")).toBe("peek");
  });

  it("derives stable Peek states at looped and non-looped boundaries", () => {
    expect([0, 1, 2, 3].map((index) => resolvePeekCarouselState(index, 0, 4, true))).toEqual(["active", "next", "hidden", "previous"]);
    expect([0, 1, 2, 3].map((index) => resolvePeekCarouselState(index, 3, 4, true))).toEqual(["next", "hidden", "previous", "active"]);
    expect([0, 1, 2].map((index) => resolvePeekCarouselState(index, 0, 3, false))).toEqual(["active", "next", "hidden"]);
    expect([0, 1, 2].map((index) => resolvePeekCarouselState(index, 2, 3, false))).toEqual(["hidden", "previous", "active"]);
    expect([0, 1].map((index) => resolvePeekCarouselState(index, 0, 2, true))).toEqual(["active", "next"]);
  });

  it("keeps responsive Peek geometry bounded and removes tilt for reduced motion", () => {
    for (const viewport of ["desktop", "tablet", "mobile"] as const) {
      for (const state of ["previous", "active", "next"] as const) expect(isPeekGeometryBounded(resolvePeekCarouselGeometry(state, viewport))).toBe(true);
    }
    expect(resolvePeekCarouselGeometry("previous", "desktop", true).rotation).toBe(0);
    expect(resolvePeekCarouselGeometry("next", "desktop", true).rotation).toBe(0);
    expect(resolvePeekCarouselGeometry("next", "mobile").rotation).toBe(0);
  });

  it("renders stacked images in source order and suppresses a second Polaroid frame", () => {
    const element = mediaElementSchema.parse({ id: "media", type: "media", items: images, presentation: { mode: "stacked", stacked: { style: "polaroid" }, responsive: { mobile: { mode: "stacked" } } }, appearance: { frame: "line", shadow: "strong" } });
    const asset = (id: string, url: string) => ({ id, originalFilename: `${id}.jpg`, width: 100, height: 100, web: { width: 100, height: 100, url } });
    const html = renderToStaticMarkup(<MediaElementRenderer element={element} viewport="mobile" media={{ [first]: asset(first, "/first.jpg"), [second]: asset(second, "/second.jpg") }} />);
    expect(html).toContain('data-media-presentation="stacked"');
    expect(html).toContain('data-stacked-style="polaroid"');
    expect(html.indexOf("/first.jpg")).toBeLessThan(html.indexOf("/second.jpg"));
    expect(html).not.toContain("1px solid currentColor");
    expect(html).toContain("aspect-ratio:4 / 5");
  });

  it("uses independent viewport overrides while keeping alignment and fit global", () => {
    let element = mediaElementSchema.parse({ id: "media", type: "media", items: images, presentation: { mode: "carousel", width: "medium", alignment: "start", fit: "contain", responsive: { tablet: { width: "small" }, mobile: { aspectRatio: "square" } } } });
    expect(resolveMediaPresentation(element, "mobile")).toMatchObject({ width: "medium", aspectRatio: "square", alignment: "start", fit: "contain" });
    element = setMediaPresentationProperty(element, "mobile", "alignment", "end");
    expect(element.presentation?.alignment).toBe("end");
    expect(element.presentation?.responsive?.mobile).not.toHaveProperty("alignment");
  });

  it("renders an accessible carousel without an autoplay live region", () => {
    const element = mediaElementSchema.parse({ id: "media", type: "media", items: images, presentation: { mode: "carousel", carousel: { arrows: true, dots: true, loop: false } } });
    const asset = (id: string, url: string) => ({ id, originalFilename: `${id}.jpg`, width: 100, height: 100, web: { width: 100, height: 100, url } });
    const html = renderToStaticMarkup(<MediaElementRenderer element={element} viewport="desktop" media={{ [first]: asset(first, "/first.jpg"), [second]: asset(second, "/second.jpg") }} />);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('<p data-carousel-position="true" class="sr-only">Photo 1 of 2</p>');
    expect(html).toContain('aria-label="Previous photo"');
    expect(html).not.toContain("aria-live");
    expect(html).not.toContain("grid-template-columns");
    const viewportStart = html.indexOf('data-carousel-viewport="true"');
    const viewportEnd = html.indexOf('<p data-carousel-position', viewportStart);
    expect(html.indexOf('data-carousel-arrows="true"')).toBeGreaterThan(viewportStart);
    expect(html.indexOf('data-carousel-arrows="true"')).toBeLessThan(viewportEnd);
    expect(html.indexOf('data-carousel-dots="true"')).toBeGreaterThan(viewportStart);
    expect(html.indexOf('data-carousel-dots="true"')).toBeLessThan(viewportEnd);
    expect(html.indexOf('data-carousel-dots="true"')).toBeGreaterThan(html.indexOf('data-carousel-active-card="true"'));
    expect(html).not.toMatch(/data-carousel-dots[^>]*bg-black\//);
    expect(html).not.toMatch(/data-carousel-dots[^>]*backdrop-blur/);
    expect(html).toContain("bg-black/20");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).not.toContain("mt-2 text-center text-xs");
    expect(html).not.toContain("mt-2 flex items-center");
  });

  it("renders Peek in stable source order with only the active item exposed as current", () => {
    const third = "01J00000000000000000000002";
    const items = [...images, { id: "three", type: "image" as const, mediaId: third, alt: "Third" }];
    const element = mediaElementSchema.parse({ id: "media", type: "media", items, presentation: { mode: "carousel", carousel: { style: "peek", loop: true } } });
    const asset = (id: string, url: string) => ({ id, originalFilename: `${id}.jpg`, width: 100, height: 100, web: { width: 100, height: 100, url } });
    const html = renderToStaticMarkup(<MediaElementRenderer element={element} viewport="mobile" media={{ [first]: asset(first, "/first.jpg"), [second]: asset(second, "/second.jpg"), [third]: asset(third, "/third.jpg") }} />);
    expect(html).toContain('data-carousel-style="peek"');
    expect(html).toContain('data-carousel-viewport="true"');
    expect(html).toContain('data-carousel-dots="true"');
    expect(html).toContain('data-carousel-arrows="true"');
    expect(html).toContain('data-carousel-state="active"');
    expect(html).toContain('data-carousel-state="previous"');
    expect(html).toContain('data-carousel-state="next"');
    expect(html).toContain('data-carousel-active-card="true"');
    expect(html.match(/aria-current="true"/g)).toHaveLength(2); // Active slide plus active dot.
    expect(html.match(/data-carousel-state="active"[^>]*aria-current="true"/g)).toHaveLength(1);
    expect(html.indexOf("/first.jpg")).toBeLessThan(html.indexOf("/second.jpg"));
    expect(html.indexOf("/second.jpg")).toBeLessThan(html.indexOf("/third.jpg"));
    expect(html.indexOf('data-carousel-dots="true"')).toBeLessThan(html.indexOf('data-carousel-item="two"'));
    expect(html).toContain("overflow:hidden");
    expect(html).toContain('style="bottom:.625rem"');
    const viewportStart = html.indexOf('data-carousel-viewport="true"');
    const positionStart = html.indexOf('<p data-carousel-position', viewportStart);
    expect(html.indexOf('data-carousel-dots="true"')).toBeLessThan(positionStart);
    expect(html.indexOf('data-carousel-arrows="true"')).toBeLessThan(positionStart);
  });

  it("bounds manual navigation and disables autoplay for reduced motion", () => {
    expect(carouselIndex(0, -1, 2, false)).toBe(0);
    expect(carouselIndex(1, 1, 2, false)).toBe(1);
    expect(carouselIndex(1, 1, 2, true)).toBe(0);
    expect(carouselAutoplayStep(0, 2, false)).toEqual({ next: 1, stop: true });
    expect(carouselAutoplayStep(1, 2, true)).toEqual({ next: 0, stop: false });
    expect(mediaAutoplayAllowed(true, 2, true)).toBe(false);
    expect(mediaAutoplayAllowed(true, 2, false)).toBe(true);
  });

  it("uses unique focal zoom IDs", () => {
    const element = mediaElementSchema.parse({ id: "media", type: "media", items: images });
    const asset = (id: string) => ({ id, originalFilename: `${id}.jpg`, width: 100, height: 100, web: { width: 100, height: 100, url: `/${id}.jpg` } });
    const html = renderToStaticMarkup(<MemoryRouter><MediaElementEditor element={element} eventId="event" viewport="desktop" mode="content" resolvedMedia={{ [first]: asset(first), [second]: asset(second) }} onMediaResolved={() => undefined} onChange={() => undefined} /></MemoryRouter>);
    expect(html).toContain('id="media-one-zoom"');
    expect(html).toContain('id="media-two-zoom"');
  });
});
