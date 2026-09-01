import { Select } from "../../../components/ui/Select";
import { AlignCenter, AlignLeft, AlignRight, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { FontPicker } from "./FontPicker";
import { InspectorDisclosure, InspectorResetAction, InspectorSection } from "./InspectorPrimitives";
import { InspectorVisualChoiceGroup, type InspectorVisualChoiceOption } from "./InspectorVisualChoice";
import type {
  ElementCapability,
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../../websiteCapabilities/types";
import type { ResponsiveViewport, StoryBlock } from "../types";
import {
  authorNarrativeComposition,
  resetNarrativeComposition,
  resolveNarrativeComposition,
} from "../../websiteRenderer/narrativeComposition";
import type { NarrativeTypographySlotKey } from "../narrativeSlotFocus";
import type { ProjectColor } from "../../websiteColors/projectColors";
import { WebsiteColorSwatchControl } from "./WebsiteColorSwatchControl";
import { applyNarrativeBackgroundColor, applyNarrativeDecoration, narrativeLegacyBackgroundLabel } from "../narrativeBackground";
import { DecorativeStrengthControl } from "./DecorativeStrengthControl";
import { decorativeHelpers, decorativeLabel } from "./decorativeAppearanceOptions";
import { resolveDecorativeDefaultStrength } from "../../websiteRenderer/templateDecorativeAssets";
import { applyNarrativeMediaCornerStyle, applyNarrativeMediaFrameColor, applyNarrativeMediaFrameSize, applyNarrativeMediaFrameStyle } from "../narrativeMediaAppearance";

type SlotKey = "eyebrow" | "heading" | "body" | "quote" | "caption" | "cta";
type Appearance = NonNullable<StoryBlock["slots"]["heading"]["appearance"]>;
const groups: Array<{ key: SlotKey; label: string; role: "heading" | "body" }> =
  [
    { key: "eyebrow", label: "Eyebrow", role: "body" },
    { key: "heading", label: "Heading", role: "heading" },
    { key: "body", label: "Body", role: "body" },
    { key: "quote", label: "Quote", role: "body" },
    { key: "caption", label: "Caption", role: "body" },
    { key: "cta", label: "CTA", role: "body" },
  ];

export function NarrativeBlockAppearancePanel({
  block,
  templateKey,
  viewport,
  capability,
  library,
  projectColors,
  onChange,
  activeDisclosure,
  onDisclosureChange,
  onAddColor,
  context,
}: {
  block: StoryBlock;
  templateKey: string;
  viewport: ResponsiveViewport;
  capability: ElementCapability;
  library: TemplateDesignLibrary;
  projectColors: ProjectColor[];
  onChange: (block: StoryBlock) => void;
  activeDisclosure: NarrativeTypographySlotKey | null;
  onDisclosureChange: (key: NarrativeTypographySlotKey | null) => void;
  onAddColor: (value: string) => Promise<ProjectColor>;
  context: ResolvedDesignContext | null;
}) {
  const contract = capability.narrativeBlock;
  if (!contract)
    return (
      <p className="text-sm text-foreground-muted">
        This Template does not advertise Narrative Block appearance controls.
      </p>
    );

  const composition = resolveNarrativeComposition({
    block,
    capability: contract.composition,
  });
  const setComposition = <K extends Exclude<keyof StoryBlock["composition"], "presentation">>(
    property: K,
    value: StoryBlock["composition"][K],
  ) =>
    onChange({
      ...block,
      composition: authorNarrativeComposition(block.composition, property, value),
    });
  const resetComposition = (property?: keyof StoryBlock["composition"]) =>
    onChange({
      ...block,
      composition: resetNarrativeComposition(block.composition, property),
    });
  const mediaNote = !composition.availability.mediaTreatment
    ? composition.rendering.hasActiveVisibleMedia
      ? "Media controls are unavailable for this block."
      : "Add or show media to use this control."
    : undefined;

  const update = (key: SlotKey, appearance: Appearance | undefined) => {
    const slot = block.slots[key];
    const nextSlot = {
      ...slot,
      ...(appearance && Object.keys(appearance).length ? { appearance } : {}),
    };
    if (!appearance || Object.keys(appearance).length === 0)
      delete nextSlot.appearance;
    onChange({ ...block, slots: { ...block.slots, [key]: nextSlot } });
  };
  const colorOptions = (role: "heading" | "body", inheritedColorName?: string) => {
    const capabilityRole = role === "heading" ? "headingColor" : "textColor";
    const allowed =
      capability.appearance?.colors.find(
        (control) => control.role === capabilityRole,
      )?.allowedColorIds ?? [];
    return [
      { value: "", label: `Inherited${inheritedColorName ? ` · ${inheritedColorName}` : ""}` },
      ...allowed.map((id) => ({
        value: id,
        label:
          library.colors.find((color) => color.id === id)?.displayName ?? id,
      })),
    ];
  };
  const legacyBackground = narrativeLegacyBackgroundLabel(block);
  const authoredFrameStyle = block.slots.media.appearance?.frameStyle;
  const effectiveFrameStyle = authoredFrameStyle === undefined
    ? contract.appearance.media.defaultFrameStyle
    : authoredFrameStyle;
  const activeFrameCapability = effectiveFrameStyle && effectiveFrameStyle !== "none"
    ? contract.appearance.media.frameStyles.find(({ key }) => key === effectiveFrameStyle)
    : undefined;

  return (
    <div className="space-y-5">
      <InspectorSection title="Layout">
        <VisualControl
          label="Media placement"
          value={block.composition.mediaPlacement ?? composition.effective.mediaPlacement ?? ""}
          options={composition.options.mediaPlacements.map((value) => visualOption("placement", value))}
          showIllustration={false}
          layout="stack"
          disabled={!composition.availability.mediaPlacement}
          onChange={(value) =>
            setComposition(
              "mediaPlacement",
              value as NonNullable<StoryBlock["composition"]["mediaPlacement"]>,
            )
          }
          onReset={() => resetComposition("mediaPlacement")}
          resetDisabled={!block.composition.mediaPlacement}
        />
        {block.composition.mediaPlacement &&
          !composition.compatibility.mediaPlacementAuthoredIsActive &&
          composition.availability.mediaPlacement && (
            <p className="text-xs text-foreground-muted">
              Saved choice: {compositionLabel(block.composition.mediaPlacement)}{" "}
              - inactive for the current layout.
            </p>
          )}
        <VisualControl
          label="Text alignment"
          value={composition.effective.textAlignment}
          options={composition.options.textAlignments.map((value) => visualOption("alignment", value))}
          layout="inline"
          onChange={(value) =>
            setComposition(
              "textAlignment",
              value as NonNullable<StoryBlock["composition"]["textAlignment"]>,
            )
          }
          onReset={() => resetComposition("textAlignment")}
          resetDisabled={!block.composition.textAlignment}
        />
      </InspectorSection>
      <InspectorSection title="Media">
        <VisualControl
          label="Treatment"
          value={block.composition.mediaTreatment ?? composition.effective.mediaTreatment ?? ""}
          options={composition.options.mediaTreatments.map((value) => visualOption("treatment", value))}
          showIllustration={false}
          layout="stack"
          disabled={!composition.availability.mediaTreatment}
          onChange={(value) =>
            setComposition(
              "mediaTreatment",
              value as NonNullable<StoryBlock["composition"]["mediaTreatment"]>,
            )
          }
          onReset={() => resetComposition("mediaTreatment")}
          resetDisabled={!block.composition.mediaTreatment}
        />
        {block.composition.mediaTreatment &&
          !composition.compatibility.mediaTreatmentAuthoredIsActive &&
          composition.availability.mediaTreatment && (
            <p className="text-xs text-foreground-muted">
              Saved choice: {compositionLabel(block.composition.mediaTreatment)}{" "}
              - inactive for this placement.
            </p>
          )}
        {mediaNote && (
          <p className="text-xs text-foreground-muted">{mediaNote}</p>
        )}
        <VisualControl
          label="Corners"
          value={block.slots.media.appearance?.cornerStyle ?? ""}
          options={[
            { value: "", label: "Template Default", helper: "Use the template's native media corners", illustration: <CornerDiagram value="" /> },
            ...contract.appearance.media.cornerStyles.map((value) => ({
              value,
              label: compositionLabel(value),
              helper: value === "square" ? "Clean straight corners" : value === "soft" ? "Subtle rounded corners" : "More pronounced rounded corners",
              illustration: <CornerDiagram value={value} />,
            })),
          ]}
          showIllustration={false}
          layout="stack"
          onChange={(value) => onChange(applyNarrativeMediaCornerStyle(block, value ? value as "square" | "soft" | "rounded" : undefined))}
          onReset={() => onChange(applyNarrativeMediaCornerStyle(block))}
          resetDisabled={!block.slots.media.appearance?.cornerStyle}
        />
        {(contract.appearance.media.frameStyles.length > 0 || contract.appearance.media.defaultFrameStyle || block.slots.media.appearance?.frameStyle) && (
          <VisualControl label="Frame" value={block.slots.media.appearance?.frameStyle ?? ""} options={[
            { value: "", label: "Template Default", helper: "Use the template's native media frame", illustration: null },
            { value: "none", label: "None", helper: "Show no media frame", illustration: null },
            ...contract.appearance.media.frameStyles.filter(({ key }) => key !== "none").map(({ key, displayName }) => ({ value: key, label: displayName, illustration: null })),
          ]} showIllustration={false} layout="stack" onChange={(value) => onChange(applyNarrativeMediaFrameStyle(block, value || undefined))} onReset={() => onChange(applyNarrativeMediaFrameStyle(block))} resetDisabled={!block.slots.media.appearance?.frameStyle} />
        )}
        {activeFrameCapability?.supportsColor && (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="text-xs font-medium">Frame Color</p>
              {block.slots.media.appearance?.frameColorId && <InspectorResetAction onClick={() => onChange(applyNarrativeMediaFrameColor(block))} />}
            </div>
            <WebsiteColorSwatchControl
              label="Narrative media frame color"
              colorId={block.slots.media.appearance?.frameColorId}
              inheritLabel="Template Default"
              allowedTemplateColorIds={contract.appearance.media.frameColorIds}
              templateColors={library.colors}
              projectColors={projectColors}
              onChange={(colorId) => onChange(applyNarrativeMediaFrameColor(block, colorId))}
              onAddColor={onAddColor}
            />
          </div>
        )}
        {activeFrameCapability?.sizes && (
          <Control
            label="Frame Size"
            value={block.slots.media.appearance?.frameSize ?? ""}
            options={[
              { value: "", label: "Template Default" },
              ...activeFrameCapability.sizes.map((value) => ({ value, label: compositionLabel(value) })),
            ]}
            onChange={(value) => onChange(applyNarrativeMediaFrameSize(block, value ? value as "small" | "medium" | "large" : undefined))}
            onReset={() => onChange(applyNarrativeMediaFrameSize(block))}
            resetDisabled={!block.slots.media.appearance?.frameSize}
          />
        )}
      </InspectorSection>
      <InspectorSection title="Background">
        <div><p className="mb-1.5 text-xs font-medium">Background Color</p><WebsiteColorSwatchControl label="Narrative Block background color" inheritLabel="No Background" colorId={block.appearance?.backgroundColorId} inheritSelected={!block.appearance?.backgroundColorId && !legacyBackground} showUnresolvedWarning={!legacyBackground} allowedTemplateColorIds={contract.appearance.backgroundColorIds} templateColors={library.colors} projectColors={projectColors} onChange={(colorId) => onChange(applyNarrativeBackgroundColor(block, colorId))} onAddColor={onAddColor} />{legacyBackground && <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-surface-muted px-2.5 py-2 text-xs text-foreground-muted" role="status"><span className="size-5 shrink-0 rounded-full border border-border bg-surface" aria-hidden="true" /><span><span className="font-medium text-foreground">Current saved background</span><span className="ml-1.5">{legacyBackground}</span></span></div>}</div>
        {(["texture", "pattern"] as const).map((kind) => { const background = block.appearance?.decorativeAppearance?.background; const value = background?.[kind] ?? ""; const strengthField = kind === "texture" ? "textureStrength" : "patternStrength"; const strength = background?.[strengthField]; const options = contract.appearance.decorativeAppearance[kind === "texture" ? "textures" : "patterns"]; return <div key={kind} className="space-y-3"><div><div className="mb-1.5 flex items-center justify-between gap-2"><p className="text-xs font-medium">{decorativeLabel(kind)}</p>{background?.[kind] !== undefined && <InspectorResetAction onClick={() => onChange(applyNarrativeDecoration(block, kind))} />}</div><InspectorVisualChoiceGroup label={`Narrative ${kind}`} layout="stack" showIllustration={false} value={value} options={options.map((option) => ({ value: option, label: decorativeLabel(option), helper: decorativeHelpers[kind][option], illustration: null }))} onChange={(next) => onChange(applyNarrativeDecoration(block, kind, next))} /></div>{value && value !== "none" && <DecorativeStrengthControl label={kind === "texture" ? "Texture Strength" : "Pattern Strength"} value={strength} defaultValue={resolveDecorativeDefaultStrength(templateKey, kind, value)} onChange={(next) => onChange(applyNarrativeDecoration(block, strengthField, next))} />}</div>; })}
      </InspectorSection>
      <InspectorSection title="Typography" description={`Size applies to ${title(viewport)}.`}>
      {groups.map(({ key, label, role }) => {
        const slot = block.slots[key];
        const appearance = slot.appearance ?? {};
        const set = <K extends keyof Appearance>(
          property: K,
          value: Appearance[K] | undefined,
        ) => {
          const next = { ...appearance };
          if (value === undefined || value === "") delete next[property];
          else next[property] = value;
          update(key, next);
        };
        const sizes = contract.appearance.fontSizeOptions.map((value) => ({
          value,
          label: value.toUpperCase(),
        }));
        const fontName = appearance.fontFamilyId ? library.fontFamilies.find(({ id }) => id === appearance.fontFamilyId)?.displayName ?? "Custom font" : "Inherited";
        const sizeName = appearance.fontSize?.[viewport]?.toUpperCase() ?? "Default";
        const inheritedFontId = role === "heading" ? context?.headingFontId : context?.bodyFontId;
        const inheritedFontName = inheritedFontId ? library.fontFamilies.find(({ id }) => id === inheritedFontId)?.displayName : undefined;
        const inheritedColorId = role === "heading" ? context?.headingColorId : context?.bodyColorId;
        const inheritedColorName = inheritedColorId ? library.colors.find(({ id }) => id === inheritedColorId)?.displayName : undefined;
        const summary = slot.isHidden
          ? `Hidden · ${fontName}${appearance.fontSize?.[viewport] ? ` · ${sizeName}` : ""}`
          : `${fontName} · ${sizeName}`;
        const hasOverrides = Boolean(appearance.fontFamilyId || appearance.lineSpacing || appearance.letterSpacing || appearance.colorId || Object.keys(appearance.fontSize ?? {}).length);
        return (
          <InspectorDisclosure key={key} open={activeDisclosure === key} onOpenChange={(open) => onDisclosureChange(open ? key : null)} title={label} summary={summary} actions={hasOverrides ? <Button type="button" size="sm" variant="ghost" className="h-9 w-9 shrink-0 p-0 text-foreground/80 hover:text-foreground" aria-label={`Reset all ${label} typography`} title={`Reset all ${label} typography`} onClick={() => update(key, undefined)}><RotateCcw size={17} strokeWidth={2} aria-hidden="true" /></Button> : undefined}>
            <div><div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-xs font-medium">Font</label>{appearance.fontFamilyId && <InspectorResetAction onClick={() => set("fontFamilyId", undefined)} />}</div><FontPicker value={appearance.fontFamilyId ?? ""} role={role} library={library} inheritedLabel={`Inherited${inheritedFontName ? ` · ${inheritedFontName}` : ""}`} onChange={(value) => set("fontFamilyId", value || undefined)} /></div>
            <Control
              label={`Size · ${title(viewport)}`}
              value={appearance.fontSize?.[viewport] ?? ""}
              options={[{ value: "", label: "Template default" }, ...sizes]}
              onChange={(value) => {
                const fontSize = { ...appearance.fontSize };
                if (value)
                  fontSize[viewport] =
                    value as (typeof fontSize)[typeof viewport];
                else delete fontSize[viewport];
                set(
                  "fontSize",
                  Object.keys(fontSize).length ? fontSize : undefined,
                );
              }}
              onReset={() => {
                const fontSize = { ...appearance.fontSize };
                delete fontSize[viewport];
                set(
                  "fontSize",
                  Object.keys(fontSize).length ? fontSize : undefined,
                );
              }}
              resetDisabled={!appearance.fontSize?.[viewport]}
            />
            <Control
              label="Line spacing"
              value={appearance.lineSpacing ?? ""}
              options={[
                { value: "", label: "Template default" },
                ...["tight", "normal", "relaxed"].map((value) => ({
                  value,
                  label: title(value),
                })),
              ]}
              onChange={(value) =>
                set(
                  "lineSpacing",
                  value ? (value as Appearance["lineSpacing"]) : undefined,
                )
              }
              onReset={() => set("lineSpacing", undefined)}
              resetDisabled={!appearance.lineSpacing}
            />
            <Control
              label="Letter spacing"
              value={appearance.letterSpacing ?? ""}
              options={[
                { value: "", label: "Template default" },
                ...["tight", "normal", "wide"].map((value) => ({
                  value,
                  label: title(value),
                })),
              ]}
              onChange={(value) =>
                set(
                  "letterSpacing",
                  value ? (value as Appearance["letterSpacing"]) : undefined,
                )
              }
              onReset={() => set("letterSpacing", undefined)}
              resetDisabled={!appearance.letterSpacing}
            />
            <div><div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-xs font-medium">Color</label>{appearance.colorId && <InspectorResetAction onClick={() => set("colorId", undefined)} />}</div><WebsiteColorSwatchControl label={`${label} color${inheritedColorName ? `, inherited ${inheritedColorName}` : ""}`} colorId={appearance.colorId} allowedTemplateColorIds={colorOptions(role).slice(1).map(({ value }) => value)} templateColors={library.colors} projectColors={projectColors} onChange={(value) => set("colorId", value)} onAddColor={onAddColor} /></div>
          </InspectorDisclosure>
        );
      })}
      </InspectorSection>
      <p className="text-xs text-foreground-muted">
        <strong>Divider:</strong> styling is Template-owned.
      </p>
      <p className="text-xs text-foreground-muted">
        <strong>Media:</strong> framing and layout controls are deferred.
      </p>
    </div>
  );
}

function VisualControl({ label, value, options, onChange, onReset, resetDisabled, disabled = false, variant = "compact", columns = 3, showIllustration = true, layout = "grid" }: {
  label: string;
  value: string;
  options: Array<InspectorVisualChoiceOption<string>>;
  onChange: (value: string) => void;
  onReset: () => void;
  resetDisabled: boolean;
  disabled?: boolean;
  variant?: "compact" | "large";
  columns?: 2 | 3;
  showIllustration?: boolean;
  layout?: "grid" | "stack" | "inline";
}) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-3"><span className="text-xs font-medium">{label}</span>{!resetDisabled && <InspectorResetAction onClick={onReset} />}</div><InspectorVisualChoiceGroup label={label} value={value} options={options} onChange={onChange} disabled={disabled} variant={variant} columns={columns} showIllustration={showIllustration} layout={layout} /></div>;
}

function visualOption(kind: "placement" | "treatment" | "alignment", value: string): InspectorVisualChoiceOption<string> {
  const helpers: Partial<Record<typeof kind, Record<string, string>>> = {
    placement: { leading: "Media leads the flow", trailing: "Media follows the text", above: "Media above text", below: "Media below text", splitStart: "Media on the start side", splitEnd: "Media on the end side", inset: "Media sits within the text flow" },
    treatment: { standard: "Balanced media footprint", wide: "Wider visual emphasis", cinematic: "Wide, cinematic framing", fullBleed: "Media reaches the composition edge" },
  };
  const alignmentLabels: Record<string, string> = { start: "Align text to start", center: "Center text", end: "Align text to end" };
  return { value, label: compositionLabel(value), helper: helpers[kind]?.[value], illustration: <SemanticDiagram kind={kind} value={value} />, ariaLabel: kind === "alignment" ? alignmentLabels[value] : undefined };
}

function SemanticDiagram({ kind, value }: { kind: "placement" | "treatment" | "alignment"; value: string }) {
  if (kind === "alignment") {
    const Icon = value === "center" ? AlignCenter : value === "end" ? AlignRight : AlignLeft;
    return <span className="flex h-full items-center justify-center text-foreground-muted"><Icon size={22} strokeWidth={1.7} /></span>;
  }
  if (kind === "treatment") {
    const media = value === "fullBleed" ? "inset-x-0 w-full" : value === "wide" ? "left-[8%] w-[84%]" : value === "cinematic" ? "left-[5%] top-[38%] h-[28%] w-[90%]" : "left-[20%] w-[60%]";
    return <span className="relative block h-full overflow-hidden rounded-sm border border-foreground-muted/25"><span className={`absolute top-[22%] h-[56%] rounded-[1px] bg-foreground-muted/45 ${media}`} /></span>;
  }
  return <PlacementDiagram value={value} />;
}

function PlacementDiagram({ value }: { value: string }) {
  const media = <span className="rounded-[1px] bg-foreground-muted/50" />;
  const text = <span className="flex flex-col justify-center gap-1"><TextBars width="full" /><TextBars width="three-quarters" /></span>;
  if (value === "above") return <span className="grid h-full grid-rows-2 gap-1">{media}{text}</span>;
  if (value === "below") return <span className="grid h-full grid-rows-2 gap-1">{text}{media}</span>;
  if (value === "trailing" || value === "splitEnd") return <span className={`grid h-full ${value === "splitEnd" ? "grid-cols-2 gap-0" : "grid-cols-[1.25fr_.75fr] gap-1"}`}>{text}{media}</span>;
  if (value === "inset") return <span className="relative flex h-full flex-col justify-center gap-1"><TextBars width="full" /><span className="absolute bottom-1 right-1 h-5 w-7 rounded-[1px] border border-surface bg-foreground-muted/55" /><TextBars width="three-quarters" /></span>;
  return <span className={`grid h-full ${value === "splitStart" ? "grid-cols-2 gap-0" : "grid-cols-[.75fr_1.25fr] gap-1"}`}>{media}{text}</span>;
}

function TextBars({ width, strong = false }: { width: "full" | "three-quarters" | "half"; strong?: boolean }) {
  return <span className={`block h-1 rounded-full ${strong ? "bg-foreground-muted/65" : "bg-foreground-muted/40"} ${width === "full" ? "w-full" : width === "three-quarters" ? "w-3/4" : "w-1/2"}`} />;
}

function CornerDiagram({ value }: { value: string }) {
  const radius = value === "rounded" ? "rounded-lg" : value === "soft" ? "rounded-sm" : "rounded-none";
  return <span className="flex h-full items-center justify-center"><span className={`h-8 w-12 border border-foreground-muted/45 bg-foreground-muted/25 ${radius}`} /></span>;
}

function Control({
  label,
  value,
  options,
  onChange,
  onReset,
  resetDisabled,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  onReset: () => void;
  resetDisabled: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-xs font-medium">{label}</label>
        {!resetDisabled && <InspectorResetAction onClick={onReset} />}
      </div>
      <Select
        value={value}
        options={options}
        aria-label={label}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function compositionLabel(value: string) {
  const labels: Record<string, string> = {
    leading: "Leading",
    trailing: "Trailing",
    above: "Above",
    below: "Below",
    splitStart: "Split Start",
    splitEnd: "Split End",
    inset: "Inset",
    standard: "Standard",
    wide: "Wide",
    cinematic: "Cinematic",
    fullBleed: "Full Bleed",
    square: "Square",
    soft: "Soft",
    rounded: "Rounded",
    start: "Start",
    center: "Center",
    end: "End",
  };
  return labels[value] ?? title(value);
}
