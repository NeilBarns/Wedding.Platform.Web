import type { ResponsiveViewport } from "../websiteEditor/types";
import { platformFont } from "../websiteFonts/platformFonts";

export const TEXT_SIZES = ["xs", "s", "m", "l", "xl"] as const;
export const TEXT_LINE_HEIGHTS = ["tight", "normal", "relaxed"] as const;
export const TEXT_LETTER_SPACINGS = ["tight", "normal", "wide"] as const;
export const TEXT_ALIGNMENTS = ["start", "center", "end"] as const;
export const TEXT_TRANSFORMS = ["none", "uppercase", "lowercase", "capitalize"] as const;

export type TextSize = typeof TEXT_SIZES[number];
export type TextAlignment = typeof TEXT_ALIGNMENTS[number];
export type TextResponsiveAppearance = { fontSize?: TextSize; alignment?: TextAlignment };
export type TextAppearance = {
  fontFamilyId?: string; fontSize?: TextSize; fontWeight?: 400 | 600 | 700;
  lineHeight?: typeof TEXT_LINE_HEIGHTS[number];
  letterSpacing?: typeof TEXT_LETTER_SPACINGS[number];
  alignment?: TextAlignment; colorId?: string; italic?: boolean;
  underline?: boolean; strikethrough?: boolean;
  textTransform?: typeof TEXT_TRANSFORMS[number];
  responsive?: { tablet?: TextResponsiveAppearance; mobile?: TextResponsiveAppearance };
};

export function normalizeTextContent(value: string): string {
  return value.replace(/(?:\r\n|[\r\n\u2028\u2029])+/gu, " ");
}

export function resolveTextResponsiveAppearance(
  appearance: TextAppearance,
  viewport: ResponsiveViewport,
  inherited: Required<Pick<TextAppearance, "fontSize" | "alignment">>,
): Required<Pick<TextAppearance, "fontSize" | "alignment">> {
  const branch = viewport === "desktop" ? undefined : appearance.responsive?.[viewport];
  return {
    fontSize: branch?.fontSize ?? appearance.fontSize ?? inherited.fontSize,
    alignment: branch?.alignment ?? appearance.alignment ?? inherited.alignment,
  };
}

export function setTextResponsiveProperty(
  appearance: TextAppearance,
  viewport: ResponsiveViewport,
  key: keyof TextResponsiveAppearance,
  value: TextResponsiveAppearance[keyof TextResponsiveAppearance] | undefined,
): TextAppearance {
  if (viewport === "desktop") {
    const next = { ...appearance };
    if (value === undefined) delete next[key]; else Object.assign(next, { [key]: value });
    return next;
  }
  const branch = { ...appearance.responsive?.[viewport] };
  if (value === undefined) delete branch[key]; else Object.assign(branch, { [key]: value });
  const responsive = { ...appearance.responsive };
  if (Object.keys(branch).length) responsive[viewport] = branch; else delete responsive[viewport];
  const next = { ...appearance };
  if (Object.keys(responsive).length) next.responsive = responsive; else delete next.responsive;
  return next;
}

export function resetTextResponsiveDevice(appearance: TextAppearance, viewport: Exclude<ResponsiveViewport, "desktop">): TextAppearance {
  const responsive = { ...appearance.responsive };
  delete responsive[viewport];
  const next = { ...appearance };
  if (Object.keys(responsive).length) next.responsive = responsive; else delete next.responsive;
  return next;
}

export function validateTextFontTuple(appearance: TextAppearance): string | undefined {
  if (!appearance.fontFamilyId) return undefined;
  const font = platformFont(appearance.fontFamilyId);
  if (!font) return "Text font family is not supported.";
  if (appearance.fontWeight !== undefined && !font.weights.includes(appearance.fontWeight)) return "Text font weight is not supported by the selected family.";
  if (appearance.italic === true && !font.styles.includes("italic")) return "Italic is not supported by the selected family.";
  return undefined;
}

export function changeTextFontFamily(appearance: TextAppearance, fontFamilyId: string | undefined, inheritedFontFamilyId?: string): TextAppearance {
  const next = { ...appearance };
  if (fontFamilyId) next.fontFamilyId = fontFamilyId; else delete next.fontFamilyId;
  const font = platformFont(fontFamilyId ?? inheritedFontFamilyId ?? "");
  if (font && next.fontWeight !== undefined && !font.weights.includes(next.fontWeight)) {
    const replacement = font.weights.find((weight): weight is 400 | 600 | 700 => weight === 400 || weight === 600 || weight === 700);
    if (replacement) next.fontWeight = replacement; else delete next.fontWeight;
  }
  if (font && next.italic && !font.styles.includes("italic")) delete next.italic;
  return next;
}
