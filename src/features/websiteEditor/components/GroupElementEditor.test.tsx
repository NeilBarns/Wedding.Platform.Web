import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { selectGroupLayoutProperty } from "../../websiteElements/group";
import type { CompositionGroup } from "../../websiteElements/types";
import { GroupElementEditor } from "./GroupElementEditor";

const group: CompositionGroup = { id: "group", type: "compositionGroup", editorName: "Group 1", children: [], layout: { width: "wide", direction: "horizontal", gap: "m", alignment: "start", columns: "equal-2" } };

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
    expect(html).toContain('aria-label="Fill"');
    expect(html).not.toContain('aria-label="Stretch"');
    expect(html).toContain('aria-label="None"');
    expect(html).toContain('>None</button>');
    expect(html).toContain('aria-label="Xs"');
    expect(html).toContain(">XS<");
    const positions = ["Width · desktop", "Inner spacing", "Direction", "Alignment", "Gap", "Columns"].map((label) => html.indexOf(label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it.each(["tablet", "mobile"] as const)("highlights effective Desktop values for untouched %s controls", (viewport) => {
    const html = renderToStaticMarkup(<GroupElementEditor group={group} viewport={viewport} onChange={() => undefined} onUngroup={() => undefined} />);
    expect(html).toContain(`Width · ${viewport}`);
    expect(html).toContain(">Wide</span>");
    expect(html).toContain(`Direction · ${viewport}`);
    expectPressed(html, "Horizontal");
    expectPressed(html, "Start");
    expectPressed(html, "M");
    expect(html).toContain('aria-checked="true" aria-label="50 / 50 columns"');
    expect(html).toContain("Top inner spacing: None");
    expect(html).not.toContain("Use desktop setting");
  });

  it.each(["tablet", "mobile"] as const)("highlights explicit %s overrides without reset actions", (viewport) => {
    const overridden: CompositionGroup = { ...group, layout: { ...group.layout, responsive: { [viewport]: { width: "narrow", direction: "vertical", gap: "none", padding: { top: "xl" }, alignment: "end", columns: "content-wide" } } } };
    const html = renderToStaticMarkup(<GroupElementEditor group={overridden} viewport={viewport} onChange={() => undefined} onUngroup={() => undefined} />);
    expect(html).toContain(">Narrow</span>");
    expectPressed(html, "Vertical");
    expectPressed(html, "End");
    expectPressed(html, "None");
    expect(html).toContain("Top inner spacing: Xl");
    expect(html).not.toContain("Use desktop setting");
    expect(html).not.toContain("Use default");
  });

  it("a normalized matching selection reselects the effective Desktop value", () => {
    const overridden = selectGroupLayoutProperty(group.layout ?? {}, "mobile", "gap", "none");
    expectPressed(renderToStaticMarkup(<GroupElementEditor group={{ ...group, layout: overridden }} viewport="mobile" onChange={() => undefined} onUngroup={() => undefined} />), "None");
    const reset = selectGroupLayoutProperty(overridden, "mobile", "gap", "m");
    expect(reset.responsive?.mobile).toBeUndefined();
    const html = renderToStaticMarkup(<GroupElementEditor group={{ ...group, layout: reset }} viewport="mobile" onChange={() => undefined} onUngroup={() => undefined} />);
    expectPressed(html, "M");
    expect(html).not.toContain("Use desktop setting");
  });

  it("keeps Mobile independent from Tablet in selected control values", () => {
    const responsive: CompositionGroup = { ...group, layout: { ...group.layout, responsive: { tablet: { direction: "vertical", gap: "xl", alignment: "end", columns: "equal-3" } } } };
    const tablet = renderToStaticMarkup(<GroupElementEditor group={responsive} viewport="tablet" onChange={() => undefined} onUngroup={() => undefined} />);
    const mobile = renderToStaticMarkup(<GroupElementEditor group={responsive} viewport="mobile" onChange={() => undefined} onUngroup={() => undefined} />);
    expectPressed(tablet, "Vertical");
    expectPressed(tablet, "Xl");
    expectPressed(mobile, "Horizontal");
    expectPressed(mobile, "M");
    expectPressed(mobile, "Start");
    expect(mobile).toContain('aria-checked="true" aria-label="50 / 50 columns"');
  });

  it("reflects changed Desktop values in untouched Tablet and Mobile controls", () => {
    const changed: CompositionGroup = { ...group, layout: { ...group.layout, width: "medium", direction: "vertical", gap: "s", padding: { left: "l" }, alignment: "stretch" } };
    for (const viewport of ["tablet", "mobile"] as const) {
      const html = renderToStaticMarkup(<GroupElementEditor group={changed} viewport={viewport} onChange={() => undefined} onUngroup={() => undefined} />);
      expect(html).toContain(">Medium</span>");
      expectPressed(html, "Vertical");
      expectPressed(html, "S");
      expectPressed(html, "Fill");
      expect(html).toContain("Left inner spacing: L");
    }
  });
});

function expectPressed(html: string, label: string) {
  expect(html).toMatch(new RegExp(`aria-label="${label}"[^>]*aria-pressed="true"`));
}
