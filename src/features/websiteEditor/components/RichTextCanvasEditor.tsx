import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { canonicalizeRichTextDocument, limitRichTextDocument, restoreRichTextFormattingWhitespace, richTextDocumentFromElement, richTextDocumentFromHtml, richTextDocumentFromPlainText, richTextDocumentToHtml, richTextPlainText } from "../../websiteElements/richText";
import type { RichTextDocument, RichTextElement } from "../../websiteElements/types";
import { WEBSITE_ELEMENT_LIMITS } from "../../websiteElements/constants";
import { textFontCapabilities } from "../../websiteElements/text";
import type { ResponsiveViewport } from "../types";
import { RICH_TEXT_COMMAND_EVENT, type RichTextCommand } from "../richTextCommands";
import { FloatingFormattingToolbar } from "./FloatingFormattingToolbar";
import { captureRichTextRange, captureVisibleRichTextRange, commitPendingRichTextEdit, createRichTextEditSession, executeRichTextCommand, executeRichTextInlineCommand, preserveRichTextToolbarPointerDown, readRichTextCommandState, richTextCommandActiveAtRange, type RichTextCommandState } from "../richTextSelection";

export function RichTextCanvasEditor({ element, viewport, effectiveFontFamilyId, onDocumentChange }: { element: RichTextElement; viewport: ResponsiveViewport; effectiveFontFamilyId?: string; onDocumentChange: (elementId: string, document: RichTextDocument) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const rangeRef = useRef<Range | null>(null);
  const editSession = useRef(createRichTextEditSession());
  const skipNextFormattingInput = useRef(false);
  const capabilities = textFontCapabilities(effectiveFontFamilyId);
  const isEmpty = !richTextPlainText(element.document).trim();
  const [commandState, setCommandState] = useState<RichTextCommandState>({ bold: false, italic: false, underline: false, strikeThrough: false });
  const [toolbarRange, setToolbarRange] = useState<Range | null>(null);
  const refreshCommandState = () => { const editor = editorRef.current; if (editor) setCommandState(readRichTextCommandState(editor)); };
  useLayoutEffect(() => { if (editorRef.current && !focused.current) editorRef.current.innerHTML = richTextDocumentToHtml(element.document); }, [element.document]);
  const commit = (formattingReference?: RichTextDocument) => {
    const editor = editorRef.current;
    if (!editor) return;
    commitPendingRichTextEdit(
      editSession.current,
      () => {
        const document = canonicalizeRichTextDocument(richTextDocumentFromElement(editor));
        return formattingReference ? restoreRichTextFormattingWhitespace(formattingReference, document) : document;
      },
      (document) => onDocumentChange(element.id, document),
    );
  };
  const command = (name: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const formattingReference = canonicalizeRichTextDocument(richTextDocumentFromElement(editor));
    const inlineCommand = name === "bold" || name === "italic" || name === "underline" || name === "strikeThrough";
    const removingInlineCommand = inlineCommand && richTextCommandActiveAtRange(editor, rangeRef.current, name);
    const appliedInlineCommand = inlineCommand && !removingInlineCommand && executeRichTextInlineCommand(editor, rangeRef.current, name);
    if (!appliedInlineCommand) {
      // execCommand synchronously emits input. Its raw DOM is allowed to lose
      // inline-boundary whitespace, so only the reconciled commit below may be
      // persisted for commands that still require the browser implementation.
      skipNextFormattingInput.current = true;
      executeRichTextCommand(editor, rangeRef.current, name, value);
    }
    rangeRef.current = captureRichTextRange(editor);
    setToolbarRange(captureVisibleRichTextRange(editor));
    refreshCommandState();
    editSession.current.markDirty();
    commit(formattingReference);
  };
  const paste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current;
    if (!editor) return;
    event.preventDefault();
    const clipboard = event.clipboardData;
    const html = clipboard.getData("text/html");
    const source = html ? richTextDocumentFromHtml(editor.ownerDocument, html) : richTextDocumentFromPlainText(clipboard.getData("text/plain"));
    const current = richTextDocumentFromElement(editor);
    const remainingCharacters = Math.max(0, WEBSITE_ELEMENT_LIMITS.richText - richTextPlainText(current).length);
    const remainingBlocks = Math.max(1, 100 - current.children.length + 1);
    const document = limitRichTextDocument(source, remainingCharacters, remainingBlocks);
    executeRichTextCommand(editor, rangeRef.current, "insertHTML", richTextDocumentToHtml(document));
    rangeRef.current = captureRichTextRange(editor);
    refreshCommandState();
    editSession.current.markDirty();
    commit();
  };
  useEffect(() => {
    const handleCommand = (event: Event) => {
      const detail = (event as CustomEvent<{ elementId: string; command: RichTextCommand }>).detail;
      if (detail.elementId !== element.id) return;
      command(detail.command);
    };
    const view = editorRef.current?.ownerDocument.defaultView;
    if (!view) return;
    view.addEventListener(RICH_TEXT_COMMAND_EVENT, handleCommand);
    return () => view.removeEventListener(RICH_TEXT_COMMAND_EVENT, handleCommand);
  });
  useEffect(() => {
    const editor = editorRef.current;
    const documentTarget = editor?.ownerDocument;
    if (!editor || !documentTarget) return;
    const capture = () => {
      const range = captureVisibleRichTextRange(editor);
      setToolbarRange(range);
      if (!range) return;
      rangeRef.current = range;
      refreshCommandState();
    };
    documentTarget.addEventListener("selectionchange", capture);
    return () => documentTarget.removeEventListener("selectionchange", capture);
  }, []);
  return <div className="relative m-0 min-h-[1.75em] w-full min-w-0 max-w-full p-0 [overflow-wrap:anywhere]" data-rich-text-canvas-editor>
    <FloatingFormattingToolbar label="Rich Text formatting" viewport={viewport} observeInOwnerRealm range={toolbarRange}>
      <Tool label="Bold" disabled={!capabilities.weights.includes(700)} pressed={commandState.bold} onPress={() => command("bold")}><Bold size={16} /></Tool><Tool label="Italic" disabled={!capabilities.italic} pressed={commandState.italic} onPress={() => command("italic")}><Italic size={16} /></Tool><Tool label="Underline" pressed={commandState.underline} onPress={() => command("underline")}><Underline size={16} /></Tool><Tool label="Strikethrough" pressed={commandState.strikeThrough} onPress={() => command("strikeThrough")}><Strikethrough size={16} /></Tool>
    </FloatingFormattingToolbar>
    {isEmpty && <span className="inline-edit-placeholder pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">Add rich text</span>}
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Rich Text content" aria-multiline="true" className="relative m-0 min-h-[1.75em] w-full min-w-0 max-w-full cursor-text p-0 outline-none [overflow-wrap:anywhere] [&>*]:m-0 [&>p+p]:mt-[1.5em] [&>p[data-rich-text-empty-paragraph]]:!mt-0" onFocus={() => { focused.current = true; refreshCommandState(); }} onBlur={() => { focused.current = false; setToolbarRange(null); commit(); }} onInput={() => { if (skipNextFormattingInput.current) { skipNextFormattingInput.current = false; refreshCommandState(); return; } editSession.current.markDirty(); commit(); refreshCommandState(); }} onKeyDown={(event) => { if (event.key === "Tab") event.preventDefault(); }} onPaste={paste} />
  </div>;
}


function Tool({ label, pressed, disabled, onPress, children }: { label: string; pressed?: boolean; disabled?: boolean; onPress: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} className={`grid size-9 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40 ${pressed ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"}`} onPointerDown={(event) => { if (!disabled) preserveRichTextToolbarPointerDown(event); }} onClick={() => { if (!disabled) onPress(); }}>{children}</button>;
}
