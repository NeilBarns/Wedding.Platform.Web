import { describe, expect, it } from "vitest";
import { textElementSchema } from "./schemas";
import { changeTextFontFamily, resetTextResponsiveDevice, resolveTextResponsiveAppearance, setTextResponsiveProperty } from "./text";

const base = { id: "text-1", type: "text" as const, text: "Hello" };

describe("Text schema", () => {
  it("keeps the minimal canonical shape and normalizes pasted line breaks", () => {
    expect(textElementSchema.parse({ ...base, text: "one\r\n\ntwo\u2029three" })).toEqual({ ...base, text: "one two three" });
  });

  it("accepts the complete strict vocabulary", () => {
    expect(textElementSchema.safeParse({ ...base, appearance: { fontFamilyId: "inter", fontSize: "l", fontWeight: 700, lineHeight: "tight", letterSpacing: "wide", alignment: "center", colorId: "ink-text", italic: true, underline: true, strikethrough: false, textTransform: "uppercase", responsive: { tablet: { fontSize: "m" }, mobile: { alignment: "end" } } } }).success).toBe(true);
  });

  it.each([
    { semanticTag: "h1" },
    { appearance: { margin: "1rem" } },
    { appearance: { responsive: { desktop: { fontSize: "l" } } } },
    { appearance: { responsive: { mobile: { italic: true } } } },
    { appearance: { fontFamilyId: "dm-serif-display", fontWeight: 700 } },
    { appearance: { fontFamilyId: "quicksand", italic: true } },
    { appearance: { fontWeight: 500 } },
  ])("rejects obsolete, invalid, or layout-bearing shape %#", (extra) => expect(textElementSchema.safeParse({ ...base, ...extra }).success).toBe(false));
});

describe("Text responsive editing", () => {
  const inherited = { fontSize: "s" as const, alignment: "start" as const };
  it("uses independent branches and never lets mobile inherit tablet", () => {
    const appearance = { fontSize: "m" as const, alignment: "center" as const, responsive: { tablet: { fontSize: "xl" as const } } };
    expect(resolveTextResponsiveAppearance(appearance, "desktop", inherited)).toEqual({ fontSize: "m", alignment: "center" });
    expect(resolveTextResponsiveAppearance(appearance, "tablet", inherited)).toEqual({ fontSize: "xl", alignment: "center" });
    expect(resolveTextResponsiveAppearance(appearance, "mobile", inherited)).toEqual({ fontSize: "m", alignment: "center" });
  });

  it("targets and cleans sparse overrides without mutating input", () => {
    const original = { fontSize: "m" as const };
    const pinned = setTextResponsiveProperty(original, "mobile", "fontSize", "m");
    expect(pinned).toEqual({ fontSize: "m", responsive: { mobile: { fontSize: "m" } } });
    expect(original).toEqual({ fontSize: "m" });
    expect(setTextResponsiveProperty(pinned, "mobile", "fontSize", undefined)).toEqual({ fontSize: "m" });
    expect(resetTextResponsiveDevice({ responsive: { tablet: { alignment: "end" }, mobile: { fontSize: "s" } } }, "mobile")).toEqual({ responsive: { tablet: { alignment: "end" } } });
  });

  it("repairs unsupported tuples on font switch", () => {
    expect(changeTextFontFamily({ fontWeight: 700, italic: true }, "dm-serif-display")).toEqual({ fontFamilyId: "dm-serif-display", fontWeight: 400, italic: true });
    expect(changeTextFontFamily({ fontWeight: 700, italic: true }, "quicksand")).toEqual({ fontFamilyId: "quicksand", fontWeight: 700 });
    expect(changeTextFontFamily({ fontFamilyId: "inter", fontWeight: 600, italic: true }, undefined, "dm-serif-display")).toEqual({ fontWeight: 400, italic: true });
  });
});
