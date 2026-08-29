import { AlignCenter, AlignLeft, AlignRight, Check, Link2, Unlink2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { Tooltip } from "../../../components/ui/Tooltip";
import { SelectableCard } from "../../../components/ui/SelectableCard";
import type {
  DesignOption,
  MediaSpacing,
  MediaSpacingValue,
  WebsiteSectionAppearance,
  ResponsiveViewport,
  WebsiteSectionResponsiveAppearance,
} from "../types";
import { controlCapability, controlDefault, controlForViewport, optionValues, presentationCapability, supportsControl } from "../../websiteCapabilities/lookup";
import type { AppearanceControlCapability, PresentationCapability, SectionCapability } from "../../websiteCapabilities/types";
import { canonicalizeResponsiveAppearance, pruneResponsiveAppearance, resolveSectionAppearanceForViewport } from "../responsiveAppearance";
import { PresentationPicker } from "./PresentationPicker";
import { InspectorSection } from "./InspectorPrimitives";
import { InspectorVisualChoiceGroup } from "./InspectorVisualChoice";

export function AppearancePanel({
  appearance,
  sectionCapability,
  targetViewport,
  error,
  onChange,
}: {
  appearance: WebsiteSectionAppearance;
  sectionCapability: SectionCapability;
  targetViewport: ResponsiveViewport;
  error: string | null;
  onChange: (appearance: WebsiteSectionAppearance) => void;
}) {
  const presentation = appearance.presentation ?? sectionCapability.defaultPresentation ?? undefined
  const activePresentation = presentationCapability(sectionCapability, presentation)
  const effectiveAppearance = resolveSectionAppearanceForViewport(appearance, targetViewport, sectionCapability)
  const activeOverride = targetViewport === 'desktop' ? undefined : appearance.responsive?.[targetViewport]
  const setResponsiveValue = (setting: keyof WebsiteSectionResponsiveAppearance, value: WebsiteSectionResponsiveAppearance[keyof WebsiteSectionResponsiveAppearance]) => {
    if (targetViewport === 'desktop') return onChange({ ...appearance, [setting]: value })
    const responsive = { ...appearance.responsive }
    const override = { ...responsive[targetViewport] }
    Object.assign(override, { [setting]: value })
    if (Object.keys(override).length > 0) responsive[targetViewport] = override
    else delete responsive[targetViewport]
    onChange(canonicalizeResponsiveAppearance({ ...appearance, responsive }, sectionCapability))
  }
  const resetResponsive = () => {
    if (targetViewport === 'desktop') return
    const responsive = { ...appearance.responsive }
    delete responsive[targetViewport]
    onChange(pruneResponsiveAppearance({ ...appearance, responsive }))
  }
  if (sectionCapability.id === 'story') {
    return <div className="space-y-5">
      {error && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{error}</p>}
      <StorySectionAppearanceControls sectionCapability={sectionCapability} presentation={presentation} appearance={appearance} onChange={onChange} />
    </div>
  }
  return (
    <div className="space-y-5">
      {error && (
        <p
          className="rounded-xl bg-danger-muted p-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      {sectionCapability.id !== 'story' && targetViewport !== 'desktop' && <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted p-3">
        <div><p className="text-sm font-semibold">Editing {targetViewport} layout</p><p className="text-xs text-foreground-muted">{activeOverride ? 'Custom overrides are active.' : 'Using Template defaults.'}</p></div>
        <Button size="sm" variant="secondary" type="button" disabled={!activeOverride} onClick={resetResponsive}>Restore {targetViewport} defaults</Button>
      </div>}
      {sectionCapability.id !== 'story' && sectionCapability.defaultPresentation && <InspectorSection title="Layout">{supportsControl(sectionCapability, 'presentation', presentation) && <PresentationPicker
        capability={sectionCapability}
        value={appearance.presentation ?? sectionCapability.defaultPresentation ?? ''}
        onChange={(presentation) => {
          const controls = presentationCapability(sectionCapability, presentation)?.appearanceControls ?? []
          const next: WebsiteSectionAppearance = { ...appearance, presentation }
          for (const key of ['mediaPlacement', 'mediaSize', 'frameStyle', 'cornerStyle', 'shadowStyle', 'overlayStrength', 'foregroundColor', 'mediaSpacing', 'mediaContentGap'] as const) delete next[key]
          for (const control of controls) Object.assign(next, { [control.id]: control.type === 'spacing' ? { ...control.default } : control.default })
          onChange(canonicalizeResponsiveAppearance(next, sectionCapability))
        }}
      />}
      <MediaStyleControls
        key={appearance.presentation ?? sectionCapability.defaultPresentation}
        sectionCapability={sectionCapability}
        presentation={activePresentation}
        appearance={effectiveAppearance}
        baseAppearance={appearance}
        targetViewport={targetViewport}
        activeOverride={activeOverride}
        onResponsiveChange={setResponsiveValue}
        onChange={onChange}
      /></InspectorSection>}
      <InspectorSection title="Alignment">
      {(() => {
        const control = controlForViewport(controlCapability(sectionCapability, 'headingAlignment', presentation), targetViewport)
        if (control?.type !== 'option') return null
        return <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
          Heading alignment {targetViewport !== 'desktop' && <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">{activeOverride?.headingAlignment === undefined ? 'Template default' : 'Override'}</span>}
        </legend>
        <OptionGrid
          options={control.options}
          value={effectiveAppearance.headingAlignment}
          onSelect={(headingAlignment) =>
            setResponsiveValue('headingAlignment', headingAlignment)
          }
          alignment
        />
      </fieldset>
      })()}
      {(() => {
        const control = controlForViewport(controlCapability(sectionCapability, 'bodyAlignment', presentation), targetViewport)
        if (control?.type !== 'option') return null
        return <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
          Content alignment {targetViewport !== 'desktop' && <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">{activeOverride?.bodyAlignment === undefined ? 'Template default' : 'Override'}</span>}
        </legend>
        <OptionGrid
          options={control.options}
          value={effectiveAppearance.bodyAlignment}
          onSelect={(bodyAlignment) =>
            setResponsiveValue('bodyAlignment', bodyAlignment)
          }
          alignment
        />
      </fieldset>
      })()}
      </InspectorSection>
      <SectionAppearanceControls sectionCapability={sectionCapability} presentation={presentation} appearance={appearance} onChange={onChange} />
    </div>
  );
}

function StorySectionAppearanceControls({ sectionCapability, presentation, appearance, onChange }: { sectionCapability: SectionCapability; presentation: string | undefined; appearance: WebsiteSectionAppearance; onChange: (appearance: WebsiteSectionAppearance) => void }) {
  const background = controlCapability(sectionCapability, 'backgroundTreatment', presentation)
  if (background?.type !== 'option') return null
  const helpers: Record<string, string> = {
    inherit: 'Use the template background',
    plain: 'Simple neutral background',
    soft: 'Subtle background treatment',
    accent: 'Stronger background emphasis',
  }
  return <InspectorSection title="Background">
    <InspectorVisualChoiceGroup
      label="Story background"
      layout="stack"
      showIllustration={false}
      value={appearance.backgroundTreatment}
      options={background.options.map((option) => ({ value: option.key, label: option.displayName, helper: helpers[option.key], illustration: null }))}
      onChange={(backgroundTreatment) => onChange({ ...appearance, backgroundTreatment: backgroundTreatment as WebsiteSectionAppearance['backgroundTreatment'] })}
    />
  </InspectorSection>
}

function SectionAppearanceControls({ sectionCapability, presentation, appearance, onChange }: { sectionCapability: SectionCapability; presentation: string | undefined; appearance: WebsiteSectionAppearance; onChange: (appearance: WebsiteSectionAppearance) => void }) {
  const background = controlCapability(sectionCapability, 'backgroundTreatment', presentation)
  const emphasis = controlCapability(sectionCapability, 'emphasis', presentation)
  if (background?.type !== 'option' && emphasis?.type !== 'option') return null
  return <InspectorSection title="Section">
    {background?.type === 'option' && <fieldset><legend className="mb-2 text-sm font-semibold">Background</legend><OptionGrid options={background.options} value={appearance.backgroundTreatment} onSelect={(backgroundTreatment) => onChange({ ...appearance, backgroundTreatment: backgroundTreatment as WebsiteSectionAppearance['backgroundTreatment'] })} /></fieldset>}
    {emphasis?.type === 'option' && <fieldset><legend className="mb-2 text-sm font-semibold">Emphasis</legend><OptionGrid options={emphasis.options} value={appearance.emphasis} onSelect={(emphasisValue) => onChange({ ...appearance, emphasis: emphasisValue as WebsiteSectionAppearance['emphasis'] })} /></fieldset>}
  </InspectorSection>
}

function MediaStyleControls({ sectionCapability, presentation, appearance, baseAppearance, targetViewport, activeOverride, onResponsiveChange, onChange }: { sectionCapability: SectionCapability; presentation: PresentationCapability | undefined; appearance: WebsiteSectionAppearance; baseAppearance: WebsiteSectionAppearance; targetViewport: ResponsiveViewport; activeOverride?: WebsiteSectionResponsiveAppearance; onResponsiveChange: (setting: keyof WebsiteSectionResponsiveAppearance, value: WebsiteSectionResponsiveAppearance[keyof WebsiteSectionResponsiveAppearance]) => void; onChange: (appearance: WebsiteSectionAppearance) => void }) {
  if (!presentation || presentation.appearanceControls.length === 0) return null
  const capability = (id: AppearanceControlCapability['id']) => controlForViewport(controlCapability(sectionCapability, id, presentation.id), targetViewport)
  const groups = [
    ['Media placement', 'mediaPlacement', capability('mediaPlacement')],
    ['Media size', 'mediaSize', capability('mediaSize')],
    ['Frame style', 'frameStyle', capability('frameStyle')],
    ['Corners', 'cornerStyle', capability('cornerStyle')],
    ['Shadow', 'shadowStyle', capability('shadowStyle')],
  ] as const
  return <div className="space-y-4 border-y border-border py-4">
    {groups.map(([label, setting, control]) => control?.type === 'option' && <fieldset key={setting}>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">{label}{control.scope === 'responsive' && targetViewport !== 'desktop' && <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">{activeOverride?.[setting as keyof WebsiteSectionResponsiveAppearance] === undefined ? 'Template default' : 'Override'}</span>}</legend>
      <div className="grid grid-cols-2 gap-2">
        {control.options.map((option) => {
          const selected = (appearance[setting] ?? control.default) === option.key
          const frameControl = controlCapability(sectionCapability, 'frameStyle', presentation.id)
          const classicFrame = setting === 'frameStyle' && control.options.some((item) => item.key === 'heritage')
          const modernFrame = setting === 'frameStyle' && control.options.some((item) => item.key === 'boldEdge')
          const classicShadow = setting === 'shadowStyle' && optionValues(frameControl).some((item) => item.key === 'heritage')
          const modernShadow = setting === 'shadowStyle' && optionValues(frameControl).some((item) => item.key === 'boldEdge')
          const change = () => control.scope === 'responsive' ? onResponsiveChange(setting as keyof WebsiteSectionResponsiveAppearance, option.key) : onChange({ ...baseAppearance, [setting]: option.key })
          return <Button className={`justify-start ${selected ? 'border-accent! border-2 bg-surface-muted' : ''}`} key={option.key} size="sm" variant="secondary" type="button" aria-pressed={selected} onClick={change}>{classicFrame && <ClassicFramePreview frame={option.key} />}{modernFrame && <ModernFramePreview frame={option.key} />}{classicShadow && <ClassicShadowPreview shadow={option.key} />}{modernShadow && <ModernShadowPreview shadow={option.key} />}{option.displayName}</Button>
        })}
      </div>
    </fieldset>)}
    {capability('mediaSpacing')?.type === 'spacing' && <MediaSpacingControl capability={capability('mediaSpacing') as Extract<AppearanceControlCapability, { type: 'spacing' }>} appearance={appearance} inherited={targetViewport !== 'desktop' && activeOverride?.mediaSpacing === undefined} onChange={(spacing) => onResponsiveChange('mediaSpacing', spacing)} />}
    {capability('mediaContentGap')?.type === 'option' && <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">Gap between media and content{targetViewport !== 'desktop' && <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">{activeOverride?.mediaContentGap === undefined ? 'Template default' : 'Override'}</span>}</legend>
      <div className="grid grid-cols-2 gap-2">{optionValues(capability('mediaContentGap')).map((option) => { const selected = (appearance.mediaContentGap ?? controlDefault(capability('mediaContentGap'))) === option.key; return <Button className={selected ? 'border-accent! border-2 bg-surface-muted' : ''} key={option.key} size="sm" variant="secondary" type="button" aria-pressed={selected} onClick={() => onResponsiveChange('mediaContentGap', option.key)}>{option.displayName}</Button> })}</div>
    </fieldset>}
    {(() => {
      const control = capability('overlayStrength')
      return control?.type === 'number' && <fieldset>
        <div className="flex items-center justify-between gap-3"><legend className="text-sm font-semibold">Overlay strength</legend><span className="text-xs tabular-nums text-foreground-muted">{Math.round((appearance.overlayStrength ?? control.default) * 100)}%</span></div>
        <input className="mt-2 w-full cursor-pointer accent-accent" type="range" aria-label="Overlay strength" min={control.minimum} max={control.maximum} step={control.step} value={baseAppearance.overlayStrength ?? control.default} onChange={(event) => onChange({ ...baseAppearance, overlayStrength: Number(event.target.value) })} />
      </fieldset>
    })()}
    {capability('foregroundColor')?.type === 'option' && <fieldset>
      <legend className="mb-2 text-sm font-semibold">Text color</legend>
      <div className="grid grid-cols-2 gap-2">{optionValues(capability('foregroundColor')).map((option) => { const selected = (baseAppearance.foregroundColor ?? controlDefault(capability('foregroundColor'))) === option.key; return <Button className={selected ? 'border-accent! border-2 bg-surface-muted' : ''} key={option.key} size="sm" variant="secondary" type="button" aria-pressed={selected} onClick={() => onChange({ ...baseAppearance, foregroundColor: option.key })}><span className="size-4 rounded-full border border-border" style={{ backgroundColor: option.key }} />{option.displayName}</Button> })}</div>
    </fieldset>}
  </div>
}

function MediaSpacingControl({ capability, appearance, inherited, onChange }: { capability: Extract<AppearanceControlCapability, { type: 'spacing' }>; appearance: WebsiteSectionAppearance; inherited: boolean; onChange: (spacing: MediaSpacing) => void }) {
  const spacing = appearance.mediaSpacing ?? capability.default
  const [linked, setLinked] = useState(() => new Set(Object.values(spacing)).size === 1)
  const sides = ['top', 'right', 'bottom', 'left'] as const
  const update = (side: keyof MediaSpacing, value: string) => {
    const next = linked
      ? Object.fromEntries(sides.map((item) => [item, value])) as MediaSpacing
      : { ...spacing, [side]: value as MediaSpacingValue }
    onChange(next)
  }
  const toggleLinked = () => {
    if (linked) return setLinked(false)
    onChange(Object.fromEntries(sides.map((side) => [side, spacing.top])) as MediaSpacing)
    setLinked(true)
  }

  return <fieldset>
    <div className="mb-2 flex items-center justify-between gap-2"><legend className="flex items-center gap-2 text-sm font-semibold">Media spacing{inherited && <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Template default</span>}</legend><Tooltip label={linked ? 'Unlink spacing sides' : 'Link spacing sides'}><IconButton size="sm" type="button" aria-label={linked ? 'Unlink spacing sides' : 'Link spacing sides'} aria-pressed={linked} onClick={toggleLinked}>{linked ? <Link2 size={15} /> : <Unlink2 size={15} />}</IconButton></Tooltip></div>
    <div className="grid grid-cols-[3.25rem_3.25rem_3.25rem] items-center justify-center gap-2 rounded-md border border-border bg-surface-muted p-3">
      <div className="col-start-2"><MediaSpacingSideControl side="top" value={spacing.top} options={capability.options} onChange={(value) => update('top', value)} /></div>
      <div className="col-start-1 row-start-2"><MediaSpacingSideControl side="left" value={spacing.left} options={capability.options} onChange={(value) => update('left', value)} /></div>
      <div className="col-start-2 row-start-2 grid h-16 place-items-center border border-dashed border-foreground-muted/50 bg-background text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">Media</div>
      <div className="col-start-3 row-start-2"><MediaSpacingSideControl side="right" value={spacing.right} options={capability.options} onChange={(value) => update('right', value)} /></div>
      <div className="col-start-2 row-start-3"><MediaSpacingSideControl side="bottom" value={spacing.bottom} options={capability.options} onChange={(value) => update('bottom', value)} /></div>
    </div>
  </fieldset>
}

function MediaSpacingSideControl({ side, value, options, onChange }: { side: keyof MediaSpacing; value: MediaSpacingValue; options: DesignOption[]; onChange: (value: MediaSpacingValue) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const sideLabel = side[0].toUpperCase() + side.slice(1)
  const selectedLabel = options.find((option) => option.key === value)?.displayName ?? value

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return <div className="relative" ref={rootRef} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
    <button className="flex min-h-10 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-background px-1.5 py-1 text-foreground transition-colors hover:border-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" type="button" aria-label={`${sideLabel} media spacing: ${selectedLabel}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} onClick={() => setOpen((current) => !current)}>
      <MediaSpacingPreview side={side} value={value} />
    </button>
    {open && <div className={`absolute z-40 mt-1 grid w-32 grid-cols-2 gap-1.5 rounded-md border border-border bg-surface p-2 shadow-[var(--shadow-dialog)] ${side === 'right' ? 'right-0' : side === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'}`} id={listboxId} role="listbox" aria-label={`${sideLabel} media spacing options`}>
      {options.map((option) => { const optionValue = option.key as MediaSpacingValue; const selected = optionValue === value; return <SelectableCard className="flex h-12 items-center justify-center p-1.5" key={option.key} role="option" aria-label={`${sideLabel} media spacing: ${option.displayName}`} aria-selected={selected} selected={selected} onClick={() => onChange(optionValue)}><MediaSpacingPreview side={side} value={optionValue} /></SelectableCard> })}
    </div>}
  </div>
}

function MediaSpacingPreview({ side, value }: { side: keyof MediaSpacing; value: MediaSpacingValue }) {
  const mediaClass = side === 'left'
    ? value === 'none' ? 'bottom-0 left-0 right-0 top-0' : value === 'small' ? 'bottom-0 left-1 right-0 top-0' : value === 'medium' ? 'bottom-0 left-2 right-0 top-0' : 'bottom-0 left-3 right-0 top-0'
    : side === 'right'
      ? value === 'none' ? 'bottom-0 left-0 right-0 top-0' : value === 'small' ? 'bottom-0 left-0 right-1 top-0' : value === 'medium' ? 'bottom-0 left-0 right-2 top-0' : 'bottom-0 left-0 right-3 top-0'
      : side === 'top'
        ? value === 'none' ? 'bottom-0 left-0 right-0 top-0' : value === 'small' ? 'bottom-0 left-0 right-0 top-1' : value === 'medium' ? 'bottom-0 left-0 right-0 top-2' : 'bottom-0 left-0 right-0 top-3'
        : value === 'none' ? 'bottom-0 left-0 right-0 top-0' : value === 'small' ? 'bottom-1 left-0 right-0 top-0' : value === 'medium' ? 'bottom-2 left-0 right-0 top-0' : 'bottom-3 left-0 right-0 top-0'
  return <span className="relative block h-5 w-8 overflow-hidden rounded-[2px] border border-foreground-muted/40 bg-surface-muted" aria-hidden="true"><span className={`absolute border border-accent/60 bg-accent/30 ${mediaClass}`} /></span>
}

function ClassicFramePreview({ frame }: { frame: string }) {
  const frameClass = frame === 'fineLine'
    ? 'border border-foreground-muted/70 p-0.5'
    : frame === 'doubleLine'
      ? 'border border-foreground-muted/70 p-0.5 outline outline-1 outline-offset-2 outline-foreground-muted/50'
      : frame === 'heritage'
        ? 'border-[3px] border-accent bg-surface-muted p-1'
        : frame === 'inset'
          ? 'border-4 border-surface-muted outline outline-1 outline-foreground-muted/60'
          : frame === 'outset'
            ? 'outline-2 outline-offset-[3px] outline-foreground-muted/70'
            : frame === 'ornamental'
              ? "outline outline-offset-2 outline-accent before:absolute before:left-0.5 before:top-0.5 before:size-2 before:border-l-2 before:border-t-2 before:border-accent before:content-[''] after:absolute after:bottom-0.5 after:right-0.5 after:size-2 after:border-b-2 after:border-r-2 after:border-accent after:content-['']"
          : ''
  return <span className={`relative grid h-6 w-8 shrink-0 place-items-center rounded-[2px] bg-background ${frameClass}`} aria-hidden="true"><span className={`h-full w-full bg-accent/25 ${frame === 'heritage' || frame === 'ornamental' ? 'border border-accent/60' : ''}`} /></span>
}

function ModernFramePreview({ frame }: { frame: string }) {
  const frameClass = frame === 'hairline'
    ? 'border border-foreground-muted/70'
    : frame === 'offset'
      ? "border border-foreground-muted/70 before:absolute before:inset-0 before:translate-x-1 before:translate-y-1 before:border before:border-foreground before:content-['']"
      : frame === 'gallery'
        ? 'border-[3px] border-background outline outline-1 outline-foreground-muted/70'
        : frame === 'boldEdge'
          ? 'border border-foreground border-l-[3px]'
          : frame === 'outset'
            ? 'outline outline-offset-2 outline-foreground-muted'
            : frame === 'editorialFrame'
              ? "outline outline-offset-2 outline-foreground-muted/70 before:absolute before:right-0.5 before:top-0.5 before:size-2 before:border-r-2 before:border-t-2 before:border-foreground before:content-[''] after:absolute after:bottom-0.5 after:right-0.5 after:size-2 after:border-b-2 after:border-r-2 after:border-foreground after:content-['']"
          : ''
  return <span className="grid h-7 w-9 shrink-0 place-items-center" aria-hidden="true"><span className={`relative h-4 w-6 bg-accent/25 ${frameClass}`} /></span>
}

function ClassicShadowPreview({ shadow }: { shadow: string }) {
  const shadowClass = shadow === 'subtle'
    ? 'shadow-[0_1px_3px_rgb(44_31_23/25%)]'
    : shadow === 'soft'
      ? 'shadow-[0_4px_8px_-1px_rgb(44_31_23/32%)]'
      : shadow === 'elevated'
        ? 'shadow-[0_7px_12px_-2px_rgb(44_31_23/42%)]'
        : ''
  return <span className="grid h-7 w-9 shrink-0 place-items-center" aria-hidden="true"><span className={`h-4 w-6 rounded-[2px] border border-border bg-background ${shadowClass}`} /></span>
}

function ModernShadowPreview({ shadow }: { shadow: string }) {
  const shadowClass = shadow === 'subtle'
    ? 'shadow-[0_2px_3px_-1px_rgb(15_23_42/30%)]'
    : shadow === 'soft'
      ? 'shadow-[0_5px_8px_-2px_rgb(15_23_42/38%)]'
      : shadow === 'elevated'
        ? 'shadow-[0_8px_13px_-3px_rgb(15_23_42/46%),0_2px_4px_-1px_rgb(15_23_42/30%)]'
        : ''
  return <span className="grid h-7 w-9 shrink-0 place-items-center" aria-hidden="true"><span className={`h-4 w-6 border border-foreground-muted/60 bg-background ${shadowClass}`} /></span>
}

function OptionGrid({
  options,
  value,
  onSelect,
  alignment = false,
}: {
  options: DesignOption[];
  value: string;
  onSelect: (key: string) => void;
  alignment?: boolean;
}) {
  return (
    <div
      className={
        alignment
          ? "flex flex-wrap items-center gap-2"
          : "grid grid-cols-2 gap-2"
      }
    >
      {options.map((option) => {
        const selected = option.key === value;
        const Icon =
          option.key === "left"
            ? AlignLeft
            : option.key === "right"
              ? AlignRight
              : option.key === "center"
                ? AlignCenter
                : null;
        if (alignment && Icon) {
          const label = `Align ${option.key}`;
          return (
            <Tooltip key={option.key} label={label}>
              <IconButton
                className="border border-border border-2 aria-pressed:border-accent aria-pressed:bg-surface-muted aria-pressed:text-foreground xl:size-9!"
                size="md"
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => onSelect(option.key)}
              >
                <Icon size={16} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          );
        }

        return (
          <Button
            className={`min-h-11 gap-1.5 px-3 py-2 font-normal! xl:min-h-9 xl:py-1.5 ${alignment ? "min-w-28" : "px-2"} ${selected ? "border-accent! border-2 bg-surface-muted" : ""}`}
            key={option.key}
            size="sm"
            variant="secondary"
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.key)}
          >
            <span>{option.displayName}</span>
            {selected && !alignment && (
              <Check size={13} className="text-accent" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
