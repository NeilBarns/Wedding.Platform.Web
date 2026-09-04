export const DIVIDER_ALIGNMENTS = ["start", "center", "end"] as const;
export const DIVIDER_WIDTH_MIN = 0;
export const DIVIDER_WIDTH_MAX = 100;
export const DIVIDER_WIDTH_DEFAULT = 50;
export const DIVIDER_OPACITY_MIN = 25;
export const DIVIDER_OPACITY_MAX = 100;
export const DIVIDER_OPACITY_DEFAULT = 100;

export type DividerAlignment = (typeof DIVIDER_ALIGNMENTS)[number];

export type TemplateDividerAsset = {
  id: string;
  label: string;
  assetPath: string;
  category?: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  defaultWidth?: number;
  defaultAlignment?: DividerAlignment;
};

export type TemplateDividerRegistry = {
  defaultAssetId?: string;
  defaultWidth: number;
  defaultAlignment: DividerAlignment;
  widthRange: { minPercent: number; maxPercent: number };
  assets: readonly TemplateDividerAsset[];
};

const emptyRegistry: TemplateDividerRegistry = {
  defaultWidth: DIVIDER_WIDTH_DEFAULT,
  defaultAlignment: "center",
  widthRange: { minPercent: 10, maxPercent: 25 },
  assets: [],
};

const registries: Readonly<Record<string, TemplateDividerRegistry>> = {
  "classic-filipiniana-v1": {
    defaultAssetId: "botanical-vine",
    defaultWidth: DIVIDER_WIDTH_DEFAULT,
    defaultAlignment: "center",
    widthRange: { minPercent: 10, maxPercent: 25 },
    assets: [
      { id: "botanical-vine", label: "Botanical", category: "Botanical", assetPath: "/template-assets/classic-filipiniana/dividers/botanical-vine.png", intrinsicWidth: 2116, intrinsicHeight: 328 },
      { id: "filigree-center", label: "Filigree", category: "Filigree", assetPath: "/template-assets/classic-filipiniana/dividers/filigree-center.png", intrinsicWidth: 2134, intrinsicHeight: 340 },
      { id: "floral-silhouette", label: "Floral Flourish", category: "Floral", assetPath: "/template-assets/classic-filipiniana/dividers/floral-silhouette.png", intrinsicWidth: 2095, intrinsicHeight: 284 },
      { id: "ornamental-flourish", label: "Ornamental Centerpiece", category: "Ornamental", assetPath: "/template-assets/classic-filipiniana/dividers/ornamental-flourish.png", intrinsicWidth: 2154, intrinsicHeight: 345 },
    ],
  },
  "modern-editorial-v1": emptyRegistry,
};

export const dividerRegistryForTemplate = (templateKey: string): TemplateDividerRegistry => registries[templateKey] ?? emptyRegistry;

export const dividerAssetsForTemplate = (templateKey: string) => dividerRegistryForTemplate(templateKey).assets;

export const resolveDividerAsset = (templateKey: string, assetId?: string) => {
  const registry = dividerRegistryForTemplate(templateKey);
  return registry.assets.find(({ id }) => id === assetId)
    ?? registry.assets.find(({ id }) => id === registry.defaultAssetId)
    ?? registry.assets[0];
};
