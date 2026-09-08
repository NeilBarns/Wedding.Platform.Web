import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { richTextDocumentSchema } from "./schemas";
import { richTextDocumentFromPasteElement, richTextDocumentToHtml } from "./richText";
import { RichTextElementRenderer } from "../websiteRenderer/RichTextElementRenderer";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";

const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;
const richTextDocument = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "First", marks: { bold: true, italic: true, underline: true, strikethrough: true } }] }, { type: "paragraph" as const, children: [{ text: "Second" }] }] };
type ForeignNode = { nodeType: number; textContent?: string; tagName?: string; childNodes: ForeignNode[]; children: ForeignNode[]; querySelectorAll(): ForeignNode[] };
const text = (textContent: string): ForeignNode => ({ nodeType: 3, textContent, childNodes: [], children: [], querySelectorAll: () => [] });
const element = (tagName: string, childNodes: ForeignNode[]): ForeignNode => ({ nodeType: 1, tagName: tagName.toUpperCase(), childNodes, children: childNodes.filter((node) => node.nodeType === 1), querySelectorAll: () => [] });

describe("Rich Text canonical document", () => {
  it("allows only paragraphs and emphasis marks", () => {
    expect(richTextDocumentSchema.safeParse(richTextDocument).success).toBe(true);
    expect(richTextDocumentSchema.safeParse({ type: "doc", children: [{ type: "bulletList", items: [[{ text: "No" }]] }] }).success).toBe(false);
    expect(richTextDocumentSchema.safeParse({ type: "doc", children: [{ type: "paragraph", children: [{ text: "No", marks: { link: "https://example.com" } }] }] }).success).toBe(false);
  });

  it("normalizes pasted lists and links into paragraph text while retaining emphasis", () => {
    const root = element("div", [element("ul", [element("li", [element("strong", [text("One")])]), element("li", [element("a", [element("em", [text("Two")])])])])]);
    expect(richTextDocumentFromPasteElement(root as unknown as HTMLElement)).toEqual({ type: "doc", children: [{ type: "paragraph", children: [{ text: "One", marks: { bold: true } }] }, { type: "paragraph", children: [{ text: "Two", marks: { italic: true } }] }] });
  });

  it("serializes and renders only paragraphs and supported inline emphasis", () => {
    expect(richTextDocumentToHtml(richTextDocument)).toBe('<p><s><u><em><strong>First</strong></em></u></s></p><p>Second</p>');
    const html = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", editorName: "Rich Text 1", document: richTextDocument }} viewport="desktop" templateKey="modern-editorial-v1" library={library} />);
    expect(html).toContain("<strong");
    expect(html).not.toMatch(/<(?:ul|ol|li|a)(?:\s|>)/);
  });

  it("owns a visible one-and-a-half-em gap only between three public paragraphs", () => {
    const document = { type: "doc" as const, children: ["First", "Second", "Third"].map((text) => ({ type: "paragraph" as const, children: [{ text }] })) };
    const html = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", editorName: "Rich Text 1", document }} viewport="desktop" templateKey="modern-editorial-v1" library={library} />);
    expect(html).toContain("[&amp;&gt;p+p]:mt-[1.5em]");
    expect(html).toContain('<p class="m-0 whitespace-pre-wrap"><span>First</span></p><p class="m-0 whitespace-pre-wrap"><span>Second</span></p><p class="m-0 whitespace-pre-wrap"><span>Third</span></p>');
    expect(html).not.toContain("space-y-");
  });

  it("uses the same internal paragraph rhythm in the editor without outer paragraph margins", async () => {
    const { RichTextCanvasEditor } = await import("../websiteEditor/components/RichTextCanvasEditor");
    const html = renderToStaticMarkup(<RichTextCanvasEditor element={{ id: "rich-1", type: "richText", editorName: "Rich Text 1", document: richTextDocument }} viewport="desktop" onDocumentChange={() => undefined} />);
    expect(html).toContain("[&amp;&gt;*]:m-0");
    expect(html).toContain("[&amp;&gt;p+p]:mt-[1.5em]");
    expect(html).not.toContain("space-y-");
  });

  it("keeps a trailing empty paragraph from creating external bottom space", () => {
    const document = { type: "doc" as const, children: [{ type: "paragraph" as const, children: [{ text: "Visible" }] }, { type: "paragraph" as const, children: [{ text: "" }] }] };
    expect(richTextDocumentToHtml(document)).toBe('<p>Visible</p><p data-rich-text-empty-paragraph></p>');
    const publicHtml = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", editorName: "Rich Text 1", document }} viewport="desktop" templateKey="modern-editorial-v1" library={library} />);
    expect(publicHtml).toContain("m-0 min-h-0");
    expect(publicHtml).toContain("p[data-rich-text-empty-paragraph]]:!mt-0");
    expect(publicHtml).toContain('data-rich-text-empty-paragraph="true"');
  });
});
