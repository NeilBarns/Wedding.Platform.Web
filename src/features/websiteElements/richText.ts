import type { RichTextDocument } from "./types";

export type RichTextRun = RichTextDocument["children"][number] extends infer Block
  ? Block extends { children: infer Runs } ? Runs extends Array<infer Run> ? Run : never
  : Block extends { items: Array<Array<infer Run>> } ? Run : never : never;

export const emptyRichTextDocument = (): RichTextDocument => ({ type: "doc", children: [{ type: "paragraph", children: [{ text: "" }] }] });

export function canonicalizeRichTextDocument(document: RichTextDocument): RichTextDocument {
  const run = (value: RichTextRun): RichTextRun => {
    const marks = value.marks;
    const canonicalMarks = marks ? {
      ...(marks.bold === true ? { bold: true } : {}),
      ...(marks.italic === true ? { italic: true } : {}),
      ...(marks.underline === true ? { underline: true } : {}),
      ...(marks.strikethrough === true ? { strikethrough: true } : {}),
      ...(typeof marks.link === "string" && safeLink(marks.link) ? { link: marks.link } : {}),
    } : {};
    return { text: typeof value.text === "string" ? value.text : "", ...(Object.keys(canonicalMarks).length ? { marks: canonicalMarks } : {}) };
  };
  return {
    type: "doc",
    children: document.children.map((block) => block.type === "paragraph"
      ? { type: "paragraph", children: block.children.map(run) }
      : { type: block.type, items: block.items.map((item) => item.map(run)) }),
  };
}

export function richTextPlainText(document: RichTextDocument) {
  return document.children.map((block) => block.type === "paragraph"
    ? block.children.map(({ text }) => text).join("")
    : block.items.map((item) => item.map(({ text }) => text).join("")).join(" ")).join(" ").trim();
}

export function richTextDocumentToHtml(document: RichTextDocument) {
  return document.children.map((block) => {
    if (block.type === "paragraph") return `<p>${runsToHtml(block.children)}</p>`;
    const tag = block.type === "bulletList" ? "ul" : "ol";
    return `<${tag}>${block.items.map((item) => `<li>${runsToHtml(item)}</li>`).join("")}</${tag}>`;
  }).join("");
}

function runsToHtml(runs: RichTextRun[]) {
  return runs.map((run) => {
    let value = escapeHtml(run.text).replace(/\n/g, "<br>");
    if (run.marks?.bold) value = `<strong>${value}</strong>`;
    if (run.marks?.italic) value = `<em>${value}</em>`;
    if (run.marks?.underline) value = `<u>${value}</u>`;
    if (run.marks?.strikethrough) value = `<s>${value}</s>`;
    if (run.marks?.link) value = `<a href="${escapeAttribute(run.marks.link)}">${value}</a>`;
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
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(element.children).filter((item) => item.tagName.toLowerCase() === "li").map((item) => extractRuns(item));
      if (items.length) children.push({ type: tag === "ul" ? "bulletList" : "orderedList", items });
    } else if (tag === "div" && Array.from(element.children).some((child) => ["div", "p", "ul", "ol"].includes(child.tagName.toLowerCase()))) {
      appendNodes(element.childNodes);
    } else {
      children.push({ type: "paragraph", children: extractRuns(element) });
    }
  });
  appendNodes(root.childNodes);
  return { type: "doc", children: children.length ? children : [{ type: "paragraph", children: [{ text: "" }] }] };
}

function extractRuns(root: Element): RichTextRun[] {
  const runs: RichTextRun[] = [];
  const visit = (node: Node, marks: NonNullable<RichTextRun["marks"]>) => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (!text) return;
      const compactMarks = Object.fromEntries(Object.entries(marks).filter(([, value]) => value)) as NonNullable<RichTextRun["marks"]>;
      const previous = runs.at(-1);
      if (previous && JSON.stringify(previous.marks ?? {}) === JSON.stringify(compactMarks)) previous.text += text;
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
    if (tag === "a") {
      const href = element.getAttribute("href");
      if (href && safeLink(href)) next.link = href;
    }
    element.childNodes.forEach((child) => visit(child, next));
  };
  root.childNodes.forEach((node) => visit(node, {}));
  return runs.length ? runs : [{ text: "" }];
}

export function safeLink(value: string) {
  try { return ["http:", "https:", "mailto:"].includes(new URL(value).protocol); } catch { return false; }
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
const escapeAttribute = escapeHtml;
