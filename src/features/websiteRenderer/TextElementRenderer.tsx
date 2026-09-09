import type { CSSProperties } from "react";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import type { TextElement } from "../websiteElements/types";
import { resolveTextResponsiveAppearance } from "../websiteElements/text";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { fontStackForTemplate } from "../websiteTemplates/design/catalogs";
import { TextCanvasEditor } from "../websiteEditor/components/TextCanvasEditor";
import { elementFontSizes, elementLetterSpacings, elementLineHeights } from "./elementTypography";

export type TextElementRendererProps = {
  element: TextElement;
  previewColor?: string;
  viewport: ResponsiveViewport;
  templateKey: string;
  library: TemplateDesignLibrary;
  projectColors?: readonly ProjectColor[];
  context?: ResolvedDesignContext | null;
  editor?: { sectionId: string; onChange: (element: TextElement) => void };
};

export function TextElementRenderer({ element, viewport, templateKey, library, projectColors = [], context, editor, previewColor }: TextElementRendererProps) {
  const appearance = element.appearance ?? {};
  const responsive = resolveTextResponsiveAppearance(appearance, viewport, { fontSize: "m", alignment: "start" });
  const fontFamilyId = appearance.fontFamilyId ?? context?.bodyFontId;
  const colorId = appearance.colorId ?? context?.bodyColorId;
  const decorations = [appearance.underline && "underline", appearance.strikethrough && "line-through"].filter(Boolean).join(" ") || "none";
  const style: CSSProperties = {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    margin: 0,
    padding: 0,
    overflowWrap: "anywhere",
    fontFamily: fontFamilyId ? fontStackForTemplate(templateKey, fontFamilyId) : "inherit",
    fontSize: elementFontSizes[responsive.fontSize],
    fontWeight: appearance.fontWeight ?? 400,
    fontStyle: appearance.italic ? "italic" : "normal",
    lineHeight: elementLineHeights[appearance.lineHeight ?? "normal"],
    letterSpacing: elementLetterSpacings[appearance.letterSpacing ?? "normal"],
    textAlign: responsive.alignment,
    color: previewColor ?? resolveWebsiteColor(colorId, library, projectColors) ?? "inherit",
    textDecorationLine: decorations,
    textTransform: appearance.textTransform ?? "none",
    whiteSpace: "normal",
  };
  const inputStyle: CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textAlign: style.textAlign,
    textDecoration: decorations,
    textDecorationLine: style.textDecorationLine,
    textTransform: style.textTransform,
  };
  const renderValue = (value: string) => renderFormattedValue(value, appearance);
  if (editor) return <TextCanvasEditor element={element} sectionId={editor.sectionId} viewport={viewport} onChange={editor.onChange} textStyle={style} inputStyle={inputStyle} renderValue={renderValue} effectiveFontFamilyId={fontFamilyId} />;
  return <p data-website-element="text" style={style}>{renderValue(element.text)}</p>;
}

function renderFormattedValue(value: string, appearance: TextElement["appearance"]) {
  if (appearance?.underline) return <u>{appearance.strikethrough ? <s>{value}</s> : value}</u>;
  if (appearance?.strikethrough) return <s>{value}</s>;
  return value;
}
