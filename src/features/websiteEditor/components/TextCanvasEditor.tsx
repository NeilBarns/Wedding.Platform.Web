import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { TextElement } from "../../websiteElements/types";
import { withTextAppearance } from "../../websiteElements/textStylePresets";
import { EditableText } from "../inline/EditableText";
import type { ResponsiveViewport } from "../types";

export function TextCanvasEditor({ element, sectionId, viewport, onChange, inputStyle, renderValue }: {
  element: TextElement;
  sectionId: string;
  viewport: ResponsiveViewport;
  onChange: (element: TextElement) => void;
  inputStyle: CSSProperties;
  renderValue: (value: string) => ReactNode;
}) {
  const toggleBold = () => {
    const appearance = { ...element.appearance };
    if (appearance.fontWeight === 700) delete appearance.fontWeight; else appearance.fontWeight = 700;
    onChange(withTextAppearance(element, appearance));
  };
  const toggle = (key: "italic" | "underline" | "strikethrough") => {
    const appearance = { ...element.appearance };
    if (appearance[key]) delete appearance[key]; else appearance[key] = true;
    onChange(withTextAppearance(element, appearance));
  };

  return <span className="relative block" data-text-canvas-editor>
    {viewport !== "mobile" && <span className="absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 gap-1 rounded-lg border border-border bg-surface p-1 text-foreground shadow-[var(--shadow-dialog)]" role="toolbar" aria-label="Text formatting">
      <Tool label="Bold" pressed={element.appearance?.fontWeight === 700} onPress={toggleBold}><Bold size={16} /></Tool>
      <Tool label="Italic" pressed={element.appearance?.italic === true} onPress={() => toggle("italic")}><Italic size={16} /></Tool>
      <Tool label="Underline" pressed={element.appearance?.underline === true} onPress={() => toggle("underline")}><Underline size={16} /></Tool>
      <Tool label="Strikethrough" pressed={element.appearance?.strikethrough === true} onPress={() => toggle("strikethrough")}><Strikethrough size={16} /></Tool>
    </span>}
    <EditableText sectionId={sectionId} elementId={element.id} path={["childFlow", "elements"]} value={element.text} placeholder="Add text" label="Text" compact inputStyle={inputStyle} renderValue={renderValue} />
  </span>;
}

function Tool({ label, pressed, onPress, children }: { label: string; pressed: boolean; onPress: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={pressed} className={`grid size-9 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${pressed ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"}`} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onPress(); }}>{children}</button>;
}
