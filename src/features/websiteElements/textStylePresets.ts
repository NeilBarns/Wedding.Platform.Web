import type { ResolvedDesignContext, TemplateDesignLibrary } from "../websiteCapabilities/types";
import { platformFont } from "../websiteFonts/platformFonts";
import { textFontCapabilities, type TextAppearance } from "./text";
import type { TextElement } from "./types";

export const TEXT_STYLE_IDS = ["heading", "subheading", "eyebrow", "body", "caption"] as const;
export type TextStyleId = typeof TEXT_STYLE_IDS[number];
export type TextStyleChoice = TextStyleId | "custom";

const TEXT_STYLE_APPEARANCE_KEYS = ["fontSize", "fontWeight", "lineHeight", "letterSpacing", "alignment", "colorId", "textTransform"] as const;

export const friendlyFontWeightOptions = (fontId?: string) => textFontCapabilities(fontId).weights
  .map((weight) => ({ value: String(weight), label: weight === 400 ? "Normal" : weight === 600 ? "Semi-bold" : "Bold" }));

export function withTextAppearance(element: TextElement, appearance: TextAppearance): TextElement {
  const next = { ...element };
  if (Object.keys(appearance).length) next.appearance = appearance; else delete next.appearance;
  return next;
}

const preferredWeight = (fontId: string | undefined, desired: 400 | 600 | 700): 400 | 600 | 700 | undefined => {
  const weights = platformFont(fontId ?? "")?.weights ?? [];
  return weights.includes(desired) ? desired : weights.includes(600) ? 600 : weights.includes(700) ? 700 : weights.includes(400) ? 400 : undefined;
};

export function textStylePreset(
  style: TextStyleId,
  templateKey: string,
  library: TemplateDesignLibrary,
  context?: ResolvedDesignContext | null,
  allowedColorIds?: readonly string[],
): TextAppearance {
  const modern = templateKey === "modern-editorial-v1";
  const bodyFontId = context?.bodyFontId ?? library.fontRecommendations.body[0];
  const weight = preferredWeight(bodyFontId, modern ? 700 : 600);
  const color = (id?: string) => id && (!allowedColorIds || allowedColorIds.includes(id)) ? id : undefined;
  switch (style) {
    case "heading":
      return compact({ fontSize: "xl", fontWeight: weight, lineHeight: "tight", letterSpacing: modern ? "tight" : "normal", alignment: modern ? "start" : "center", colorId: color(context?.headingColorId) });
    case "subheading":
      return compact({ fontSize: "l", fontWeight: preferredWeight(bodyFontId, 600), lineHeight: "normal", alignment: modern ? "start" : "center", colorId: color(context?.bodyColorId) });
    case "eyebrow":
      return compact({ fontSize: "xs", fontWeight: preferredWeight(bodyFontId, 600), lineHeight: "normal", letterSpacing: "wide", alignment: modern ? "start" : "center", colorId: color(context?.accentColorId), textTransform: "uppercase" });
    case "caption":
      return compact({ fontSize: "s", fontWeight: preferredWeight(bodyFontId, 400), lineHeight: "relaxed", colorId: color(mutedColorId(library, context)) });
    case "body":
      return {};
  }
}

export function applyTextStylePreset(appearance: TextAppearance, preset: TextAppearance): TextAppearance {
  const next = { ...appearance };
  for (const key of TEXT_STYLE_APPEARANCE_KEYS) {
    const value = preset[key];
    if (value === undefined) delete next[key];
    else Object.assign(next, { [key]: value });
  }
  return next;
}

export function resolveTextStyle(
  appearance: TextAppearance,
  templateKey: string,
  library: TemplateDesignLibrary,
  context?: ResolvedDesignContext | null,
  allowedColorIds?: readonly string[],
): TextStyleChoice {
  const ownedAppearance = pickTextStyleAppearance(appearance);
  return TEXT_STYLE_IDS.find((style) => equalAppearance(ownedAppearance, pickTextStyleAppearance(textStylePreset(style, templateKey, library, context, allowedColorIds)))) ?? "custom";
}

export function curatedTextColors(
  library: TemplateDesignLibrary,
  allowedIds: readonly string[],
  context?: ResolvedDesignContext | null,
  currentId?: string,
): Array<{ id: string; displayName: string; value: string }> {
  const allowed = new Set(allowedIds);
  const palette = library.palettePresets.find(({ roles }) => context && roles.text === context.bodyColorId && roles.accent === context.accentColorId)
    ?? library.palettePresets.find(({ roles }) => context && Object.values(roles).includes(context.bodyColorId))
    ?? library.palettePresets[0];
  const semantic = [
    [context?.headingColorId, "Primary"],
    [context?.accentColorId, "Accent"],
    [context?.bodyColorId, "Text"],
    [palette?.roles.textMuted, "Muted"],
  ] as const;
  const seen = new Set<string>();
  const result: Array<{ id: string; displayName: string; value: string }> = semantic.flatMap(([id, displayName]) => {
    if (!id || seen.has(id) || !allowed.has(id)) return [];
    const color = library.colors.find((candidate) => candidate.id === id);
    if (!color) return [];
    seen.add(id);
    return [{ id, displayName, value: color.value }];
  });
  if (currentId && allowed.has(currentId) && !seen.has(currentId)) {
    const current = library.colors.find(({ id }) => id === currentId);
    if (current) result.push({ ...current, displayName: "Current color" });
  }
  return result;
}

function mutedColorId(library: TemplateDesignLibrary, context?: ResolvedDesignContext | null) {
  return library.palettePresets.find(({ roles }) => context && roles.text === context.bodyColorId)?.roles.textMuted;
}

function compact(appearance: TextAppearance): TextAppearance {
  return Object.fromEntries(Object.entries(appearance).filter(([, value]) => value !== undefined)) as TextAppearance;
}

function equalAppearance(left: TextAppearance, right: TextAppearance) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function pickTextStyleAppearance(appearance: TextAppearance): TextAppearance {
  return Object.fromEntries(TEXT_STYLE_APPEARANCE_KEYS.flatMap((key) => appearance[key] === undefined ? [] : [[key, appearance[key]]])) as TextAppearance;
}

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sorted(item)]));
}
