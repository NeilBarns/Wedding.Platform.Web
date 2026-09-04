export const RICH_TEXT_COMMAND_EVENT = "website-editor:rich-text-command";
export type RichTextCommand = "bold" | "italic" | "underline" | "strikeThrough" | "createLink" | "insertUnorderedList" | "insertOrderedList";

export function dispatchRichTextCommand(elementId: string, command: RichTextCommand) {
  window.dispatchEvent(new CustomEvent(RICH_TEXT_COMMAND_EVENT, { detail: { elementId, command } }));
}
