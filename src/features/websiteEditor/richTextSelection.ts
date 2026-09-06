export function captureRichTextRange(editor: HTMLElement): Range | null {
  const selection = editor.ownerDocument.defaultView?.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
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

export function executeRichTextCommand(editor: HTMLElement, range: Range | null, command: string, value?: string) {
  editor.focus({ preventScroll: true });
  restoreRichTextRange(editor, range);
  return editor.ownerDocument.execCommand(command, false, value);
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
