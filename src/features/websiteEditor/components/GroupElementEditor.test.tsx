import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CompositionGroup } from "../../websiteElements/types";
import { GroupElementEditor } from "./GroupElementEditor";

const group: CompositionGroup = { id: "group", type: "compositionGroup", children: [], layout: { width: "wide", direction: "horizontal", gap: "m", alignment: "start", columns: "equal-2" } };

describe("GroupElementEditor", () => {
  it("groups and orders size, spacing, and layout controls", () => {
    const html = renderToStaticMarkup(<GroupElementEditor group={group} viewport="desktop" onChange={() => undefined} onUngroup={() => undefined} />);
    expect(html).toContain("Size &amp; spacing");
    expect(html).toContain("Inner spacing · desktop");
    expect(html).toContain("Top inner spacing: None. Click to use next value.");
    expect(html).not.toContain("Top spacing");
    expect(html).toContain(">Layout<");
    expect(html).toContain('aria-label="Vertical"');
    expect(html).toContain('aria-label="Start"');
    expect(html).toContain('aria-label="Xs"');
    expect(html).toContain(">XS<");
    const positions = ["Width", "Inner spacing", "Direction", "Alignment", "Gap", "Columns"].map((label) => html.indexOf(label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
