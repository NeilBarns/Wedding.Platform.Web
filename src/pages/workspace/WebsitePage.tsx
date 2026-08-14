import { FileWarning, LayoutTemplate, Monitor, RefreshCw, Smartphone } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useEventWorkspace } from '../../features/events/workspace/EventWorkspaceContext'
import { WorkspaceSection } from '../../features/events/workspace/WorkspaceSection'
import { reorderWebsiteSections, setWebsiteSectionEnabled, updateWebsiteDesignSettings, updateWebsiteSectionContent } from '../../features/websiteEditor/api'
import { DesignPanel } from '../../features/websiteEditor/components/DesignPanel'
import { DiscardChangesDialog } from '../../features/websiteEditor/components/DiscardChangesDialog'
import { SectionEditor } from '../../features/websiteEditor/components/SectionEditor'
import { SectionNavigator } from '../../features/websiteEditor/components/SectionNavigator'
import type { WebsiteDesignSettings, WebsiteDraft, WebsiteSection } from '../../features/websiteEditor/types'
import { useWebsiteDraft } from '../../features/websiteEditor/useWebsiteDraft'
import { WebsiteRenderer } from '../../features/websiteRenderer/WebsiteRenderer'
import { ApiError } from '../../lib/api'

type BuilderMode = 'content' | 'design'
function messageFor(error: unknown): string { return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.' }

export function WebsitePage() {
  const event = useEventWorkspace()
  const { draft, setDraft, error, isLoading, retry } = useWebsiteDraft(event.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const [pendingMode, setPendingMode] = useState<BuilderMode | null>(null)
  const [mode, setMode] = useState<BuilderMode>('content')
  const [isDirty, setIsDirty] = useState(false)
  const [listPending, setListPending] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [contentOverride, setContentOverride] = useState<{ sectionId: string; content: Record<string, unknown> } | null>(null)
  const [designOverride, setDesignOverride] = useState<WebsiteDesignSettings | null>(null)
  const [designSaving, setDesignSaving] = useState(false)
  const [designError, setDesignError] = useState<string | null>(null)

  const effectiveSelectedId = draft?.sections.some(({ id }) => id === selectedId) ? selectedId : draft?.sections[0]?.id ?? null
  const designDirty = Boolean(draft && designOverride && JSON.stringify(designOverride) !== JSON.stringify(draft.designSettings))

  function selectSection(id: string) {
    if (id === effectiveSelectedId) return
    if (isDirty) setPendingSelection(id)
    else { setSelectedId(id); setContentOverride(null) }
  }

  function changeMode(next: BuilderMode) {
    if (next === mode) return
    if ((mode === 'content' && isDirty) || (mode === 'design' && designDirty)) setPendingMode(next)
    else { setMode(next); setContentOverride(null); setDesignOverride(null) }
  }

  async function mutateList(operation: () => Promise<WebsiteDraft>) {
    setListPending(true); setListError(null)
    try { setDraft(await operation()) } catch (mutationError) { setListError(messageFor(mutationError)) } finally { setListPending(false) }
  }

  function toggle(section: WebsiteSection) { void mutateList(() => setWebsiteSectionEnabled(event.id, section.id, !section.isEnabled)) }
  function move(index: number, direction: -1 | 1) {
    if (!draft) return
    const ids = draft.sections.map(({ id }) => id); const target = index + direction
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    void mutateList(() => reorderWebsiteSections(event.id, ids))
  }

  const updatePreviewContent = useCallback((content: Record<string, unknown> | null) => {
    setContentOverride(content && effectiveSelectedId ? { sectionId: effectiveSelectedId, content } : null)
  }, [effectiveSelectedId])

  const previewDraft = useMemo(() => {
    if (!draft) return null
    return {
      ...draft,
      designSettings: designOverride ?? draft.designSettings,
      sections: contentOverride ? draft.sections.map((section) => section.id === contentOverride.sectionId ? { ...section, content: contentOverride.content } : section) : draft.sections,
    } as WebsiteDraft
  }, [contentOverride, designOverride, draft])

  async function saveDesign() {
    if (!designOverride) return
    setDesignSaving(true); setDesignError(null)
    try { setDraft(await updateWebsiteDesignSettings(event.id, designOverride)); setDesignOverride(null) }
    catch (saveError) { setDesignError(messageFor(saveError)) } finally { setDesignSaving(false) }
  }

  if (isLoading) return <EditorLoading />
  if (error || !draft || !previewDraft) return <EditorError message={messageFor(error)} retry={retry} />
  const selected = draft.sections.find(({ id }) => id === effectiveSelectedId) ?? null
  const designSettings = designOverride ?? draft.designSettings

  return <WorkspaceSection wide eyebrow="Event workspace" title="Website" description="Build content and customize the visual direction of your Wedding website.">
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-surface-muted p-2 text-secondary-accent"><LayoutTemplate size={19} /></span><div><p className="text-xs text-foreground-muted">Template</p><p className="text-sm font-semibold">{draft.template?.displayName ?? draft.templateKey}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={mode} options={[['content', 'Content'], ['design', 'Design']]} onChange={(value) => changeMode(value as BuilderMode)} />
        <Segmented value={previewMode} options={[['desktop', 'Desktop'], ['mobile', 'Mobile']]} icons={[<Monitor size={14} />, <Smartphone size={14} />]} onChange={(value) => setPreviewMode(value as 'desktop' | 'mobile')} />
      </div>
    </div>
    {listError && <p className="mb-4 rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{listError}</p>}
    {draft.sections.length === 0 ? <EmptyEditor /> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,410px)]">
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-3 sm:p-4" aria-label="Live Website preview">
        <div className="mb-3 flex items-center justify-between px-1"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Live preview</p><p className="mt-0.5 text-xs text-foreground-muted">Unsaved valid changes appear here before saving.</p></div>{(contentOverride || designDirty) && <span className="rounded-full bg-danger-muted px-2 py-1 text-[10px] font-medium text-danger">Unsaved preview</span>}</div>
        <div className="overflow-x-auto rounded-xl bg-surface-muted p-2 sm:p-3"><div className={`mx-auto h-[min(74vh,820px)] overflow-y-auto rounded-lg bg-white shadow-[0_16px_50px_rgb(35_24_18/16%)] transition-[max-width] ${previewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-full'}`}><WebsiteRenderer event={event} website={previewDraft} mode="editor" selectedSectionId={mode === 'content' ? effectiveSelectedId : null} onSectionSelect={(id) => {
          if (mode === 'content') selectSection(id)
          else if (designDirty) { setPendingMode('content'); setPendingSelection(id) }
          else { setMode('content'); setSelectedId(id); setDesignOverride(null) }
        }} /></div></div>
      </section>
      <div className="space-y-5">{mode === 'design' && draft.template ? <DesignPanel settings={designSettings} options={draft.template.designOptions} dirty={designDirty} saving={designSaving} error={designError} eventName={event.name} onChange={setDesignOverride} onSave={() => void saveDesign()} /> : <>
        <SectionNavigator sections={draft.sections} selectedId={effectiveSelectedId} pending={listPending} onSelect={selectSection} onToggle={toggle} onMove={move} />
        <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5">{selected && <><div className="mb-5 border-b border-border pb-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{selected.displayName}</h2>{!selected.isEnabled && <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-foreground-muted">Hidden on website</span>}</div><p className="mt-1 text-sm text-foreground-muted">Edit this section’s semantic content.</p></div><SectionEditor key={selected.id} section={selected} onDirtyChange={setIsDirty} onPreviewContentChange={updatePreviewContent} onSave={(content) => updateWebsiteSectionContent(event.id, selected.id, content)} onSaved={(updated) => { setDraft(updated); setIsDirty(false); setContentOverride(null) }} /></>}</section>
      </>}</div>
    </div>}
    <DiscardChangesDialog open={pendingSelection !== null || pendingMode !== null} onCancel={() => { setPendingSelection(null); setPendingMode(null) }} onDiscard={() => {
      if (pendingSelection) setSelectedId(pendingSelection)
      if (pendingMode) setMode(pendingMode)
      setPendingSelection(null); setPendingMode(null); setIsDirty(false); setContentOverride(null); setDesignOverride(null)
    }} />
  </WorkspaceSection>
}

function Segmented({ value, options, icons, onChange }: { value: string; options: Array<[string, string]>; icons?: React.ReactNode[]; onChange: (value: string) => void }) {
  return <div className="flex items-center gap-1 rounded-xl bg-surface-muted p-1">{options.map(([key, label], index) => <button className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${value === key ? 'bg-surface font-medium shadow-sm' : 'text-foreground-muted'}`} key={key} type="button" onClick={() => onChange(key)} aria-pressed={value === key}>{icons?.[index]}{label}</button>)}</div>
}
function EditorLoading() { return <WorkspaceSection wide eyebrow="Event workspace" title="Website" description="Loading your Website draft…"><div className="grid animate-pulse gap-5 xl:grid-cols-[1fr_390px]"><div className="h-[70vh] rounded-2xl bg-surface-muted" /><div className="h-96 rounded-2xl bg-surface-muted" /></div></WorkspaceSection> }
function EditorError({ message, retry }: { message: string; retry: () => void }) { return <WorkspaceSection wide eyebrow="Event workspace" title="Website" description="Build and manage your Event website."><div className="rounded-2xl border border-border bg-surface p-6 text-center"><FileWarning className="mx-auto text-danger" /><h2 className="mt-3 font-semibold">Unable to load the Website editor</h2><p className="mt-1 text-sm text-foreground-muted">{message}</p><button className="mx-auto mt-4 flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground" type="button" onClick={retry}><RefreshCw size={15} /> Retry</button></div></WorkspaceSection> }
function EmptyEditor() { return <div className="rounded-2xl border border-border bg-surface p-8 text-center"><FileWarning className="mx-auto text-secondary-accent" /><h2 className="mt-3 font-semibold">No Website sections found</h2><p className="mt-1 text-sm text-foreground-muted">The draft exists, but it does not currently contain editable sections.</p></div> }
