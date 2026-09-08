import type { CSSProperties, ReactNode } from "react";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import type { RichTextDocument, RichTextElement } from "../websiteElements/types";
import { resolveTextResponsiveAppearance, textFontCapabilities } from "../websiteElements/text";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { fontStackForTemplate } from "../websiteTemplates/design/catalogs";
import { RichTextCanvasEditor } from "../websiteEditor/components/RichTextCanvasEditor";

const fontSizes = { xs: "0.75rem", s: "0.875rem", m: "1rem", l: "1.5rem", xl: "2.25rem" } as const;
const lineHeights = { tight: 1.2, normal: 1.5, relaxed: 1.75 } as const;
const letterSpacings = { tight: "-0.02em", normal: "0em", wide: "0.08em" } as const;

export type RichTextElementRendererProps = { element: RichTextElement; previewColor?: string; viewport: ResponsiveViewport; templateKey: string; library: TemplateDesignLibrary; projectColors?: readonly ProjectColor[]; context?: ResolvedDesignContext | null; editor?: { onDocumentChange: (elementId: string, document: RichTextDocument) => void } };

export function RichTextElementRenderer({ element, viewport, templateKey, library, projectColors = [], context, editor, previewColor }: RichTextElementRendererProps) {
  const appearance = element.appearance ?? {};
  const responsive = resolveTextResponsiveAppearance(appearance, viewport, { fontSize: "m", alignment: "start" });
  const fontFamilyId = appearance.fontFamilyId ?? context?.bodyFontId;
  const fontCapabilities = textFontCapabilities(fontFamilyId);
  const baseFontWeight = appearance.fontWeight ?? 400;
  const emphasizedFontWeight = fontCapabilities.weights.includes(700) ? 700 : baseFontWeight;
  const style: CSSProperties = { width: "100%", fontFamily: fontFamilyId ? fontStackForTemplate(templateKey, fontFamilyId) : "inherit", fontWeight: appearance.fontWeight ?? 400, fontSize: fontSizes[responsive.fontSize], lineHeight: lineHeights[appearance.lineHeight ?? "normal"], letterSpacing: letterSpacings[appearance.letterSpacing ?? "normal"], textAlign: responsive.alignment, color: previewColor ?? resolveWebsiteColor(appearance.colorId ?? context?.bodyColorId, library, projectColors) ?? "inherit" };
  return <div data-website-element="richText" className="m-0 min-h-0 w-full min-w-0 max-w-full p-0 [overflow-wrap:anywhere] [&>p+p]:mt-[1.5em] [&>p[data-rich-text-empty-paragraph]]:!mt-0" style={style}>{editor ? <RichTextCanvasEditor element={element} viewport={viewport} effectiveFontFamilyId={fontFamilyId} onDocumentChange={editor.onDocumentChange} /> : renderDocument(element.document, emphasizedFontWeight, fontCapabilities.italic)}</div>;
}

function renderDocument(document: RichTextDocument, emphasizedFontWeight: number, supportsItalic: boolean) {
  return document.children.map((block, index) => {
    const empty = block.children.every((run) => run.text.length === 0);
    return <p className="m-0 whitespace-pre-wrap" data-rich-text-empty-paragraph={empty || undefined} key={index}>{empty ? null : renderRuns(block.children, emphasizedFontWeight, supportsItalic)}</p>;
  });
}

function renderRuns(runs: RichTextDocument["children"][number]["children"], emphasizedFontWeight: number, supportsItalic: boolean) {
  return runs.map((run, index) => {
    let content: ReactNode = run.text;
    if (run.marks?.bold) content = <strong style={{ fontWeight: emphasizedFontWeight }}>{content}</strong>;
    if (run.marks?.italic) content = <em style={supportsItalic ? undefined : { fontStyle: "normal" }}>{content}</em>;
    if (run.marks?.underline) content = <u>{content}</u>;
    if (run.marks?.strikethrough) content = <s>{content}</s>;
    return <span key={index}>{content}</span>;
  });
}
