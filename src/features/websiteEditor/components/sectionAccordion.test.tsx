import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WebsiteSection } from "../types";
import { SectionNavigator } from "./SectionNavigator";
import {
  resolveExpandedSectionId,
  resolveSelectionOwnerId,
  toggleExpandedSectionId,
} from "./sectionAccordion";

const childFlow = (groupId: string, childId: string) => ({
  elements: [{
    id: groupId,
    type: "compositionGroup" as const,
    children: [{ id: childId, type: "text" as const, text: childId }],
  }],
  order: [
    { kind: "specialized" as const, key: "content" as const },
    { kind: "element" as const, id: groupId },
  ],
});

const sections = [
  { id: "section-a", type: "date", displayName: "Section A", isEnabled: true, content: { heading: "A", description: "A", childFlow: childFlow("group-a", "child-a") } },
  { id: "section-b", type: "date", displayName: "Section B", isEnabled: false, content: { heading: "B", description: "B", childFlow: childFlow("group-b", "nested-child-b") } },
] as unknown as WebsiteSection[];

const renderNavigator = (selectedId: string, childSectionId?: string, childId?: string) => renderToStaticMarkup(
  <SectionNavigator
    sections={sections}
    selectedId={selectedId}
    selectedNarrativeBlockId={null}
    selectedStoryHeaderField={null}
    workingStory={null}
    workingChildFlow={null}
    selectedChild={childSectionId && childId ? { sectionId: childSectionId, reference: { kind: "element", id: childId } } : null}
    genericChildSectionIds={["date"]}
    pending={false}
    onSelect={vi.fn()}
    onNarrativeBlockSelect={vi.fn()}
    onStoryHeaderSelect={vi.fn()}
    onStoryChange={vi.fn(() => true)}
    onChildFlowChange={vi.fn(() => true)}
    onChildSelect={vi.fn()}
    onToggle={vi.fn()}
    onMove={vi.fn()}
    onReorder={vi.fn()}
  />,
);

describe("Section Structure accordion", () => {
  it("expanding Section B collapses Section A", () => {
    expect(toggleExpandedSectionId("section-a", "section-b", true)).toBe("section-b");
  });

  it("switches the expanded Section for canvas selection", () => {
    expect(resolveExpandedSectionId(["section-a", "section-b"], "section-b")).toBe("section-b");
    const html = renderNavigator("section-b");
    expect(html).toContain('aria-label="Expand Section A" aria-expanded="false"');
    expect(html).toContain('aria-label="Collapse Section B" aria-expanded="true"');
    expect(html).toContain('aria-label="Section B structure"');
    expect(html).not.toContain('aria-label="Section A structure"');
  });

  it("resolves a nested Group child to its top-level owning Section", () => {
    const owner = resolveSelectionOwnerId("section-a", "section-b");
    expect(owner).toBe("section-b");
    const html = renderNavigator(owner!, "section-b", "nested-child-b");
    expect(html).toContain('aria-label="Collapse Section B" aria-expanded="true"');
    expect(html).toContain("nested-child-b");
    expect(html).toContain('aria-label="Collapse Group"');
  });

  it("keeps accordion state out of website data and does not mutate content, order, or visibility", () => {
    const snapshot = structuredClone(sections);
    const result = toggleExpandedSectionId("section-a", "section-b", true);
    expect(result).toBe("section-b");
    expect(sections).toEqual(snapshot);
    expect(sections.map(({ id }) => id)).toEqual(["section-a", "section-b"]);
    expect(sections.map(({ isEnabled }) => isEnabled)).toEqual([true, false]);
    expect(JSON.stringify(sections)).not.toContain("expanded");
  });

  it("uses one sensible default and permits explicitly collapsing the active Section", () => {
    expect(resolveExpandedSectionId(["section-a", "section-b"], null)).toBe("section-a");
    expect(toggleExpandedSectionId("section-a", "section-a", false)).toBeNull();
  });
});
