import { EditorSelectionFrame } from "./EditorSelectionFrame";

export function WebsiteElementFrame({
  mode,
  sectionId,
  elementId,
  elementType,
  selected,
  children,
  onSelect,
  onEdit,
}: {
  mode: "editor" | "public";
  sectionId: string;
  elementId: string;
  elementType: string;
  selected: boolean;
  children: React.ReactNode;
  onSelect?: (sectionId: string, elementId: string) => void;
  onEdit?: (sectionId: string, elementId: string) => void;
}) {
  const stretchesWidth = elementType === "text" || elementType === "richText" || elementType === "divider";
  if (mode === "public")
    return (
      <div
        className={stretchesWidth ? "w-full" : undefined}
        data-section-generic-child
        data-section-child-element={elementId}
      >
        {children}
      </div>
    );

  const label =
    elementType === "richText"
      ? "Rich Text"
      : elementType === "text"
        ? "Text"
        : elementType === "divider"
          ? "Divider"
        : elementType === "media"
          ? "Media"
        : elementType === "compositionGroup"
          ? "Group"
          : elementType;

  return (
    <div
      className={`editor-selection-target relative rounded-sm${stretchesWidth ? " w-full" : ""}`}
      data-section-generic-child
      data-section-child-element={elementId}
      data-editor-website-element={elementId}
      data-editor-selected={selected ? "true" : undefined}
      aria-label={`Edit ${label}`}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (selected) onEdit?.(sectionId, elementId);
        else onSelect?.(sectionId, elementId);
      }}
      onClickCapture={(event) => {
        if (event.detail === 0) {
          if (selected) onEdit?.(sectionId, elementId);
          else onSelect?.(sectionId, elementId);
        }
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="editor-element-badge"
        aria-label={`Select ${label}`}
        title={`Select ${label}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect?.(sectionId, elementId);
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {label}
      </button>
      {children}
      <EditorSelectionFrame selected={selected} />
    </div>
  );
}
