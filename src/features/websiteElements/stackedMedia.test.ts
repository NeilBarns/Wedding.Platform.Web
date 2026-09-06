import { describe, expect, it } from "vitest";
import { resolveStackedPlacement, stackedCanvasAspectRatio, type StackedMediaStyle } from "./stackedMedia";

describe("stacked Media placement", () => {
  it("is deterministic for every supported style and item count", () => {
    for (const style of ["polaroid", "soft-overlap", "editorial"] as StackedMediaStyle[]) for (let count = 2; count <= 5; count++) {
      const first = Array.from({ length: count }, (_, index) => resolveStackedPlacement(style, index, count, "desktop"));
      expect(Array.from({ length: count }, (_, index) => resolveStackedPlacement(style, index, count, "desktop"))).toEqual(first);
      expect(first.map(({ zIndex }) => zIndex)).toEqual(Array.from({ length: count }, (_, index) => index + 1));
      expect(first.every(({ leftPercent, widthPercent, scale }) => leftPercent - widthPercent * scale / 2 >= 0 && leftPercent + widthPercent * scale / 2 <= 100)).toBe(true);
    }
  });

  it("tightens the composition for tablet and mobile", () => {
    const desktop = resolveStackedPlacement("polaroid", 0, 5, "desktop");
    const tablet = resolveStackedPlacement("polaroid", 0, 5, "tablet");
    const mobile = resolveStackedPlacement("polaroid", 0, 5, "mobile");
    expect(Math.abs(mobile.leftPercent - 50)).toBeLessThan(Math.abs(tablet.leftPercent - 50));
    expect(Math.abs(tablet.leftPercent - 50)).toBeLessThan(Math.abs(desktop.leftPercent - 50));
    expect(Math.abs(mobile.rotation)).toBeLessThan(Math.abs(desktop.rotation));
    expect(stackedCanvasAspectRatio("mobile")).toBe("4 / 5");
  });
});
