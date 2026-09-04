import type { CSSProperties, ReactNode } from "react";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import type { RichTextDocument, RichTextElement } from "../websiteElements/types";
import { resolveTextResponsiveAppearance } from "../websiteElements/text";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { fontStackForTemplate } from "../websiteTemplates/design/catalogs";
import { RichTextCanvasEditor } from "../websiteEditor/components/RichTextCanvasEditor";

const fontSizes = { xs: "0.75rem", s: "0.875rem", m: "1rem", l: "1.5rem", xl: "2.25rem" } as const;
const lineHeights = { tight: 1.2, normal: 1.5, relaxed: 1.75 } as const;
const letterSpacings = { tight: "-0.02em", normal: "0em", wide: "0.08em" } as const;

export type RichTextElementRendererProps = { element: RichTextElement; viewport: ResponsiveViewport; templateKey: string; library: TemplateDesignLibrary; projectColors?: readonly ProjectColor[]; context?: ResolvedDesignContext | null; editor?: { onChange: (element: RichTextElement) => void } };

export function RichTextElementRenderer({ element, viewport, templateKey, library, projectColors = [], context, editor }: RichTextElementRendererProps) {
  const appearance = element.appearance ?? {};
  const responsive = resolveTextResponsiveAppearance(appearance, viewport, { fontSize: "m", alignment: "start" });
  const fontFamilyId = appearance.fontFamilyId ?? context?.bodyFontId;
  const style: CSSProperties = { width: "100%", fontFamily: fontFamilyId ? fontStackForTemplate(templateKey, fontFamilyId) : "inherit", fontSize: fontSizes[responsive.fontSize], lineHeight: lineHeights[appearance.lineHeight ?? "normal"], letterSpacing: letterSpacings[appearance.letterSpacing ?? "normal"], textAlign: responsive.alignment, color: resolveWebsiteColor(appearance.colorId ?? context?.bodyColorId, library, projectColors) ?? "inherit", textTransform: appearance.textTransform ?? "none" };
  return <div data-website-element="richText" className="space-y-[0.75em] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-[1.5em] [&_ul]:list-disc [&_ul]:pl-[1.5em]" style={style}>{editor ? <RichTextCanvasEditor element={element} viewport={viewport} onChange={editor.onChange} /> : renderDocument(element.document)}</div>;
}

function renderDocument(document: RichTextDocument) {
  return document.children.map((block, index) => block.type === "paragraph"
    ? <p className="m-0 whitespace-pre-wrap" key={index}>{renderRuns(block.children)}</p>
    : block.type === "bulletList"
      ? <ul className="m-0" key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderRuns(item)}</li>)}</ul>
      : <ol className="m-0" key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderRuns(item)}</li>)}</ol>);
}

function renderRuns(runs: RichTextDocument["children"][number] extends infer B ? B extends { children: infer R } ? R : never : never) {
  return (runs as Array<{ text: string; marks?: { bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; link?: string } }>).map((run, index) => {
    let content: ReactNode = run.text;
    if (run.marks?.bold) content = <strong>{content}</strong>;
    if (run.marks?.italic) content = <em>{content}</em>;
    if (run.marks?.underline) content = <u>{content}</u>;
    if (run.marks?.strikethrough) content = <s>{content}</s>;
    if (run.marks?.link) content = <a href={run.marks.link} target="_blank" rel="noopener noreferrer">{content}</a>;
    return <span key={index}>{content}</span>;
  });
}
