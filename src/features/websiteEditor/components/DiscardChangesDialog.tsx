import { Button } from "../../../components/ui/Button";
import { Dialog, DialogFooter, DialogHeader } from "../../../components/ui/Dialog";

export function DiscardChangesDialog({
  open,
  onCancel,
  onDiscard,
  title = "Discard unsaved changes?",
  description = "Your edits have not been saved.",
}: {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      size="sm"
      titleId="discard-changes-title"
      descriptionId="discard-changes-description"
    >
      <DialogHeader title={title} titleId="discard-changes-title" description={description} descriptionId="discard-changes-description" />
      <DialogFooter className="mt-5">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" type="button" onClick={onDiscard}>
          Discard
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
