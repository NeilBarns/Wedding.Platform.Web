import type { WebsiteLeafElement } from "../websiteElements/types";
import { TextElementRenderer, type TextElementRendererProps } from "./TextElementRenderer";
import { RichTextElementRenderer } from "./RichTextElementRenderer";
import { useWebsiteElementChange } from "./WebsiteElementChangeContext";
import { DividerElementRenderer } from "./DividerElementRenderer";

type Props = Omit<TextElementRendererProps, "element" | "editor"> & { element: WebsiteLeafElement; mode?: "editor" | "public"; sectionId?: string; selected?: boolean };

/** Exhaustive public/editor dispatch seam for Section leaf elements. */
export function WebsiteLeafElementRenderer({ element, mode = "public", sectionId, selected = false, ...context }: Props) {
  const onElementChange = useWebsiteElementChange();
  if (element.type === "text") return <TextElementRenderer element={element} editor={mode === "editor" && sectionId && selected && onElementChange ? { sectionId, onChange: (next) => onElementChange(sectionId, next) } : undefined} {...context} />;
  if (element.type === "richText") return <RichTextElementRenderer element={element} editor={mode === "editor" && selected && sectionId && onElementChange ? { onChange: (next) => onElementChange(sectionId, next) } : undefined} {...context} />;
  if (element.type === "divider") return <DividerElementRenderer element={element} mode={mode} {...context} />;
  return mode === "editor" ? <div data-unsupported-website-element role="status">Unsupported element: {element.type}</div> : null;
}
