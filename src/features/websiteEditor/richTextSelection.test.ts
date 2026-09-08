import { describe, expect, it, vi } from "vitest";
import { captureVisibleRichTextRange, executeRichTextCommand, readRichTextCommandState, richTextCommandActiveAtRange } from "./richTextSelection";

describe("Rich Text toolbar commands", () => {
  it.each([
    ["caret", true, "word", true],
    ["empty", false, "", true],
    ["outside", false, "word", false],
  ])("hides for an invalid %s selection", (_label, collapsed, text, contained) => {
    const ownerDocument = { defaultView: { getSelection: () => ({ rangeCount: 1, getRangeAt: () => range }) } } as unknown as Document;
    const node = { ownerDocument } as Node;
    const range = { collapsed, toString: () => text, commonAncestorContainer: node, startContainer: node, endContainer: node, cloneRange: () => range } as unknown as Range;
    const editor = { ownerDocument, contains: () => contained } as unknown as HTMLElement;
    expect(captureVisibleRichTextRange(editor)).toBeNull();
  });

  it.each(["word", "multiple word phrase", "first paragraph\nsecond paragraph"])("shows for non-collapsed editor selection: %s", (text) => {
    const ownerDocument = { defaultView: { getSelection: () => ({ rangeCount: 1, getRangeAt: () => range }) } } as unknown as Document;
    const node = { ownerDocument } as Node;
    const range = { collapsed: false, toString: () => text, commonAncestorContainer: node, startContainer: node, endContainer: node, cloneRange: () => range } as unknown as Range;
    const editor = { ownerDocument, contains: () => true } as unknown as HTMLElement;
    expect(captureVisibleRichTextRange(editor)).toBe(range);
  });
  it("uses only emphasis commands in the editable element owner document", () => {
    const documentTarget = { execCommand: vi.fn(() => true), queryCommandState: vi.fn((command: string) => command === "bold") } as unknown as Document;
    const selection = { removeAllRanges: vi.fn(), addRange: vi.fn() };
    Object.assign(documentTarget, { defaultView: { getSelection: () => selection } });
    const node = { ownerDocument: documentTarget } as Node;
    const range = { commonAncestorContainer: node, startContainer: node, endContainer: node } as Range;
    const editor = { ownerDocument: documentTarget, contains: () => true, focus: vi.fn() } as unknown as HTMLElement;
    for (const command of ["bold", "italic", "underline", "strikeThrough"]) executeRichTextCommand(editor, range, command);
    expect(documentTarget.execCommand).toHaveBeenCalledTimes(4);
    expect(readRichTextCommandState(editor)).toEqual({ bold: true, italic: false, underline: false, strikeThrough: false });
    expect(documentTarget.queryCommandState).not.toHaveBeenCalledWith("createLink");
    expect(documentTarget.queryCommandState).not.toHaveBeenCalledWith("insertUnorderedList");
    expect(documentTarget.queryCommandState).not.toHaveBeenCalledWith("insertOrderedList");
  });

  it.each(["bold", "italic", "underline", "strikeThrough"] as const)("detects active %s at the preserved toolbar range", (command) => {
    const queryCommandState = vi.fn(() => true);
    const selection = { removeAllRanges: vi.fn(), addRange: vi.fn() };
    const documentTarget = { defaultView: { getSelection: () => selection }, queryCommandState } as unknown as Document;
    const node = { ownerDocument: documentTarget } as Node;
    const range = { startContainer: node, endContainer: node } as Range;
    const editor = { ownerDocument: documentTarget, contains: () => true } as unknown as HTMLElement;
    expect(richTextCommandActiveAtRange(editor, range, command)).toBe(true);
    expect(selection.removeAllRanges).toHaveBeenCalledOnce();
    expect(selection.addRange).toHaveBeenCalledWith(range);
    expect(queryCommandState).toHaveBeenCalledWith(command);
  });
});
