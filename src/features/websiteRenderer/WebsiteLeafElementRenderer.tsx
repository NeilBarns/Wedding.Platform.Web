import { scopedColorPreviewTarget, useEditorColorPreview } from "../websiteEditor/colorPreview";
import type { WebsiteLeafElement } from "../websiteElements/types";
import { TextElementRenderer, type TextElementRendererProps } from "./TextElementRenderer";
import { RichTextElementRenderer } from "./RichTextElementRenderer";
import { useWebsiteElementChange } from "./WebsiteElementChangeContext";
import { DividerElementRenderer } from "./DividerElementRenderer";
import { MediaElementRenderer } from "./MediaElementRenderer";
import { DateElementRenderer } from "./DateElementRenderer";
import { AccordionElementRenderer } from "./AccordionElementRenderer";
import { ScheduleElementRenderer } from "./ScheduleElementRenderer";
import { PeopleElementRenderer } from "./PeopleElementRenderer";

type Props = Omit<TextElementRendererProps, "element" | "editor" | "previewColor"> & { element: WebsiteLeafElement; mode?: "editor" | "public"; sectionId?: string; selected?: boolean; media?: import("../websiteEditor/types").WebsiteDraft["media"]; eventDate?: string | null };

/** Exhaustive public/editor dispatch seam for Section leaf elements. */
export function WebsiteLeafElementRenderer({ element, mode = "public", sectionId, selected = false, media = {}, eventDate = null, ...context }: Props) {
  const previewColor = useEditorColorPreview(scopedColorPreviewTarget(sectionId ?? "", `${element.id}:color`), mode === "editor");
  const changes = useWebsiteElementChange();
  if (element.type === "text") return <TextElementRenderer previewColor={previewColor} element={element} editor={mode === "editor" && sectionId && selected && changes.onElementChange ? { sectionId, onChange: (next) => changes.onElementChange?.(sectionId, next) } : undefined} {...context} />;
  if (element.type === "richText") return <RichTextElementRenderer previewColor={previewColor} element={element} editor={mode === "editor" && selected && sectionId && changes.onRichTextDocumentChange ? { onDocumentChange: (elementId, document) => changes.onRichTextDocumentChange?.(sectionId, elementId, document) } : undefined} {...context} />;
  if (element.type === "divider") return <DividerElementRenderer previewColor={previewColor} element={element} mode={mode} {...context} />;
  if (element.type === "media") return <MediaElementRenderer element={element} mode={mode} viewport={context.viewport} media={media} />;
  if (element.type === "date") return <DateElementRenderer previewColor={previewColor} element={element} eventDate={eventDate} mode={mode} {...context} />;
  if (element.type === "accordion") return <AccordionElementRenderer element={element} mode={mode} />;
  if (element.type === "schedule") return <ScheduleElementRenderer element={element} mode={mode} templateKey={context.templateKey} />;
  if (element.type === "people") return <PeopleElementRenderer element={element} mode={mode} templateKey={context.templateKey} media={media} />;
  return mode === "editor" ? <div data-unsupported-website-element role="status">Unsupported element: {element.type}</div> : null;
}
