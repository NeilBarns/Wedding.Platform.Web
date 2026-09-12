import { describe, expect, it } from "vitest";
import { backgroundMediaSchema, resetBackgroundMediaDeviceFraming, resolveBackgroundMediaForDevice, setBackgroundMediaDeviceAsset, setBackgroundMediaDeviceFraming, type BackgroundMediaReference } from "./backgroundMedia";

const base: BackgroundMediaReference = {
  assetId: "01M00000000000000000000000",
  focalPoint: { x: .2, y: .7 }, zoom: 1.8,
  responsive: {
    tablet: { focalPoint: { x: .4, y: .5 }, zoom: 1.3 },
    mobile: { focalPoint: { x: .8, y: .3 }, zoom: .6 },
  },
};

describe("responsive background media", () => {
  it("resolves each device directly against Desktop", () => {
    expect(resolveBackgroundMediaForDevice(base, "desktop")).toEqual({ assetId: base.assetId, focalPoint: base.focalPoint, zoom: 1.8 });
    expect(resolveBackgroundMediaForDevice(base, "tablet")).toEqual({ assetId: base.assetId, focalPoint: { x: .4, y: .5 }, zoom: 1.3 });
    expect(resolveBackgroundMediaForDevice(base, "mobile")).toEqual({ assetId: base.assetId, focalPoint: { x: .8, y: .3 }, zoom: .6 });
  });

  it("keeps device edits sparse and independently resettable", () => {
    const edited = setBackgroundMediaDeviceFraming(base, "mobile", { zoom: .75 });
    expect(edited.responsive?.mobile?.zoom).toBe(.75);
    const reset = resetBackgroundMediaDeviceFraming(edited, "mobile");
    expect(reset.responsive?.mobile).toBeUndefined();
    expect(reset.responsive).toEqual({ tablet: base.responsive?.tablet });
  });

  it("resolves independent Tablet and Mobile images without cross-device inheritance", () => {
    const tablet = setBackgroundMediaDeviceAsset(base, "tablet", "01M00000000000000000000001");
    const both = setBackgroundMediaDeviceAsset(tablet, "mobile", "01M00000000000000000000002");
    expect(resolveBackgroundMediaForDevice(both, "desktop")?.assetId).toBe(base.assetId);
    expect(resolveBackgroundMediaForDevice(both, "tablet")?.assetId).toBe("01M00000000000000000000001");
    expect(resolveBackgroundMediaForDevice(both, "mobile")?.assetId).toBe("01M00000000000000000000002");
    const tabletOnly = setBackgroundMediaDeviceAsset(base, "tablet", "01M00000000000000000000001");
    expect(resolveBackgroundMediaForDevice(tabletOnly, "mobile")?.assetId).toBe(base.assetId);
  });

  it("resets only the changed device framing when selecting and removing an override image", () => {
    const selected = setBackgroundMediaDeviceAsset(base, "mobile", "01M00000000000000000000001");
    expect(selected.responsive?.mobile).toEqual({ assetId: "01M00000000000000000000001" });
    expect(selected.responsive?.tablet).toEqual(base.responsive?.tablet);
    const inherited = setBackgroundMediaDeviceAsset(selected, "mobile");
    expect(inherited.responsive?.mobile).toBeUndefined();
    expect(resolveBackgroundMediaForDevice(inherited, "mobile")).toEqual({ assetId: base.assetId, focalPoint: base.focalPoint, zoom: base.zoom });
  });

  it("strictly/admissibly validates only responsive framing fields and positive zoom", () => {
    expect(backgroundMediaSchema.safeParse(base).success).toBe(true);
    for (const invalid of [
      { ...base, fit: "cover" },
      { ...base, responsive: { watch: {} } },
      { ...base, responsive: { mobile: { crop: "smart" } } },
      { ...base, responsive: { mobile: { zoom: 4 } } },
      { ...base, responsive: { mobile: { assetId: "invalid" } } },
      { ...base, responsive: { mobile: { zoom: 0 } } },
      { ...base, responsive: { tablet: { focalPoint: { x: -1, y: .5 } } } },
    ]) expect(backgroundMediaSchema.safeParse(invalid).success).toBe(false);
  });
});
