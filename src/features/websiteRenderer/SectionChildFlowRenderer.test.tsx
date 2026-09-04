import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SectionChildFlowRenderer } from "./SectionChildFlowRenderer";
import { WebsiteElementFrame } from "./WebsiteElementFrame";

const props = {
  sectionId: "date-section",
  flow: { elements: [{ id: "text-1", type: "text" as const, text: "Click me" }], order: [{ kind: "specialized" as const, key: "content" as const }, { kind: "element" as const, id: "text-1" }] },
  specialized: <div>Date</div>, viewport: "desktop" as const, templateKey: "classic-filipiniana-v1",
  library: { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as never,
  projectColors: [], context: null,
};

describe("SectionChildFlowRenderer canvas selection", () => {
  it("uses the first click to select the element without entering edit mode", () => {
    const onElementSelect = vi.fn();
    const onElementEdit = vi.fn();
    const stopPropagation = vi.fn();
    const tree = SectionChildFlowRenderer({ ...props, mode: "editor", onElementSelect, onElementEdit }) as ReactElement<{ children: ReactElement[] }>;
    const frame = tree.props.children[1] as ReactElement;
    const renderFrame = frame.type as (props: unknown) => ReactElement<{ onPointerDown: (event: { stopPropagation: () => void }) => void }>;
    const elementWrapper = renderFrame(frame.props);
    elementWrapper.props.onPointerDown({ stopPropagation });
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onElementSelect).toHaveBeenCalledWith("date-section", "text-1");
    expect(onElementEdit).not.toHaveBeenCalled();
  });

  it("uses a click anywhere on the selected element to enter edit mode", () => {
    const onElementSelect = vi.fn();
    const onElementEdit = vi.fn();
    const stopPropagation = vi.fn();
    const tree = SectionChildFlowRenderer({ ...props, mode: "editor", selectedElementId: "text-1", onElementSelect, onElementEdit }) as ReactElement<{ children: ReactElement[] }>;
    const frame = tree.props.children[1] as ReactElement;
    const renderFrame = frame.type as (props: unknown) => ReactElement<{ onPointerDown: (event: { stopPropagation: () => void }) => void }>;
    const elementWrapper = renderFrame(frame.props);
    elementWrapper.props.onPointerDown({ stopPropagation });
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onElementEdit).toHaveBeenCalledWith("date-section", "text-1");
    expect(onElementSelect).not.toHaveBeenCalled();
  });

  it("shows a no-layout-shift outline only in editor mode", () => {
    const selected = renderToStaticMarkup(<SectionChildFlowRenderer {...props} mode="editor" selectedElementId="text-1" />);
    expect(selected).toContain('data-editor-selected="true"');
    expect(selected).toContain("editor-selection-target");
    expect(selected).toContain("w-full");
    expect(selected).toContain("editor-selection-frame");
    const publicMarkup = renderToStaticMarkup(<SectionChildFlowRenderer {...props} mode="public" selectedElementId="text-1" />);
    expect(publicMarkup).not.toContain("data-editor-selected");
    expect(publicMarkup).not.toContain("editor-selection-target");
    expect(publicMarkup).not.toContain("editor-selection-frame");
    expect(publicMarkup).toContain("w-full");
  });

  it("shows friendly, editor-only selection badges for every element type", () => {
    const text = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date-section" elementId="text" elementType="text" selected={false}><span /></WebsiteElementFrame>);
    const richText = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date-section" elementId="rich-text" elementType="richText" selected={false}><span /></WebsiteElementFrame>);
    const divider = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date-section" elementId="divider" elementType="divider" selected={false}><span /></WebsiteElementFrame>);
    const group = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date-section" elementId="group" elementType="Group" selected={false}><span /></WebsiteElementFrame>);
    const published = renderToStaticMarkup(<WebsiteElementFrame mode="public" sectionId="date-section" elementId="text" elementType="text" selected={false}><span /></WebsiteElementFrame>);

    expect(text).toContain('aria-label="Select Text"');
    expect(richText).toContain('aria-label="Select Rich Text"');
    expect(divider).toContain('aria-label="Select Divider"');
    expect(divider).toContain('aria-label="Edit Divider"');
    expect(divider).toContain("w-full");
    expect(group).toContain('aria-label="Select Group"');
    expect(published).not.toContain("Select Text");
  });

  it("keeps the Divider frame full-width so percentage sizing works inside aligned Groups", () => {
    const editor = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date-section" elementId="divider" elementType="divider" selected={false}><span /></WebsiteElementFrame>);
    const published = renderToStaticMarkup(<WebsiteElementFrame mode="public" sectionId="date-section" elementId="divider" elementType="divider" selected={false}><span /></WebsiteElementFrame>);
    expect(editor).toContain("w-full");
    expect(published).toContain("w-full");
  });
});
