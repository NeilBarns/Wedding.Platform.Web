import { Bold, Italic, Link, List, ListOrdered, Strikethrough, Underline } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { richTextDocumentFromElement, richTextDocumentToHtml, safeLink } from "../../websiteElements/richText";
import type { RichTextElement } from "../../websiteElements/types";
import type { ResponsiveViewport } from "../types";
import { RICH_TEXT_COMMAND_EVENT, type RichTextCommand } from "../richTextCommands";
import { FloatingFormattingToolbar } from "./FloatingFormattingToolbar";
import { captureRichTextRange, commitPendingRichTextEdit, createRichTextEditSession, executeRichTextCommand } from "../richTextSelection";

export function RichTextCanvasEditor({ element, viewport, onChange }: { element: RichTextElement; viewport: ResponsiveViewport; onChange: (element: RichTextElement) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const rangeRef = useRef<Range | null>(null);
  const editSession = useRef(createRichTextEditSession());
  useLayoutEffect(() => { if (editorRef.current && !focused.current) editorRef.current.innerHTML = richTextDocumentToHtml(element.document); }, [element.document]);
  const commit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    commitPendingRichTextEdit(
      editSession.current,
      () => richTextDocumentFromElement(editor),
      (document) => onChange({ ...element, document }),
    );
  };
  const command = (name: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    executeRichTextCommand(editor, rangeRef.current, name, value);
    rangeRef.current = captureRichTextRange(editor);
    editSession.current.markDirty();
    commit();
  };
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
  useEffect(() => {
    const editor = editorRef.current;
    const documentTarget = editor?.ownerDocument;
    if (!editor || !documentTarget) return;
    const capture = () => { const range = captureRichTextRange(editor); if (range) rangeRef.current = range; };
    documentTarget.addEventListener("selectionchange", capture);
    return () => documentTarget.removeEventListener("selectionchange", capture);
  }, []);
  return <div className="relative w-full" data-rich-text-canvas-editor>
    <FloatingFormattingToolbar label="Rich Text formatting" viewport={viewport}>
      <Tool label="Bold" onPress={() => command("bold")}><Bold size={16} /></Tool><Tool label="Italic" onPress={() => command("italic")}><Italic size={16} /></Tool><Tool label="Underline" onPress={() => command("underline")}><Underline size={16} /></Tool><Tool label="Strikethrough" onPress={() => command("strikeThrough")}><Strikethrough size={16} /></Tool><Tool label="Link" onPress={createLink}><Link size={16} /></Tool><Tool label="Bulleted list" onPress={() => command("insertUnorderedList")}><List size={16} /></Tool><Tool label="Numbered list" onPress={() => command("insertOrderedList")}><ListOrdered size={16} /></Tool>
    </FloatingFormattingToolbar>
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Rich Text content" aria-multiline="true" className="min-h-[1.5em] w-full cursor-text outline-none [&>*]:m-0 [&>*+*]:mt-[0.75em] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-[1.5em] [&_ul]:list-disc [&_ul]:pl-[1.5em]" onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; commit(); }} onInput={() => { editSession.current.markDirty(); commit(); }} />
  </div>;
}

function Tool({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} className="grid size-9 place-items-center rounded-md text-foreground-muted hover:bg-surface-muted hover:text-foreground" onClick={onPress}>{children}</button>;
}
