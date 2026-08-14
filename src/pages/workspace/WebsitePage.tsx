import { FileWarning, LayoutTemplate, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { WorkspaceSection } from '../../features/events/workspace/WorkspaceSection'
import { useEventWorkspace } from '../../features/events/workspace/EventWorkspaceContext'
import { reorderWebsiteSections, setWebsiteSectionEnabled, updateWebsiteSectionContent } from '../../features/websiteEditor/api'
import { DiscardChangesDialog } from '../../features/websiteEditor/components/DiscardChangesDialog'
import { SectionEditor } from '../../features/websiteEditor/components/SectionEditor'
import { SectionNavigator } from '../../features/websiteEditor/components/SectionNavigator'
import type { WebsiteDraft, WebsiteSection } from '../../features/websiteEditor/types'
import { useWebsiteDraft } from '../../features/websiteEditor/useWebsiteDraft'
import { ApiError } from '../../lib/api'

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}

export function WebsitePage() {
  const event = useEventWorkspace()
  const { draft, setDraft, error, isLoading, retry } = useWebsiteDraft(event.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [listPending, setListPending] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  function selectSection(id: string) {
    if (id === effectiveSelectedId) return
    if (isDirty) setPendingSelection(id)
    else setSelectedId(id)
  }

  async function mutateList(operation: () => Promise<WebsiteDraft>) {
    setListPending(true)
    setListError(null)
    try { setDraft(await operation()) }
    catch (mutationError) { setListError(messageFor(mutationError)) }
    finally { setListPending(false) }
  }

  function toggle(section: WebsiteSection) {
    void mutateList(() => setWebsiteSectionEnabled(event.id, section.id, !section.isEnabled))
  }

  function move(index: number, direction: -1 | 1) {
    if (!draft) return
    const ids = draft.sections.map(({ id }) => id)
    const target = index + direction
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    void mutateList(() => reorderWebsiteSections(event.id, ids))
  }

  if (isLoading) return <EditorLoading />
  if (error || !draft) return <EditorError message={messageFor(error)} retry={retry} />

  const effectiveSelectedId = draft.sections.some(({ id }) => id === selectedId)
    ? selectedId
    : draft.sections[0]?.id ?? null
  const selected = draft.sections.find(({ id }) => id === effectiveSelectedId) ?? null

  return (
    <WorkspaceSection eyebrow="Event workspace" title="Website" description="Shape the structured content and visibility of your Event website.">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-surface-muted p-2 text-secondary-accent"><LayoutTemplate size={19} /></span>
          <div><p className="text-xs text-foreground-muted">Template</p><p className="text-sm font-semibold">{draft.template?.displayName ?? draft.templateKey}</p></div>
        </div>
        <p className="text-xs text-foreground-muted">Section changes save explicitly. Visibility and order save immediately.</p>
      </div>

      {listError && <p className="mb-4 rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{listError}</p>}

      {draft.sections.length === 0 ? <EmptyEditor /> : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(230px,280px)_minmax(0,1fr)]">
          <SectionNavigator sections={draft.sections} selectedId={effectiveSelectedId} pending={listPending} onSelect={selectSection} onToggle={toggle} onMove={move} />
          <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6">
            {selected && <>
              <div className="mb-5 border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{selected.displayName}</h2>{!selected.isEnabled && <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-foreground-muted">Hidden on website</span>}</div>
                <p className="mt-1 text-sm text-foreground-muted">Edit this section’s semantic content.</p>
              </div>
              <SectionEditor
                key={selected.id}
                section={selected}
                onDirtyChange={setIsDirty}
                onSave={(content) => updateWebsiteSectionContent(event.id, selected.id, content)}
                onSaved={(updated) => { setDraft(updated); setIsDirty(false) }}
              />
            </>}
          </section>
        </div>
      )}

      <DiscardChangesDialog
        open={pendingSelection !== null}
        onCancel={() => setPendingSelection(null)}
        onDiscard={() => { setSelectedId(pendingSelection); setPendingSelection(null); setIsDirty(false) }}
      />
    </WorkspaceSection>
  )
}

function EditorLoading() {
  return <WorkspaceSection eyebrow="Event workspace" title="Website" description="Loading your Website draft…"><div className="grid animate-pulse gap-5 lg:grid-cols-[260px_1fr]"><div className="h-80 rounded-2xl bg-surface-muted" /><div className="h-96 rounded-2xl bg-surface-muted" /></div></WorkspaceSection>
}

function EditorError({ message, retry }: { message: string; retry: () => void }) {
  return <WorkspaceSection eyebrow="Event workspace" title="Website" description="Build and manage your Event website."><div className="rounded-2xl border border-border bg-surface p-6 text-center"><FileWarning className="mx-auto text-danger" /><h2 className="mt-3 font-semibold">Unable to load the Website editor</h2><p className="mt-1 text-sm text-foreground-muted">{message}</p><button className="mx-auto mt-4 flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground" type="button" onClick={retry}><RefreshCw size={15} /> Retry</button></div></WorkspaceSection>
}

function EmptyEditor() {
  return <div className="rounded-2xl border border-border bg-surface p-8 text-center"><FileWarning className="mx-auto text-secondary-accent" /><h2 className="mt-3 font-semibold">No Website sections found</h2><p className="mt-1 text-sm text-foreground-muted">The draft exists, but it does not currently contain editable sections.</p></div>
}
