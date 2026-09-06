import { describe, expect, it, vi } from "vitest";
import { captureRichTextRange, commitPendingRichTextEdit, createRichTextEditSession, executeRichTextCommand, restoreRichTextRange } from "./richTextSelection";

function selectionHarness() {
  const documentTarget = { execCommand: vi.fn(() => true) } as unknown as Document;
  const selection = { rangeCount: 1, getRangeAt: vi.fn(), removeAllRanges: vi.fn(), addRange: vi.fn() };
  const view = { getSelection: vi.fn(() => selection) };
  Object.assign(documentTarget, { defaultView: view });
  const node = { ownerDocument: documentTarget } as Node;
  const range = { commonAncestorContainer: node, startContainer: node, endContainer: node, cloneRange: vi.fn() } as unknown as Range;
  (range.cloneRange as ReturnType<typeof vi.fn>).mockReturnValue(range);
  selection.getRangeAt.mockReturnValue(range);
  const editor = { ownerDocument: documentTarget, contains: vi.fn(() => true), focus: vi.fn() } as unknown as HTMLElement;
  return { documentTarget, selection, range, editor };
}

describe("Rich Text iframe selection lifecycle", () => {
  it.each(["bold", "italic", "underline", "strikeThrough", "createLink", "insertUnorderedList", "insertOrderedList"])("executes %s in the editable element ownerDocument", (command) => {
    const harness = selectionHarness();
    expect(captureRichTextRange(harness.editor)).toBe(harness.range);
    executeRichTextCommand(harness.editor, harness.range, command, command === "createLink" ? "https://example.com" : undefined);
    expect(harness.documentTarget.execCommand).toHaveBeenCalledWith(command, false, command === "createLink" ? "https://example.com" : undefined);
    expect(harness.selection.removeAllRanges).toHaveBeenCalledOnce();
    expect(harness.selection.addRange).toHaveBeenCalledWith(harness.range);
    expect(harness.editor.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("never restores a range from another document", () => {
    const harness = selectionHarness();
    const otherDocument = {} as Document;
    const otherNode = { ownerDocument: otherDocument } as Node;
    const otherRange = { startContainer: otherNode, endContainer: otherNode } as Range;
    expect(restoreRichTextRange(harness.editor, otherRange)).toBe(false);
    expect(harness.selection.addRange).not.toHaveBeenCalled();
  });

  it("does not authorize a document commit for plain or repeated blur cycles", () => {
    const session = createRichTextEditSession();
    const readDocument = vi.fn();
    const commitDocument = vi.fn();
    expect(commitPendingRichTextEdit(session, readDocument, commitDocument)).toBe(false);
    expect(commitPendingRichTextEdit(session, readDocument, commitDocument)).toBe(false);
    expect(readDocument).not.toHaveBeenCalled();
    expect(commitDocument).not.toHaveBeenCalled();
    expect(session.isDirty()).toBe(false);
  });

  it.each(["format", "edit text", "delete all"])("commits %s once and does not duplicate it on blur", () => {
    const session = createRichTextEditSession();
    const document = { type: "doc", children: [] };
    const readDocument = vi.fn(() => document);
    const commitDocument = vi.fn();
    session.markDirty();
    expect(session.isDirty()).toBe(true);
    expect(commitPendingRichTextEdit(session, readDocument, commitDocument)).toBe(true);
    expect(session.isDirty()).toBe(false);
    expect(commitPendingRichTextEdit(session, readDocument, commitDocument)).toBe(false);
    expect(readDocument).toHaveBeenCalledOnce();
    expect(commitDocument).toHaveBeenCalledOnce();
    expect(commitDocument).toHaveBeenCalledWith(document);
  });

  it.each([
    ["Bold", { type: "paragraph", children: [{ text: "Selected copy", marks: { bold: true } }] }],
    ["Italic", { type: "paragraph", children: [{ text: "Selected copy", marks: { italic: true } }] }],
    ["Underline", { type: "paragraph", children: [{ text: "Selected copy", marks: { underline: true } }] }],
    ["Strikethrough", { type: "paragraph", children: [{ text: "Selected copy", marks: { strikethrough: true } }] }],
    ["Link", { type: "paragraph", children: [{ text: "Selected copy", marks: { link: "https://example.com" } }] }],
    ["Bulleted list", { type: "bulletList", items: [[{ text: "Selected copy" }]] }],
    ["Numbered list", { type: "orderedList", items: [[{ text: "Selected copy" }]] }],
  ])("keeps the canonical Tablet document after %s followed by deselection", (_command, block) => {
    const session = createRichTextEditSession();
    const formatted = { type: "doc", children: [block] };
    let canonical: unknown = { type: "doc", children: [{ type: "paragraph", children: [{ text: "Selected copy" }] }] };

    session.markDirty();
    expect(commitPendingRichTextEdit(session, () => formatted, (document) => { canonical = document; })).toBe(true);
    expect(canonical).toEqual(formatted);
    expect(JSON.stringify(canonical)).toContain("Selected copy");

    const staleBlurRead = vi.fn(() => ({ type: "doc", children: [] }));
    expect(commitPendingRichTextEdit(session, staleBlurRead, (document) => { canonical = document; })).toBe(false);
    expect(staleBlurRead).not.toHaveBeenCalled();
    expect(canonical).toEqual(formatted);
  });

  it("supports repeated commands without changing selection ownership", () => {
    const harness = selectionHarness();
    executeRichTextCommand(harness.editor, harness.range, "bold");
    executeRichTextCommand(harness.editor, harness.range, "italic");
    expect(harness.documentTarget.execCommand).toHaveBeenCalledTimes(2);
    expect(harness.selection.addRange).toHaveBeenCalledTimes(2);
  });
});
