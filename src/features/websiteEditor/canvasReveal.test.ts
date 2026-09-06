import { describe, expect, it, vi } from "vitest";
import { findEditorTarget, revealEditorTarget } from "./canvasReveal";

const rect = (top: number, bottom: number) => ({ top, bottom, height: bottom - top }) as DOMRect;

function setup(top: number, bottom: number, iframe = false) {
  const scrollBy = vi.fn();
  const matchMedia = vi.fn(() => ({ matches: true }));
  const scrollingElement = { scrollBy } as unknown as Element;
  const ownerDocument = {
    defaultView: { matchMedia },
    documentElement: { clientHeight: 200 },
    scrollingElement,
  } as unknown as Document;
  const marked = iframe ? null : {
    getBoundingClientRect: () => rect(0, 200),
    scrollBy,
  } as unknown as HTMLElement;
  const target = {
    ownerDocument,
    closest: vi.fn(() => marked),
    getBoundingClientRect: () => rect(top, bottom),
  } as unknown as HTMLElement;
  return { target, scrollBy, scrollingElement, marked };
}

describe("editor canvas selection reveal", () => {
  it("reveals an off-screen top-level block with nearest-edge movement", () => {
    const { target, scrollBy } = setup(240, 280);
    expect(revealEditorTarget(target)).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({ top: 104, behavior: "auto" });
  });

  it("does not scroll an already comfortably visible block", () => {
    const { target, scrollBy } = setup(50, 90);
    expect(revealEditorTarget(target)).toBe(false);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("targets the exact nested Group child by canonical element selector", () => {
    const parent = {} as HTMLElement;
    const nested = {} as HTMLElement;
    const candidate = { querySelector: vi.fn((selector: string) => selector.includes("nested-child") ? nested : parent) } as unknown as Document;
    expect(findEditorTarget([candidate], '[data-editor-website-element="nested-child"]')).toBe(nested);
  });

  it("finds a selected block in the newly selected Section document", () => {
    const first = { querySelector: vi.fn(() => null) } as unknown as Document;
    const selected = {} as HTMLElement;
    const second = { querySelector: vi.fn(() => selected) } as unknown as Document;
    expect(findEditorTarget([first, second], "[data-preview-section=section-b]")).toBe(selected);
  });

  it.each(["tablet", "mobile"])("uses the %s iframe document scrolling element", () => {
    const { target, scrollBy, scrollingElement } = setup(230, 270, true);
    expect(revealEditorTarget(target)).toBe(true);
    expect(target.closest).toHaveBeenCalledWith("[data-editor-preview-scroll]");
    expect(scrollingElement.scrollBy).toBe(scrollBy);
    expect(scrollBy).toHaveBeenCalledOnce();
  });

  it("does not scroll when a hidden block has no rendered target", () => {
    const document = { querySelector: vi.fn(() => null) } as unknown as Document;
    expect(findEditorTarget([document], '[data-editor-website-element="hidden"]')).toBeUndefined();
  });

  it("affects only the editor preview container", () => {
    const { target, scrollBy } = setup(-40, 0);
    const pageScroll = vi.fn();
    Object.assign(target.ownerDocument.defaultView!, { scrollBy: pageScroll });
    revealEditorTarget(target);
    expect(scrollBy).toHaveBeenCalledOnce();
    expect(pageScroll).not.toHaveBeenCalled();
  });
});
