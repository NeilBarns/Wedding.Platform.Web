import { describe, expect, it } from "vitest";
import { dateElementSchema } from "./schemas";

describe("dateElementSchema", () => {
  const base = { id: "date", type: "date", editorName: "Date 1" } as const;
  it("accepts sparse bounded appearance", () => {
    expect(dateElementSchema.safeParse({ ...base, appearance: { format: "numeric", showWeekday: false, alignment: "center", textStyle: "eyebrow", fontFamilyId: "inter", fontSize: "l", fontWeight: 700, lineHeight: "relaxed", letterSpacing: "wide", textTransform: "uppercase", colorId: "accent", responsive: { mobile: { fontSize: "s", alignment: "end" } } } }).success).toBe(true);
    expect(dateElementSchema.parse(base)).toEqual(base);
  });
  it("rejects arbitrary formatting and responsive overrides", () => {
    expect(dateElementSchema.safeParse({ ...base, appearance: { format: "YYYY-MM-DD" } }).success).toBe(false);
    expect(dateElementSchema.safeParse({ ...base, appearance: { responsive: { watch: {} } } }).success).toBe(false);
  });
});
