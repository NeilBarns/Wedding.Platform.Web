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
  resetNarrativeComposition,
  resolveNarrativeComposition,
} from "../../websiteRenderer/narrativeComposition";
import type { NarrativeTypographySlotKey } from "../narrativeSlotFocus";

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
  viewport,
  capability,
  library,
  onChange,
  activeDisclosure,
  onDisclosureChange,
  context,
}: {
  block: StoryBlock;
  viewport: ResponsiveViewport;
  capability: ElementCapability;
  library: TemplateDesignLibrary;
  onChange: (block: StoryBlock) => void;
  activeDisclosure: NarrativeTypographySlotKey | null;
  onDisclosureChange: (key: NarrativeTypographySlotKey | null) => void;
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
  const setComposition = <K extends keyof StoryBlock["composition"]>(
    property: K,
    value: StoryBlock["composition"][K],
  ) =>
    onChange({
      ...block,
      composition: { ...block.composition, [property]: value },
    });
  const resetComposition = (property?: keyof StoryBlock["composition"]) =>
    onChange({
      ...block,
      composition: resetNarrativeComposition(block.composition, property),
    });
  const mediaNote =
    composition.effective.presentation === "textOnly"
      ? "Media controls are inactive for Text Only."
      : !composition.rendering.hasActiveVisibleMedia
        ? "Add or show media to use this control."
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

  return (
    <div className="space-y-5">
      <InspectorSection title="Layout">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Block composition</p>
          {!(block.composition.presentation === "editorial" && Object.keys(block.composition).length === 1) && <InspectorResetAction label="Reset all" onClick={() => resetComposition()} />}
        </div>
        <VisualControl
          label="Presentation"
          value={composition.effective.presentation}
          options={composition.options.presentations.map((value) => visualOption("presentation", value))}
          showIllustration={false}
          layout="stack"
          onChange={(value) => setComposition("presentation", value as StoryBlock["composition"]["presentation"])}
          onReset={() => resetComposition("presentation")}
          resetDisabled={block.composition.presentation === "editorial"}
        />
        {composition.warning && (
          <p
            className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground-muted"
            role="status"
          >
            {composition.warning.message}
          </p>
        )}
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
              - inactive for this presentation.
            </p>
          )}
        <VisualControl
          label="Media treatment"
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
        <VisualControl
          label="Surface"
          value={composition.effective.surface}
          options={composition.options.surfaces.map((value) => visualOption("surface", value))}
          showIllustration={false}
          layout="stack"
          onChange={(value) =>
            setComposition(
              "surface",
              value as NonNullable<StoryBlock["composition"]["surface"]>,
            )
          }
          onReset={() => resetComposition("surface")}
          resetDisabled={!block.composition.surface}
        />
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
            <Control
              label="Color"
              value={appearance.colorId ?? ""}
              options={colorOptions(role, inheritedColorName)}
              onChange={(value) => set("colorId", value || undefined)}
              onReset={() => set("colorId", undefined)}
              resetDisabled={!appearance.colorId}
            />
          </InspectorDisclosure>
        );
      })}
      </InspectorSection>
      <p className="text-xs text-foreground-muted">
        <strong>Divider:</strong> presentation is Template-owned.
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

function visualOption(kind: "presentation" | "placement" | "treatment" | "alignment" | "surface", value: string): InspectorVisualChoiceOption<string> {
  const helpers: Partial<Record<typeof kind, Record<string, string>>> = {
    presentation: { editorial: "Balanced story", mediaFirst: "Media leads", quoteLed: "Statement leads", textOnly: "Words only" },
    placement: { leading: "Media leads the flow", trailing: "Media follows the text", above: "Media above text", below: "Media below text", splitStart: "Media on the start side", splitEnd: "Media on the end side", inset: "Media sits within the text flow" },
    treatment: { standard: "Balanced media footprint", wide: "Wider visual emphasis", cinematic: "Wide, cinematic framing", fullBleed: "Media reaches the composition edge" },
    surface: { none: "No added surface", soft: "Subtle background treatment", feature: "Stronger visual emphasis" },
  };
  const alignmentLabels: Record<string, string> = { start: "Align text to start", center: "Center text", end: "Align text to end" };
  return { value, label: compositionLabel(value), helper: helpers[kind]?.[value], illustration: <SemanticDiagram kind={kind} value={value} />, ariaLabel: kind === "alignment" ? alignmentLabels[value] : undefined };
}

function SemanticDiagram({ kind, value }: { kind: "presentation" | "placement" | "treatment" | "alignment" | "surface"; value: string }) {
  if (kind === "alignment") {
    const Icon = value === "center" ? AlignCenter : value === "end" ? AlignRight : AlignLeft;
    return <span className="flex h-full items-center justify-center text-foreground-muted"><Icon size={22} strokeWidth={1.7} /></span>;
  }
  if (kind === "surface") {
    const fill = value === "feature" ? "bg-foreground-muted/25" : value === "soft" ? "bg-foreground-muted/10" : "bg-transparent";
    return <span className="flex h-full items-center justify-center"><span className={`relative h-7 w-12 rounded-sm border border-foreground-muted/45 ${fill}`}><span className="absolute left-2 right-2 top-2 h-0.5 bg-foreground-muted/55" /><span className="absolute left-2 right-4 top-4 h-0.5 bg-foreground-muted/35" /></span></span>;
  }
  if (kind === "treatment") {
    const media = value === "fullBleed" ? "inset-x-0 w-full" : value === "wide" ? "left-[8%] w-[84%]" : value === "cinematic" ? "left-[5%] top-[38%] h-[28%] w-[90%]" : "left-[20%] w-[60%]";
    return <span className="relative block h-full overflow-hidden rounded-sm border border-foreground-muted/25"><span className={`absolute top-[22%] h-[56%] rounded-[1px] bg-foreground-muted/45 ${media}`} /></span>;
  }
  if (kind === "placement") return <PlacementDiagram value={value} />;
  if (value === "textOnly") return <span className="flex h-full flex-col justify-center gap-1 px-2"><TextBars width="full" /><TextBars width="three-quarters" /><TextBars width="half" /></span>;
  if (value === "quoteLed") return <span className="relative flex h-full flex-col justify-center gap-1 px-2"><span className="absolute left-1 top-0 text-xl leading-none text-foreground-muted/50">“</span><TextBars width="full" strong /><TextBars width="three-quarters" strong /><TextBars width="half" /></span>;
  if (value === "mediaFirst") return <span className="grid h-full grid-rows-[2fr_1fr] gap-1"><span className="rounded-sm bg-foreground-muted/45" /><span className="flex flex-col gap-1 px-1"><TextBars width="full" /><TextBars width="half" /></span></span>;
  return <span className="grid h-full grid-cols-[1fr_1.1fr] gap-1.5"><span className="flex flex-col justify-center gap-1"><TextBars width="full" /><TextBars width="three-quarters" /><TextBars width="half" /></span><span className="rounded-sm bg-foreground-muted/40" /></span>;
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
    editorial: "Editorial",
    mediaFirst: "Media First",
    quoteLed: "Quote Led",
    textOnly: "Text Only",
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
    start: "Start",
    center: "Center",
    end: "End",
    none: "None",
    soft: "Soft Surface",
    feature: "Feature Surface",
  };
  return labels[value] ?? title(value);
}
