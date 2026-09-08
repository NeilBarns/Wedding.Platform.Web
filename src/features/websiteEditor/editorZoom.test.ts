import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EDITOR_ZOOM_PREFERENCES,
  EDITOR_ZOOM_STORAGE_KEY,
  computeFitScale,
  loadEditorZoomPreferences,
  parseEditorZoomPreferences,
  saveEditorZoomPreferences,
  stepEditorZoom,
} from "./editorZoom";

describe("editor zoom preferences", () => {
  it("uses the recommended first-load defaults", () => {
    expect(parseEditorZoomPreferences(null)).toEqual(DEFAULT_EDITOR_ZOOM_PREFERENCES);
  });

  it("restores all viewport preferences independently", () => {
    expect(parseEditorZoomPreferences(JSON.stringify({
      desktop: { type: "custom", scale: 0.5 },
      tablet: { type: "custom", scale: 0.9 },
      mobile: { type: "fit" },
    }))).toEqual({
      desktop: { type: "custom", scale: 0.5 },
      tablet: { type: "custom", scale: 0.9 },
      mobile: { type: "fit" },
    });
  });

  it("falls back per viewport for malformed, missing, unknown, and stale values", () => {
    expect(parseEditorZoomPreferences("not json")).toEqual(DEFAULT_EDITOR_ZOOM_PREFERENCES);
    expect(parseEditorZoomPreferences(JSON.stringify({
      desktop: { type: "future" },
      tablet: { type: "custom", scale: 0.8 },
    }))).toEqual(DEFAULT_EDITOR_ZOOM_PREFERENCES);
    expect(parseEditorZoomPreferences(JSON.stringify({
      desktop: { type: "custom", scale: "0.9" },
      tablet: { type: "custom", scale: 2 },
      mobile: { type: "custom", scale: -1 },
    }))).toEqual(DEFAULT_EDITOR_ZOOM_PREFERENCES);
  });

  it("persists Fit as a mode and preserves the other devices", () => {
    const setItem = vi.fn();
    const preferences = { ...DEFAULT_EDITOR_ZOOM_PREFERENCES, tablet: { type: "custom", scale: 0.75 } as const };
    saveEditorZoomPreferences(preferences, { getItem: vi.fn(), setItem });
    expect(setItem).toHaveBeenCalledWith(EDITOR_ZOOM_STORAGE_KEY, JSON.stringify(preferences));
    expect(JSON.parse(setItem.mock.calls[0][1]).desktop).toEqual({ type: "fit" });
  });

  it("survives storage read and write failures", () => {
    expect(loadEditorZoomPreferences({ getItem: () => { throw new Error("blocked"); }, setItem: vi.fn() })).toEqual(DEFAULT_EDITOR_ZOOM_PREFERENCES);
    expect(() => saveEditorZoomPreferences(DEFAULT_EDITOR_ZOOM_PREFERENCES, { getItem: vi.fn(), setItem: () => { throw new Error("full"); } })).not.toThrow();
  });
});

describe("editor zoom geometry", () => {
  it("computes Fit from measured width and inset and caps it at 100%", () => {
    expect(computeFitScale(916, 1280, 20)).toBe(0.7);
    expect(computeFitScale(2000, 1280)).toBe(1);
  });

  it("recomputes remembered Fit rather than restoring a percentage", () => {
    const restored = parseEditorZoomPreferences(JSON.stringify({ desktop: { type: "fit", scale: 0.5 } }));
    expect(restored.desktop).toEqual({ type: "fit" });
    expect(computeFitScale(656, 1280, 16)).toBe(0.5);
    expect(computeFitScale(1296, 1280, 16)).toBe(1);
  });

  it("steps deterministically from Fit and custom values", () => {
    expect(stepEditorZoom({ type: "fit" }, 0.72, 1)).toEqual({ type: "custom", scale: 0.75 });
    expect(stepEditorZoom({ type: "fit" }, 0.72, -1)).toEqual({ type: "custom", scale: 0.67 });
    expect(stepEditorZoom({ type: "custom", scale: 1 }, 1, -1)).toEqual({ type: "custom", scale: 0.9 });
  });
});
