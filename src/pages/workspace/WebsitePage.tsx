import { Globe2 } from 'lucide-react'
import { WorkspaceSection } from '../../features/events/workspace/WorkspaceSection'

export function WebsitePage() {
  return (
    <WorkspaceSection eyebrow="Event workspace" title="Website" description="Build and manage your Event website.">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <Globe2 aria-hidden="true" className="text-secondary-accent" size={22} />
        <h2 className="mt-4 font-semibold">Website tools are coming later</h2>
        <p className="mt-1 text-sm text-foreground-muted">The website editor will be introduced in a dedicated phase.</p>
      </section>
    </WorkspaceSection>
  )
}
