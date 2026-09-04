import { Bold, Italic, Link, List, ListOrdered, Strikethrough, Underline } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { richTextDocumentFromElement, richTextDocumentToHtml, safeLink } from "../../websiteElements/richText";
import type { RichTextElement } from "../../websiteElements/types";
import type { ResponsiveViewport } from "../types";
import { RICH_TEXT_COMMAND_EVENT, type RichTextCommand } from "../richTextCommands";

export function RichTextCanvasEditor({ element, viewport, onChange }: { element: RichTextElement; viewport: ResponsiveViewport; onChange: (element: RichTextElement) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  useLayoutEffect(() => { if (editorRef.current && !focused.current) editorRef.current.innerHTML = richTextDocumentToHtml(element.document); }, [element.document]);
  const commit = () => { if (editorRef.current) onChange({ ...element, document: richTextDocumentFromElement(editorRef.current) }); };
  const command = (name: string, value?: string) => { editorRef.current?.focus(); document.execCommand(name, false, value); commit(); };
  const createLink = () => {
    const value = window.prompt("Link URL (https:// or mailto:)");
    if (!value) return;
    if (!safeLink(value)) { window.alert("Enter a valid http, https, or mailto link."); return; }
    command("createLink", value);
  };
  useEffect(() => {
    const handleCommand = (event: Event) => {
      const detail = (event as CustomEvent<{ elementId: string; command: RichTextCommand }>).detail;
      if (detail.elementId !== element.id) return;
      if (detail.command === "createLink") createLink(); else command(detail.command);
    };
    window.addEventListener(RICH_TEXT_COMMAND_EVENT, handleCommand);
    return () => window.removeEventListener(RICH_TEXT_COMMAND_EVENT, handleCommand);
  });
  return <div className="relative w-full" data-rich-text-canvas-editor>
    {viewport !== "mobile" && <div className="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 flex-wrap gap-1 rounded-lg border border-border bg-surface p-1 text-foreground shadow-[var(--shadow-dialog)]" role="toolbar" aria-label="Rich Text formatting">
      <Tool label="Bold" onPress={() => command("bold")}><Bold size={16} /></Tool><Tool label="Italic" onPress={() => command("italic")}><Italic size={16} /></Tool><Tool label="Underline" onPress={() => command("underline")}><Underline size={16} /></Tool><Tool label="Strikethrough" onPress={() => command("strikeThrough")}><Strikethrough size={16} /></Tool><Tool label="Link" onPress={createLink}><Link size={16} /></Tool><Tool label="Bulleted list" onPress={() => command("insertUnorderedList")}><List size={16} /></Tool><Tool label="Numbered list" onPress={() => command("insertOrderedList")}><ListOrdered size={16} /></Tool>
    </div>}
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Rich Text content" aria-multiline="true" className="min-h-[1.5em] w-full cursor-text outline-none [&>*]:m-0 [&>*+*]:mt-[0.75em] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-[1.5em] [&_ul]:list-disc [&_ul]:pl-[1.5em]" onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; commit(); }} onInput={commit} />
  </div>;
}

function Tool({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} className="grid size-9 place-items-center rounded-md text-foreground-muted hover:bg-surface-muted hover:text-foreground" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onPress(); }}>{children}</button>;
}
