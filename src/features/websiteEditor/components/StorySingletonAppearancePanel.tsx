import { AlignCenter, AlignLeft, AlignRight, RotateCcw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import type { ElementCapability, ResolvedDesignContext, TemplateDesignLibrary } from '../../websiteCapabilities/types'
import type { ResponsiveViewport, StoryContent, StoryHeaderField, StoryTextAppearance, WebsiteSectionAppearance } from '../types'
import { FontPicker } from './FontPicker'
import { InspectorResetAction, InspectorSection } from './InspectorPrimitives'
import { InspectorVisualChoiceGroup } from './InspectorVisualChoice'
import type { ProjectColor } from '../../websiteColors/projectColors'
import { WebsiteColorSwatchControl } from './WebsiteColorSwatchControl'

export function StorySingletonAppearancePanel({ field, content, sectionAppearance, viewport, capability, library, projectColors, context, onAddColor, onChange }: { field: StoryHeaderField; content: StoryContent; sectionAppearance: WebsiteSectionAppearance; viewport: ResponsiveViewport; capability: ElementCapability; library: TemplateDesignLibrary; projectColors: ProjectColor[]; context: ResolvedDesignContext | null; onAddColor: (value: string) => Promise<ProjectColor>; onChange: (content: StoryContent) => void }) {
  const role = field === 'heading' ? 'heading' : 'body'
  const appearance = content.singletonAppearance?.[field] ?? {}
  const update = (next?: StoryTextAppearance) => {
    const singletonAppearance = { ...content.singletonAppearance }
    if (next && Object.keys(next).length) singletonAppearance[field] = next
    else delete singletonAppearance[field]
    const nextContent = { ...content }
    if (Object.keys(singletonAppearance).length) nextContent.singletonAppearance = singletonAppearance
    else delete nextContent.singletonAppearance
    onChange(nextContent)
  }
  const set = <K extends keyof StoryTextAppearance>(key: K, value: StoryTextAppearance[K] | undefined) => { const next = { ...appearance }; if (value === undefined || value === '') delete next[key]; else next[key] = value; update(next) }
  const inheritedFont = context ? library.fontFamilies.find(({ id }) => id === (role === 'heading' ? context.headingFontId : context.bodyFontId))?.displayName : undefined
  const inheritedColor = context ? library.colors.find(({ id }) => id === (role === 'heading' ? context.headingColorId : context.bodyColorId))?.displayName : undefined
  const colors = capability.appearance?.colors.find(({ role: colorRole }) => colorRole === (role === 'heading' ? 'headingColor' : 'textColor'))?.allowedColorIds ?? []
  const sizes: Exclude<NonNullable<StoryTextAppearance['fontSize']>[ResponsiveViewport], undefined>[] = ['xs', 's', 'm', 'l', 'xl']
  const hasOverrides = Object.keys(appearance).length > 0
  const legacyAlignment = field === 'heading' ? sectionAppearance.headingAlignment : sectionAppearance.bodyAlignment
  const alignment = appearance.alignment ?? (legacyAlignment === 'left' ? 'start' : legacyAlignment === 'right' ? 'end' : legacyAlignment === 'center' ? 'center' : 'start')
  return <div className="space-y-4"><div className="flex items-center justify-between gap-3"><p className="text-[11px] text-foreground-muted">Size applies to {viewport[0].toUpperCase() + viewport.slice(1)}.</p>{hasOverrides && <Button type="button" size="sm" variant="ghost" className="h-9 w-9 p-0 text-foreground/80" aria-label={`Reset all ${field} appearance`} title={`Reset all ${field} appearance`} onClick={() => update()}><RotateCcw size={17} /></Button>}</div><InspectorSection title="Text appearance">
    <Field label="Font" reset={Boolean(appearance.fontFamilyId)} onReset={() => set('fontFamilyId', undefined)}><FontPicker value={appearance.fontFamilyId ?? ''} role={role} library={library} inheritedLabel={`Inherited${inheritedFont ? ` · ${inheritedFont}` : ''}`} onChange={(value) => set('fontFamilyId', value || undefined)} /></Field>
    <Field label={`Size · ${viewport}`} reset={Boolean(appearance.fontSize?.[viewport])} onReset={() => { const fontSize = { ...appearance.fontSize }; delete fontSize[viewport]; set('fontSize', Object.keys(fontSize).length ? fontSize : undefined) }}><Select value={appearance.fontSize?.[viewport] ?? ''} options={[{ value: '', label: 'Template default' }, ...sizes.map(value => ({ value, label: value.toUpperCase() }))]} onChange={(value) => { const fontSize = { ...appearance.fontSize }; if (value) fontSize[viewport] = value as NonNullable<StoryTextAppearance['fontSize']>[ResponsiveViewport]; else delete fontSize[viewport]; set('fontSize', Object.keys(fontSize).length ? fontSize : undefined) }} /></Field>
    <Choice label="Line spacing" value={appearance.lineSpacing ?? ''} values={['tight','normal','relaxed']} onChange={(value) => set('lineSpacing', value as StoryTextAppearance['lineSpacing'] || undefined)} reset={Boolean(appearance.lineSpacing)} />
    <Choice label="Letter spacing" value={appearance.letterSpacing ?? ''} values={['tight','normal','wide']} onChange={(value) => set('letterSpacing', value as StoryTextAppearance['letterSpacing'] || undefined)} reset={Boolean(appearance.letterSpacing)} />
    <Field label="Color" reset={Boolean(appearance.colorId)} onReset={() => set('colorId', undefined)}><WebsiteColorSwatchControl label={`${field} color${inheritedColor ? `, inherited ${inheritedColor}` : ''}`} colorId={appearance.colorId} allowedTemplateColorIds={colors} templateColors={library.colors} projectColors={projectColors} onChange={(value) => set('colorId', value)} onAddColor={onAddColor} /></Field>
    <Field label="Text alignment" reset={Boolean(appearance.alignment)} onReset={() => set('alignment', undefined)}><InspectorVisualChoiceGroup label="Text alignment" layout="inline" value={alignment} onChange={(value) => set('alignment', value as StoryTextAppearance['alignment'])} options={[['start','Start','Align text to start',<AlignLeft size={18}/>],['center','Center','Center text',<AlignCenter size={18}/>],['end','End','Align text to end',<AlignRight size={18}/>]].map(([value,label,ariaLabel,illustration]) => ({ value: value as string, label: label as string, illustration, ariaLabel: ariaLabel as string }))} /></Field>
  </InspectorSection></div>
}
function Field({ label, reset, onReset, children }: { label: string; reset: boolean; onReset: () => void; children: React.ReactNode }) { return <div><div className="mb-1.5 flex justify-between"><label className="text-xs font-medium">{label}</label>{reset && <InspectorResetAction onClick={onReset}/>}</div>{children}</div> }
function Choice({ label, value, values, onChange, reset }: { label: string; value: string; values: string[]; onChange: (value: string) => void; reset: boolean }) { return <Field label={label} reset={reset} onReset={() => onChange('')}><Select value={value} options={[{value:'',label:'Template default'},...values.map(value => ({value,label:value[0].toUpperCase()+value.slice(1)}))]} onChange={onChange}/></Field> }
