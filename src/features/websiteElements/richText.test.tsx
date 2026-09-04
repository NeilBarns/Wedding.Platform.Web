import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { richTextDocumentSchema, richTextElementSchema } from "./schemas";
import { richTextDocumentToHtml, richTextPlainText, safeLink } from "./richText";
import { RichTextElementRenderer } from "../websiteRenderer/RichTextElementRenderer";
import type { TemplateDesignLibrary } from "../websiteCapabilities/types";

const document = { type: "doc" as const, children: [
  { type: "paragraph" as const, children: [{ text: "Hello ", marks: { bold: true } }, { text: "world", marks: { link: "https://example.com" } }] },
  { type: "bulletList" as const, items: [[{ text: "One", marks: { italic: true, underline: true, strikethrough: true } }]] },
] };
const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;

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
