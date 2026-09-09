import type { CSSProperties } from "react";
import type {
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import type { DateElement } from "../websiteElements/types";
import { resolveTextResponsiveAppearance } from "../websiteElements/text";
import type { ResponsiveViewport } from "../websiteEditor/types";
import { fontStackForTemplate } from "../websiteTemplates/design/catalogs";
import { formatDateOnly } from "./formatDateOnly";
import { elementFontSizes, elementLetterSpacings, elementLineHeights } from "./elementTypography";

export function DateElementRenderer({
  element,
  eventDate,
  mode,
  templateKey,
  library,
  projectColors = [],
  context,
  viewport,
  previewColor,
}: {
  element: DateElement;
  eventDate: string | null;
  mode: "editor" | "public";
  templateKey: string;
  library: TemplateDesignLibrary;
  projectColors?: readonly ProjectColor[];
  context?: ResolvedDesignContext | null;
  viewport: ResponsiveViewport;
  previewColor?: string;
}) {
  const appearance = element.appearance ?? {};
  const label = formatDateOnly(eventDate, appearance);
  if (!label) {
    return mode === "editor" ? (
      <p
        className="m-0 w-full text-sm italic text-foreground-muted"
        data-date-block-missing
        role="status"
      >
        Add a wedding date in Event settings to display this block.
      </p>
    ) : null;
  }

  const semanticStyle = appearance.textStyle ?? "heading";
  const inheritedFontSize = semanticStyle === "display" ? "xl" : semanticStyle === "body" ? "m" : "l";
  const responsive = resolveTextResponsiveAppearance(appearance, viewport, { fontSize: inheritedFontSize, alignment: "start" });
  const authoredAlignment = viewport === "desktop" ? appearance.alignment : appearance.responsive?.[viewport]?.alignment ?? appearance.alignment;
  const inheritedFontId = appearance.textStyle && semanticStyle !== "display" ? context?.bodyFontId : context?.headingFontId;
  const fontFamilyId = appearance.fontFamilyId ?? inheritedFontId;
  const style: CSSProperties = {
    display: "block",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    margin: 0,
    padding: 0,
    overflowWrap: "anywhere",
    fontFamily: fontFamilyId ? fontStackForTemplate(templateKey, fontFamilyId) : "inherit",
    fontSize: elementFontSizes[responsive.fontSize],
    fontWeight: appearance.fontWeight ?? (semanticStyle === "body" ? 400 : 600),
    lineHeight: elementLineHeights[appearance.lineHeight ?? (semanticStyle === "body" ? "normal" : "tight")],
    letterSpacing: elementLetterSpacings[appearance.letterSpacing ?? "normal"],
    textTransform: appearance.textTransform ?? "none",
    textAlign: authoredAlignment,
    color:
      (mode === "editor" ? previewColor : undefined) ??
      resolveWebsiteColor(appearance.colorId ?? context?.headingColorId, library, projectColors) ??
      "inherit",
  };

  return (
    <time data-website-element="date" {...{ datetime: eventDate! }} style={style}>
      {label}
    </time>
  );
}
