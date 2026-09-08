import type { CSSProperties } from "react";
import type {
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../websiteCapabilities/types";
import type { ProjectColor } from "../websiteColors/projectColors";
import { resolveWebsiteColor } from "../websiteColors/projectColors";
import type { DateElement } from "../websiteElements/types";
import { fontStackForTemplate } from "../websiteTemplates/design/catalogs";
import { formatDateOnly } from "./formatDateOnly";

export function DateElementRenderer({
  element,
  eventDate,
  mode,
  templateKey,
  library,
  projectColors = [],
  context,
}: {
  element: DateElement;
  eventDate: string | null;
  mode: "editor" | "public";
  templateKey: string;
  library: TemplateDesignLibrary;
  projectColors?: readonly ProjectColor[];
  context?: ResolvedDesignContext | null;
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

  const style: CSSProperties = {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    margin: 0,
    padding: 0,
    overflowWrap: "anywhere",
    fontFamily: (appearance.textStyle === "body" ? context?.bodyFontId : context?.headingFontId)
      ? fontStackForTemplate(templateKey, appearance.textStyle === "body" ? context!.bodyFontId : context!.headingFontId)
      : "inherit",
    fontSize: appearance.textStyle === "display" ? "3rem" : appearance.textStyle === "body" ? "1rem" : "1.5rem",
    fontWeight: appearance.textStyle === "body" ? 400 : 600,
    lineHeight: appearance.textStyle === "body" ? 1.5 : 1.2,
    textAlign: appearance.alignment,
    color:
      resolveWebsiteColor(appearance.colorId ?? context?.headingColorId, library, projectColors) ??
      "inherit",
  };

  return (
    <time data-website-element="date" {...{ datetime: eventDate! }} style={style}>
      {label}
    </time>
  );
}
