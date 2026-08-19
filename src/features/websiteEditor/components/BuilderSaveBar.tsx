import { Save } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Text } from "../../../components/ui/Text";

export function BuilderSaveBar({ dirty, saving, form, onSave }: {
  dirty: boolean;
  saving: boolean;
  form?: string;
  onSave?: () => void;
}) {
  return <footer
    className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 xl:bg-background xl:px-3"
    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
  >
    <Text as="span" variant="helper">{dirty ? "Unsaved changes" : "All changes saved"}</Text>
    <Button
      className="shrink-0 rounded-sm! text-base! xl:px-3 xl:py-1.5 xl:text-sm!"
      size="sm"
      type={form ? "submit" : "button"}
      form={form}
      disabled={!dirty || saving}
      onClick={onSave}
    >
      <Save size={15} aria-hidden="true" />
      {saving ? "Saving..." : "Save changes"}
    </Button>
  </footer>;
}
