export const RICH_TEXT_COMMAND_EVENT = "website-editor:rich-text-command";
export type RichTextCommand = "bold" | "italic" | "underline" | "strikeThrough";

export function dispatchRichTextCommand(elementId: string, command: RichTextCommand) {
  const dispatch = (target: Window) => {
    const CustomEventConstructor = (target as Window & { CustomEvent: typeof CustomEvent }).CustomEvent;
    target.dispatchEvent(new CustomEventConstructor(RICH_TEXT_COMMAND_EVENT, { detail: { elementId, command } }));
  };
  dispatch(window);
  Array.from(document.querySelectorAll("iframe")).forEach((frame) => {
    const view = frame.contentWindow;
    if (view) dispatch(view);
  });
}
