import { describe, expect, it } from "vitest";
import { clampMediaPoint, clampMediaZoom, resolveMediaAspectRatio, resolveMediaCropGeometry, safeMediaSize } from "./mediaCrop";

describe("Media crop geometry", () => {
  it("uses one canonical authored and natural ratio mapping", () => {
    expect(resolveMediaAspectRatio("natural", { width: 1200, height: 800 })).toBe("1200 / 800");
    expect(resolveMediaAspectRatio("square", { width: 1200, height: 800 })).toBe("1 / 1");
    expect(resolveMediaAspectRatio("portrait", { width: 1200, height: 800 })).toBe("3 / 4");
    expect(resolveMediaAspectRatio("landscape", { width: 1200, height: 800 })).toBe("4 / 3");
    expect(resolveMediaAspectRatio("wide", { width: 1200, height: 800 })).toBe("16 / 9");
  });

  it("falls back deterministically for invalid intrinsic dimensions without invalid math", () => {
    for (const size of [{ width: 0, height: 10 }, { width: -1, height: 2 }, { width: Number.NaN, height: Number.POSITIVE_INFINITY }]) {
      expect(safeMediaSize(size)).toEqual({ width: 1, height: 1 });
      expect(resolveMediaAspectRatio("natural", size)).toBe("1 / 1");
      const geometry = resolveMediaCropGeometry({ width: 320, height: 180 }, size, { x: Number.NaN, y: 2 }, Number.POSITIVE_INFINITY);
      expect(Object.values(geometry).flatMap((value) => typeof value === "object" ? Object.values(value) : [value]).every(Number.isFinite)).toBe(true);
    }
  });

  it("clamps point and zoom and calculates cover without distortion", () => {
    expect(clampMediaPoint({ x: -1, y: 2 })).toEqual({ x: 0, y: 1 });
    expect(clampMediaZoom(0)).toBe(1);
    expect(clampMediaZoom(4)).toBe(3);
    expect(clampMediaZoom(1.26)).toBe(1.3);
    const geometry = resolveMediaCropGeometry({ width: 100, height: 100 }, { width: 200, height: 100 }, { x: 0.7, y: 0.3 }, 1.5);
    expect(geometry.width / geometry.height).toBe(2);
    expect(geometry.zoom).toBe(1.5);
  });
});
