import type { RichTextDocument } from "./types";
import { WEBSITE_ELEMENT_LIMITS } from "./constants";

export type RichTextRun = RichTextDocument["children"][number] extends infer Block
  ? Block extends { children: infer Runs } ? Runs extends Array<infer Run> ? Run : never
  : never : never;

export const emptyRichTextDocument = (): RichTextDocument => ({ type: "doc", children: [{ type: "paragraph", children: [{ text: "" }] }] });

export function canonicalizeRichTextDocument(document: RichTextDocument): RichTextDocument {
  const run = (value: RichTextRun): RichTextRun => {
    const marks = value.marks;
    const canonicalMarks = marks ? {
      ...(marks.bold === true ? { bold: true } : {}),
      ...(marks.italic === true ? { italic: true } : {}),
      ...(marks.underline === true ? { underline: true } : {}),
      ...(marks.strikethrough === true ? { strikethrough: true } : {}),
    } : {};
    return { text: typeof value.text === "string" ? value.text : "", ...(Object.keys(canonicalMarks).length ? { marks: canonicalMarks } : {}) };
  };
  return {
    type: "doc",
    children: document.children.map((block) => ({ type: "paragraph", children: block.children.map(run) })),
  };
}

/**
 * Some contentEditable implementations omit separator text nodes while wrapping
 * a selection with an inline mark. Restore only whitespace that was present in
 * the document immediately before that formatting command. If any authored
 * non-whitespace character changed, leave the candidate untouched.
 */
export function restoreRichTextFormattingWhitespace(reference: RichTextDocument, candidate: RichTextDocument): RichTextDocument {
  if (reference.children.length !== candidate.children.length) return candidate;
  const children = candidate.children.map((block, index) => {
    const source = reference.children[index];
    if (!source || source.type !== block.type) return block;
    return { ...block, children: restoreRunWhitespace(source.children, block.children) };
  });
  return { ...candidate, children };
}

function restoreRunWhitespace(reference: RichTextRun[], candidate: RichTextRun[]): RichTextRun[] {
  const sourceCharacters = reference.flatMap((run) => Array.from(run.text, (text) => ({ text, marks: run.marks })));
  const candidateCharacters = candidate.flatMap((run) => Array.from(run.text, (text) => ({ text, marks: run.marks })));
  // A blank paragraph is represented canonically by one empty run. Range
  // formatting can leave the candidate with no runs, but it must never
  // serialize as `children: []` because the document schema requires a run.
  if (sourceCharacters.length === 0 && candidateCharacters.length === 0) {
    return candidate.length ? candidate : [{ text: "" }];
  }
  const restored: Array<{ text: string; marks?: RichTextRun["marks"] }> = [];
  let sourceIndex = 0;

  for (const character of candidateCharacters) {
    while (sourceIndex < sourceCharacters.length && isWhitespace(sourceCharacters[sourceIndex]!.text) && sourceCharacters[sourceIndex]!.text !== character.text) {
      restored.push(sourceCharacters[sourceIndex]!);
      sourceIndex += 1;
    }
    if (sourceCharacters[sourceIndex]?.text !== character.text) return candidate;
    restored.push(character);
    sourceIndex += 1;
  }
  while (sourceIndex < sourceCharacters.length && isWhitespace(sourceCharacters[sourceIndex]!.text)) {
    restored.push(sourceCharacters[sourceIndex]!);
    sourceIndex += 1;
  }
  if (sourceIndex !== sourceCharacters.length) return candidate;

  return restored.reduce<RichTextRun[]>((runs, character) => {
    const previous = runs.at(-1);
    if (previous && sameMarks(previous.marks, character.marks ?? {})) previous.text += character.text;
    else runs.push({ text: character.text, ...(character.marks ? { marks: character.marks } : {}) });
    return runs;
  }, []);
}

function isWhitespace(value: string) {
  return /\s/u.test(value);
}

export function richTextPlainText(document: RichTextDocument) {
  return document.children.map((block) => block.children.map(({ text }) => text).join("")).join(" ").trim();
}

export function richTextDocumentToHtml(document: RichTextDocument) {
  return document.children.map((block) => {
    const empty = block.children.every((run) => run.text.length === 0);
    return `<p${empty ? " data-rich-text-empty-paragraph" : ""}>${empty ? "" : runsToHtml(block.children)}</p>`;
  }).join("");
}

function runsToHtml(runs: RichTextRun[]) {
  return runs.map((run) => {
    let value = escapeHtml(run.text).replace(/\n/g, "<br>");
    if (run.marks?.bold) value = `<strong>${value}</strong>`;
    if (run.marks?.italic) value = `<em>${value}</em>`;
    if (run.marks?.underline) value = `<u>${value}</u>`;
    if (run.marks?.strikethrough) value = `<s>${value}</s>`;
    return value;
  }).join("");
}

export function richTextDocumentFromElement(root: HTMLElement): RichTextDocument {
  const children: RichTextDocument["children"] = [];
  const appendNodes = (nodes: NodeListOf<ChildNode> | ChildNode[]) => Array.from(nodes).forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (text) children.push({ type: "paragraph", children: [{ text }] });
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "div" && Array.from(element.children).some((child) => ["div", "p", "ul", "ol", "li"].includes(child.tagName.toLowerCase()))) {
      appendNodes(element.childNodes);
    } else {
      children.push({ type: "paragraph", children: extractRuns(element) });
    }
  });
  appendNodes(root.childNodes);
  return { type: "doc", children: children.length ? children : [{ type: "paragraph", children: [{ text: "" }] }] };
}

/** Converts clipboard plain text into bounded paragraph-only canonical Rich Text. */
export function richTextDocumentFromPlainText(value: string): RichTextDocument {
  const lines = value.replace(/\r\n?/g, "\n").split("\n").filter((line) => line.length > 0);
  return limitRichTextDocument({ type: "doc", children: lines.length ? lines.map((text) => ({ type: "paragraph" as const, children: [{ text }] })) : [{ type: "paragraph", children: [{ text: "" }] }] });
}

/** Parses clipboard HTML in its owner realm and emits only the canonical document model. */
export function richTextDocumentFromHtml(documentTarget: Document, html: string): RichTextDocument {
  const root = documentTarget.createElement("div");
  root.innerHTML = html;
  return richTextDocumentFromPasteElement(root);
}

/** Normalizes an already-parsed clipboard DOM without retaining DOM metadata. */
export function richTextDocumentFromPasteElement(root: HTMLElement): RichTextDocument {
  const children: RichTextDocument["children"] = [];
  const append = (nodes: NodeListOf<ChildNode> | ChildNode[]) => Array.from(nodes).forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (text) children.push({ type: "paragraph", children: [{ text }] });
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li").map(extractPastedRuns).filter(hasReadableRuns).forEach((runs) => children.push({ type: "paragraph", children: runs }));
      return;
    }
    if (tag === "table") {
      const rows = Array.from(element.querySelectorAll("tr")).map(extractPastedRuns).filter(hasReadableRuns);
      rows.forEach((runs) => children.push({ type: "paragraph", children: runs }));
      if (!rows.length && hasReadableRuns(extractPastedRuns(element))) children.push({ type: "paragraph", children: extractPastedRuns(element) });
      return;
    }
    const hasBlockChildren = Array.from(element.children).some((child) => ["p", "div", "ul", "ol", "li", "table", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(child.tagName.toLowerCase()));
    if (tag === "div" && hasBlockChildren) append(element.childNodes);
    else {
      const runs = extractPastedRuns(element);
      if (hasReadableRuns(runs)) children.push({ type: "paragraph", children: runs });
    }
  });
  append(root.childNodes);
  return limitRichTextDocument({ type: "doc", children: children.length ? children : [{ type: "paragraph", children: [{ text: "" }] }] });
}

export function limitRichTextDocument(document: RichTextDocument, maximumCharacters: number = WEBSITE_ELEMENT_LIMITS.richText, maximumBlocks = 100): RichTextDocument {
  let remaining = Math.max(0, maximumCharacters);
  const trimRuns = (runs: RichTextRun[]) => runs.flatMap((run) => {
    if (remaining <= 0) return [];
    const text = run.text.slice(0, remaining);
    remaining -= text.length;
    return text ? [{ ...run, text }] : [];
  });
  const children: RichTextDocument["children"] = [];
  document.children.slice(0, maximumBlocks).forEach((block) => {
    const runs = trimRuns(block.children);
    if (runs.length) children.push({ type: "paragraph", children: runs });
  });
  return { type: "doc", children: children.length ? children : [{ type: "paragraph", children: [{ text: "" }] }] };
}

function extractRuns(root: Element): RichTextRun[] {
  const runs: RichTextRun[] = [];
  const visit = (node: Node, marks: NonNullable<RichTextRun["marks"]>) => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      // A text node containing only whitespace can be the authored separator
      // between adjacent inline elements (for example `Lorem <strong>ipsum</strong>`).
      // Only an actually empty node is ignorable.
      if (text.length === 0) return;
      const compactMarks = Object.fromEntries(Object.entries(marks).filter(([, value]) => value)) as NonNullable<RichTextRun["marks"]>;
      const previous = runs.at(-1);
      if (previous && sameMarks(previous.marks, compactMarks)) previous.text += text;
      else runs.push({ text, ...(Object.keys(compactMarks).length ? { marks: compactMarks } : {}) });
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    if (element.tagName === "BR") { runs.push({ text: "\n", ...(Object.keys(marks).length ? { marks } : {}) }); return; }
    const tag = element.tagName.toLowerCase();
    const next = { ...marks };
    if (tag === "b" || tag === "strong") next.bold = true;
    if (tag === "i" || tag === "em") next.italic = true;
    if (tag === "u") next.underline = true;
    if (tag === "s" || tag === "strike" || tag === "del") next.strikethrough = true;
    element.childNodes.forEach((child) => visit(child, next));
  };
  root.childNodes.forEach((node) => visit(node, {}));
  return runs.length ? runs : [{ text: "" }];
}

function sameMarks(first: RichTextRun["marks"] | undefined, second: NonNullable<RichTextRun["marks"]>): boolean {
  const firstEntries = Object.entries(first ?? {});
  const secondEntries = Object.entries(second);
  return firstEntries.length === secondEntries.length && firstEntries.every(([key, value]) => second[key as keyof typeof second] === value);
}

function extractPastedRuns(root: Element): RichTextRun[] {
  const runs: RichTextRun[] = [];
  const appendText = (text: string, marks: NonNullable<RichTextRun["marks"]>) => {
    if (!text) return;
    const compactMarks = Object.fromEntries(Object.entries(marks).filter(([, value]) => value)) as NonNullable<RichTextRun["marks"]>;
    const previous = runs.at(-1);
    if (previous && JSON.stringify(previous.marks ?? {}) === JSON.stringify(compactMarks)) previous.text += text;
    else runs.push({ text, ...(Object.keys(compactMarks).length ? { marks: compactMarks } : {}) });
  };
  const visit = (node: Node, marks: NonNullable<RichTextRun["marks"]>) => {
    if (node.nodeType === 3) { appendText(node.textContent ?? "", marks); return; }
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "br") { appendText("\n", marks); return; }
    if (tag === "ul" || tag === "ol") {
      Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li").forEach((item, index) => {
        if (runs.length && index === 0) appendText(" ", marks);
        if (index > 0) appendText(" ", marks);
        item.childNodes.forEach((child) => visit(child, marks));
      });
      return;
    }
    const next = { ...marks };
    if (tag === "b" || tag === "strong") next.bold = true;
    if (tag === "i" || tag === "em") next.italic = true;
    if (tag === "u") next.underline = true;
    if (tag === "s" || tag === "strike" || tag === "del") next.strikethrough = true;
    element.childNodes.forEach((child) => visit(child, next));
  };
  root.childNodes.forEach((node) => visit(node, {}));
  return runs;
}

function hasReadableRuns(runs: RichTextRun[]) {
  return runs.some((run) => run.text.length > 0);
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
