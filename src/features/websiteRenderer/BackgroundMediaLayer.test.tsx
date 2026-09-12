import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BackgroundMediaLayer } from "./BackgroundMediaLayer";

const media = {
  desktop: { id: "desktop", originalFilename: "wide.jpg", width: 1600, height: 900, web: { url: "/wide.jpg", width: 1600, height: 900 } },
  mobile: { id: "mobile", originalFilename: "portrait.jpg", width: 900, height: 1600, web: { url: "/portrait.jpg", width: 900, height: 1600 } },
};

describe("BackgroundMediaLayer", () => {
  it("renders the shared asset with the active device zoom", () => {
    const html = renderToStaticMarkup(<BackgroundMediaLayer ownerId="hero" kind="hero" viewport="mobile" media={media} reference={{ assetId: "desktop", zoom: 2.5, responsive: { mobile: { assetId: "mobile", zoom: .6 } } }} />);
    expect(html).toContain('src="/portrait.jpg"');
    expect(html).toContain('data-media-zoom="0.6"');
    expect(html).not.toContain("object-contain");
  });

  it("keeps Group clipping on its pointer-transparent background layer", () => {
    const html = renderToStaticMarkup(<BackgroundMediaLayer ownerId="group" kind="group" viewport="tablet" media={media} reference={{ assetId: "desktop" }} opacity={40} />);
    expect(html).toContain("pointer-events-none absolute inset-0 overflow-hidden");
    expect(html).toContain("opacity:0.4");
    expect(html).toContain('src="/wide.jpg"');
  });
});
