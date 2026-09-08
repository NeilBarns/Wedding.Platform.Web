import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { TextElement } from "../../websiteElements/types";
import { textFontCapabilities, toggleTextBold, toggleTextItalic } from "../../websiteElements/text";
import { withTextAppearance } from "../../websiteElements/textStylePresets";
import { EditableText } from "../inline/EditableText";
import type { ResponsiveViewport } from "../types";
import { FloatingFormattingToolbar } from "./FloatingFormattingToolbar";

export function TextCanvasEditor({ element, sectionId, viewport, onChange, textStyle, inputStyle, renderValue, effectiveFontFamilyId }: {
  element: TextElement;
  sectionId: string;
  viewport: ResponsiveViewport;
  onChange: (element: TextElement) => void;
  textStyle?: CSSProperties;
  inputStyle: CSSProperties;
  renderValue: (value: string) => ReactNode;
  effectiveFontFamilyId?: string;
}) {
  const capabilities = textFontCapabilities(effectiveFontFamilyId);
  const toggleBold = () => onChange(withTextAppearance(element, toggleTextBold(element.appearance ?? {}, effectiveFontFamilyId)));
  const toggleItalic = () => onChange(withTextAppearance(element, toggleTextItalic(element.appearance ?? {}, effectiveFontFamilyId)));
  const toggle = (key: "underline" | "strikethrough") => {
    const appearance = { ...element.appearance };
    if (appearance[key]) delete appearance[key]; else appearance[key] = true;
    onChange(withTextAppearance(element, appearance));
  };

  return <div className="relative w-full min-w-0 max-w-full [overflow-wrap:anywhere]" data-text-canvas-editor>
    <FloatingFormattingToolbar label="Text formatting" viewport={viewport} observeInOwnerRealm>
      <Tool label="Bold" pressed={element.appearance?.fontWeight === 700} disabled={!capabilities.weights.includes(700)} onPress={toggleBold}><Bold size={16} /></Tool>
      <Tool label="Italic" pressed={element.appearance?.italic === true} disabled={!capabilities.italic} onPress={toggleItalic}><Italic size={16} /></Tool>
      <Tool label="Underline" pressed={element.appearance?.underline === true} onPress={() => toggle("underline")}><Underline size={16} /></Tool>
      <Tool label="Strikethrough" pressed={element.appearance?.strikethrough === true} onPress={() => toggle("strikethrough")}><Strikethrough size={16} /></Tool>
    </FloatingFormattingToolbar>
    <p data-website-element="text" style={textStyle}>
      <EditableText sectionId={sectionId} elementId={element.id} path={["childFlow", "elements"]} value={element.text} placeholder="Add text" label="Text" compact inputStyle={inputStyle} renderValue={renderValue} />
    </p>
  </div>;
}

function Tool({ label, pressed, disabled, onPress, children }: { label: string; pressed: boolean; disabled?: boolean; onPress: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} className={`grid size-9 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40 ${pressed ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"}`} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); if (!disabled) onPress(); }}>{children}</button>;
}
