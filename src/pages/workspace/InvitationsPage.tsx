import { Mail } from 'lucide-react'
import { WorkspaceSection } from '../../features/events/workspace/WorkspaceSection'

export function InvitationsPage() {
  return (
    <WorkspaceSection eyebrow="Event workspace" title="Invitations" description="Manage Event invitations and guest access.">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <Mail aria-hidden="true" className="text-secondary-accent" size={22} />
        <h2 className="mt-4 font-semibold">Invitation features are coming later</h2>
        <p className="mt-1 text-sm text-foreground-muted">Invitations and guest management are outside the current workspace shell.</p>
      </section>
    </WorkspaceSection>
  )
}
