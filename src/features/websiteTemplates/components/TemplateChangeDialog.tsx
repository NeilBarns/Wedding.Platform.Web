import { Button } from '../../../components/ui/Button'
import { Dialog, DialogFooter, DialogHeader } from '../../../components/ui/Dialog'
import { Text } from '../../../components/ui/Text'
import type { WebsiteTemplateOption } from '../types'

export function TemplateChangeDialog({ template, saving, error, onCancel, onConfirm }: { template: WebsiteTemplateOption | null; saving: boolean; error: string | null; onCancel: () => void; onConfirm: () => void }) {
  return <Dialog open={template !== null} onClose={onCancel} closeDisabled={saving} size="sm" titleId="change-template-title" descriptionId="change-template-description">
    <DialogHeader title="Change Template?" titleId="change-template-title" description={<>Your Website content will be preserved. Some design and appearance choices may adjust to match <strong>{template?.displayName}</strong>.</>} descriptionId="change-template-description" />
    {error && <Text className="mt-4 rounded-lg bg-danger-muted p-3" variant="error" role="alert">{error}</Text>}
    <DialogFooter className="mt-5"><Button variant="secondary" size="sm" type="button" disabled={saving} onClick={onCancel}>Cancel</Button><Button size="sm" type="button" disabled={saving} onClick={onConfirm}>{saving ? 'Changing…' : 'Change Template'}</Button></DialogFooter>
  </Dialog>
}
