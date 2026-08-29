export const narrativeSlotKeys = ["eyebrow", "heading", "divider", "body", "quote", "media", "caption", "cta"] as const;

export type NarrativeSlotKey = (typeof narrativeSlotKeys)[number];
export type NarrativeTypographySlotKey = Exclude<NarrativeSlotKey, "divider" | "media">;

export function isNarrativeTypographySlot(key: NarrativeSlotKey): key is NarrativeTypographySlotKey {
  return key !== "divider" && key !== "media";
}
