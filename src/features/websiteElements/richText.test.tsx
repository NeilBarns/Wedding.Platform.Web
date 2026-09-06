import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { richTextDocumentSchema, richTextElementSchema } from "./schemas";
import { richTextDocumentFromElement, richTextDocumentToHtml, richTextPlainText, safeLink } from "./richText";
import { RichTextElementRenderer } from "../websiteRenderer/RichTextElementRenderer";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";

const document = { type: "doc" as const, children: [
  { type: "paragraph" as const, children: [{ text: "Hello ", marks: { bold: true } }, { text: "world", marks: { link: "https://example.com" } }] },
  { type: "bulletList" as const, items: [[{ text: "One", marks: { italic: true, underline: true, strikethrough: true } }]] },
] };
const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;

type ForeignNode = {
  nodeType: number;
  textContent?: string;
  tagName?: string;
  childNodes: ForeignNode[];
  children: ForeignNode[];
  getAttribute(name: string): string | null;
};

const foreignText = (textContent: string): ForeignNode => ({ nodeType: 3, textContent, childNodes: [], children: [], getAttribute: () => null });
const foreignElement = (tagName: string, childNodes: ForeignNode[], attributes: Record<string, string> = {}): ForeignNode => ({
  nodeType: 1,
  tagName: tagName.toUpperCase(),
  childNodes,
  children: childNodes.filter(({ nodeType }) => nodeType === 1),
  getAttribute: (name) => attributes[name] ?? null,
});

describe("Rich Text", () => {
  it("accepts structured paragraphs, lists, marks, and safe links", () => {
    expect(richTextDocumentSchema.safeParse(document).success).toBe(true);
    expect(richTextElementSchema.safeParse({ id: "rich-1", type: "richText", document }).success).toBe(true);
    expect(safeLink("https://example.com")).toBe(true);
    expect(safeLink("javascript:alert(1)")).toBe(false);
  });

  it("serializes only the bounded canonical markup used by the editor", () => {
    expect(richTextDocumentToHtml(document)).toBe('<p><strong>Hello </strong><a href="https://example.com">world</a></p><ul><li><s><u><em>One</em></u></s></li></ul>');
    expect(richTextPlainText(document)).toBe("Hello world One");
  });

  it.each([
    ["Bold", foreignElement("p", [foreignElement("b", [foreignText("Keep me")])]), { type: "paragraph", children: [{ text: "Keep me", marks: { bold: true } }] }],
    ["Italic", foreignElement("p", [foreignElement("i", [foreignText("Keep me")])]), { type: "paragraph", children: [{ text: "Keep me", marks: { italic: true } }] }],
    ["Underline", foreignElement("p", [foreignElement("u", [foreignText("Keep me")])]), { type: "paragraph", children: [{ text: "Keep me", marks: { underline: true } }] }],
    ["Strikethrough", foreignElement("p", [foreignElement("strike", [foreignText("Keep me")])]), { type: "paragraph", children: [{ text: "Keep me", marks: { strikethrough: true } }] }],
    ["Link", foreignElement("p", [foreignElement("a", [foreignText("Keep me")], { href: "https://example.com" })]), { type: "paragraph", children: [{ text: "Keep me", marks: { link: "https://example.com" } }] }],
    ["Bulleted list", foreignElement("ul", [foreignElement("li", [foreignText("Keep me")])]), { type: "bulletList", items: [[{ text: "Keep me" }]] }],
    ["Numbered list", foreignElement("ol", [foreignElement("li", [foreignText("Keep me")])]), { type: "orderedList", items: [[{ text: "Keep me" }]] }],
  ])("serializes Tablet iframe %s DOM without parent-realm instanceof checks", (_command, formatted, expected) => {
    const root = foreignElement("div", [formatted]);
    expect(richTextDocumentFromElement(root as unknown as HTMLElement)).toEqual({ type: "doc", children: [expected] });
  });

  it("renders semantic long-form content without injecting stored HTML", () => {
    const html = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", document, appearance: { textTransform: "uppercase" } }} viewport="desktop" templateKey="modern-editorial-v1" library={library} />);
    expect(html).toContain("<strong>");
    expect(html).toContain("<ul");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("text-transform:uppercase");
    expect(html).toContain("width:100%");
  });

  it("moves content authoring into the selected canvas element", () => {
    const selected = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", document }} viewport="desktop" templateKey="modern-editorial-v1" library={library} editor={{ onChange: () => undefined }} />);
    const published = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", document }} viewport="desktop" templateKey="modern-editorial-v1" library={library} />);
    expect(selected).toContain('aria-label="Rich Text formatting"');
    expect(selected).not.toContain("Font size:");
    expect(selected).not.toContain("Line height:");
    expect(selected).not.toContain("Letter spacing:");
    expect(selected).not.toContain("Alignment:");
    expect(selected).toContain('contentEditable="true"');
    expect(selected).toContain("[&amp;&gt;*]:m-0");
    expect(selected).toContain("[&amp;&gt;*+*]:mt-[0.75em]");
    expect(published).not.toContain('contentEditable="true"');
    const mobile = renderToStaticMarkup(<RichTextElementRenderer element={{ id: "rich-1", type: "richText", document }} viewport="mobile" templateKey="modern-editorial-v1" library={library} editor={{ onChange: () => undefined }} />);
    expect(mobile).not.toContain('aria-label="Rich Text formatting"');
    expect(mobile).toContain('contentEditable="true"');
  });
});
