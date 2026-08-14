import { Settings } from 'lucide-react'
import { WorkspaceSection } from '../../features/events/workspace/WorkspaceSection'

export function EventSettingsPage() {
  return (
    <WorkspaceSection eyebrow="Event workspace" title="Settings" description="Manage Event details and workspace settings.">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <Settings aria-hidden="true" className="text-secondary-accent" size={22} />
        <h2 className="mt-4 font-semibold">Settings functionality is coming later</h2>
        <p className="mt-1 text-sm text-foreground-muted">Event editing and lifecycle controls will be expanded in a later phase.</p>
      </section>
    </WorkspaceSection>
  )
}
