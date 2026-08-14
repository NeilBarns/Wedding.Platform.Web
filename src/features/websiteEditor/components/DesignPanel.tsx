import { Check, Palette, Save, Sparkles, Type } from 'lucide-react'
import type { WebsiteDesignOptions, WebsiteDesignSettings } from '../types'
import { colorSwatches } from '../../websiteRenderer/templates/classicFilipiniana/design'

export function DesignPanel({ settings, options, dirty, saving, error, eventName, onChange, onSave }: {
  settings: WebsiteDesignSettings
  options: WebsiteDesignOptions
  dirty: boolean
  saving: boolean
  error: string | null
  eventName: string
  onChange: (settings: WebsiteDesignSettings) => void
  onSave: () => void
}) {
  return <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
    <div className="mb-5"><h2 className="text-xl font-semibold">Design</h2><p className="mt-1 text-sm text-foreground-muted">Customize this Template with curated visual choices.</p></div>
    {error && <p className="mb-4 rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{error}</p>}
    <DesignGroup icon={<Palette size={16} />} title="Color">
      <div className="grid grid-cols-2 gap-2">{options.colorThemes.map((option) => {
        const selected = settings.colorTheme === option.key
        return <button className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs ${selected ? 'border-accent bg-surface-muted' : 'border-border hover:bg-surface-muted'}`} key={option.key} type="button" onClick={() => onChange({ ...settings, colorTheme: option.key as WebsiteDesignSettings['colorTheme'] })} aria-pressed={selected}><span className="h-6 w-6 rounded-full border border-black/10" style={{ background: colorSwatches[option.key as WebsiteDesignSettings['colorTheme']] }} /> <span className="flex-1">{option.displayName}</span>{selected && <Check size={14} className="text-accent" />}</button>
      })}</div>
    </DesignGroup>
    <DesignGroup icon={<Type size={16} />} title="Font">
      <div className="space-y-2">{options.fontSets.map((option) => {
        const selected = settings.fontSet === option.key
        const family = option.key === 'modern' ? 'font-sans' : option.key === 'romantic' ? '[font-family:Palatino,Georgia,serif]' : 'font-serif'
        return <button className={`w-full rounded-xl border p-3 text-left ${selected ? 'border-accent bg-surface-muted' : 'border-border hover:bg-surface-muted'}`} key={option.key} type="button" onClick={() => onChange({ ...settings, fontSet: option.key as WebsiteDesignSettings['fontSet'] })} aria-pressed={selected}><span className="flex items-center justify-between text-xs font-medium"><span>{option.displayName}</span>{selected && <Check size={14} className="text-accent" />}</span><span className={`mt-1 block truncate text-lg ${family}`}>{eventName}</span></button>
      })}</div>
    </DesignGroup>
    <DesignGroup icon={<Sparkles size={16} />} title="Art">
      <div className="grid grid-cols-2 gap-2">{options.artStyles.map((option) => {
        const selected = settings.artStyle === option.key
        return <button className={`overflow-hidden rounded-xl border text-left ${selected ? 'border-accent' : 'border-border'}`} key={option.key} type="button" onClick={() => onChange({ ...settings, artStyle: option.key as WebsiteDesignSettings['artStyle'] })} aria-pressed={selected}><span className={`block h-12 ${artPreview(option.key)}`} /><span className="flex items-center justify-between px-2.5 py-2 text-xs">{option.displayName}{selected && <Check size={14} className="text-accent" />}</span></button>
      })}</div>
    </DesignGroup>
    <div className="mt-5 flex justify-end border-t border-border pt-4"><button className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50" type="button" disabled={!dirty || saving} onClick={onSave}><Save size={15} />{saving ? 'Saving…' : 'Save design'}</button></div>
  </section>
}

function DesignGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <fieldset className="mb-5"><legend className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title}</legend>{children}</fieldset>
}

function artPreview(key: string): string {
  if (key === 'botanical') return 'bg-[radial-gradient(ellipse_at_20%_20%,#8a9b75_0_12%,transparent_13%),radial-gradient(ellipse_at_75%_70%,#b97861_0_15%,transparent_16%)] bg-[#f3ede1]'
  if (key === 'woven') return 'bg-[repeating-linear-gradient(45deg,#e7ddd0_0_4px,#f4eee5_4px_8px)]'
  if (key === 'clean') return 'bg-[#f8f4ee]'
  return 'bg-[radial-gradient(#a7654f_1px,transparent_1px)] bg-[#f4ece1] bg-[size:8px_8px]'
}
