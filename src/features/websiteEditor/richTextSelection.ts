export function captureRichTextRange(editor: HTMLElement): Range | null {
  const selection = editor.ownerDocument.defaultView?.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

export function captureVisibleRichTextRange(editor: HTMLElement): Range | null {
  const range = captureRichTextRange(editor);
  if (!range || range.collapsed || range.toString().length === 0) return null;
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  return range;
}

export function restoreRichTextRange(editor: HTMLElement, range: Range | null): boolean {
  const documentTarget = editor.ownerDocument;
  if (!range || range.startContainer.ownerDocument !== documentTarget || range.endContainer.ownerDocument !== documentTarget) return false;
  const selection = documentTarget.defaultView?.getSelection();
  if (!selection) return false;
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

export function richTextCommandActiveAtRange(
  editor: HTMLElement,
  range: Range | null,
  command: "bold" | "italic" | "underline" | "strikeThrough",
): boolean {
  if (!restoreRichTextRange(editor, range)) return false;
  try {
    return editor.ownerDocument.queryCommandState(command);
  } catch {
    return false;
  }
}

export function executeRichTextCommand(editor: HTMLElement, range: Range | null, command: string, value?: string) {
  editor.focus({ preventScroll: true });
  restoreRichTextRange(editor, range);
  return editor.ownerDocument.execCommand(command, false, value);
}

/**
 * Uses Range extraction for inline marks so the browser never has an
 * opportunity to absorb text nodes immediately outside the selection.
 */
export function executeRichTextInlineCommand(editor: HTMLElement, range: Range | null, command: "bold" | "italic" | "underline" | "strikeThrough"): boolean {
  if (!range || range.collapsed || !editor.contains(range.commonAncestorContainer)) return false;
  const documentTarget = editor.ownerDocument;
  editor.focus({ preventScroll: true });
  if (!restoreRichTextRange(editor, range)) return false;
  const tag = { bold: "strong", italic: "em", underline: "u", strikeThrough: "s" }[command];
  const wrapper = documentTarget.createElement(tag);
  const content = range.extractContents();
  // Browsers can extend a word selection to its adjacent separator. Keep
  // boundary whitespace outside the mark: it is authored content, but it is
  // not part of the selected word. Internal whitespace remains formatted.
  const { leading, trailing } = removeInlineBoundaryWhitespace(content);
  if (leading) {
    const leadingNode = documentTarget.createTextNode(leading);
    range.insertNode(leadingNode);
    range.setStartAfter(leadingNode);
    range.collapse(true);
  }
  wrapper.append(content);
  range.insertNode(wrapper);
  if (trailing) {
    range.setStartAfter(wrapper);
    range.collapse(true);
    range.insertNode(documentTarget.createTextNode(trailing));
  }
  const selection = documentTarget.defaultView?.getSelection();
  if (selection) {
    const nextRange = documentTarget.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }
  return true;
}

function removeInlineBoundaryWhitespace(fragment: DocumentFragment): { leading: string; trailing: string } {
  const textNodes: Text[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === 3) textNodes.push(node as Text);
    else node.childNodes.forEach(visit);
  };
  fragment.childNodes.forEach(visit);
  const text = textNodes.map((node) => node.data).join("");
  // A deliberate selection consisting solely of whitespace is still allowed
  // to receive a mark; this adjustment is only for word/phrase boundaries.
  if (!text || !/\S/u.test(text)) return { leading: "", trailing: "" };

  const first = textNodes[0]!;
  const leading = first.data.match(/^\s+/u)?.[0] ?? "";
  first.data = first.data.slice(leading.length);
  const last = textNodes.at(-1)!;
  const trailing = last.data.match(/\s+$/u)?.[0] ?? "";
  last.data = last.data.slice(0, last.data.length - trailing.length);
  return { leading, trailing };
}

export type RichTextCommandState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
};

export function readRichTextCommandState(editor: HTMLElement): RichTextCommandState {
  const documentTarget = editor.ownerDocument;
  const query = (command: string) => {
    try { return documentTarget.queryCommandState(command); } catch { return false; }
  };
  return {
    bold: query("bold"),
    italic: query("italic"),
    underline: query("underline"),
    strikeThrough: query("strikeThrough"),
  };
}

export function preserveRichTextToolbarPointerDown(event: { preventDefault(): void; stopPropagation(): void }) {
  event.preventDefault();
  event.stopPropagation();
}

export function createRichTextEditSession() {
  let dirty = false;
  return {
    markDirty() {
      dirty = true;
    },
    markCommitted() {
      dirty = false;
    },
    isDirty() {
      return dirty;
    },
  };
}

export function commitPendingRichTextEdit<T>(
  session: ReturnType<typeof createRichTextEditSession>,
  readDocument: () => T,
  commitDocument: (document: T) => void,
) {
  if (!session.isDirty()) return false;
  const document = readDocument();
  commitDocument(document);
  session.markCommitted();
  return true;
}
