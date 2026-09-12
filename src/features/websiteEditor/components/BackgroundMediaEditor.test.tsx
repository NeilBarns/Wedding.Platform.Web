import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BackgroundMediaEditor } from "./BackgroundMediaEditor";

vi.mock("../../events/workspace/EventWorkspaceContext", () => ({ useEventWorkspace: () => ({ id: "event" }) }));

const resolvedMedia = {
  "01M00000000000000000000000": { id: "01M00000000000000000000000", originalFilename: "wide.jpg", width: 1600, height: 900, web: { url: "/wide.jpg", width: 1600, height: 900 } },
  "01M00000000000000000000001": { id: "01M00000000000000000000001", originalFilename: "portrait.jpg", width: 900, height: 1600, web: { url: "/portrait.jpg", width: 900, height: 1600 } },
};

describe("BackgroundMediaEditor", () => {
  it("uses the active device context without materializing overrides", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(<MemoryRouter><BackgroundMediaEditor viewport="mobile" media={{ assetId: "01M00000000000000000000000" }} resolvedMedia={resolvedMedia} onMediaResolved={() => undefined} onChange={onChange} /></MemoryRouter>);
    expect(html).toContain("Using Desktop image");
    expect(html).toContain("Use different image on Mobile");
    expect(html).toContain("Reset Mobile framing");
    expect(html).not.toContain("Show full image");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows device-image replacement and inheritance actions", () => {
    const html = renderToStaticMarkup(<MemoryRouter><BackgroundMediaEditor viewport="mobile" media={{ assetId: "01M00000000000000000000000", responsive: { mobile: { assetId: "01M00000000000000000000001" } } }} resolvedMedia={resolvedMedia} onMediaResolved={() => undefined} onChange={() => undefined} /></MemoryRouter>);
    expect(html).toContain("Using Mobile image");
    expect(html).toContain("portrait.jpg");
    expect(html).toContain("Change image");
    expect(html).toContain("Use Desktop image");
  });

  it("shows the inherited asset and supports sub-cover device zoom", () => {
    const html = renderToStaticMarkup(<MemoryRouter><BackgroundMediaEditor viewport="mobile" media={{ assetId: "01M00000000000000000000000", zoom: 2, responsive: { mobile: { zoom: .6 } } }} resolvedMedia={resolvedMedia} onMediaResolved={() => undefined} onChange={() => undefined} /></MemoryRouter>);
    expect(html).toContain("wide.jpg");
    expect(html).toContain("0.6");
    expect(html).not.toContain("Use Desktop image");
  });
});
