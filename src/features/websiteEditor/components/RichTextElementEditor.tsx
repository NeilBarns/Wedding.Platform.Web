import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link, List, ListOrdered, RotateCcw, Strikethrough, Underline } from "lucide-react";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../../websiteCapabilities/types";
import type { ProjectColor } from "../../websiteColors/projectColors";
import { resetTextResponsiveDevice, setTextResponsiveProperty, TEXT_ALIGNMENTS, TEXT_LETTER_SPACINGS, TEXT_LINE_HEIGHTS, TEXT_SIZES, type TextAppearance } from "../../websiteElements/text";
import type { RichTextElement } from "../../websiteElements/types";
import type { ResponsiveViewport } from "../types";
import { FontPicker } from "./FontPicker";
import { WebsiteColorSwatchControl } from "./WebsiteColorSwatchControl";
import { IconChoices, LineHeightIcon } from "./TextElementEditor";
import { dispatchRichTextCommand, type RichTextCommand } from "../richTextCommands";

type Props = { element: RichTextElement; viewport: ResponsiveViewport; library: TemplateDesignLibrary; allowedFontIds: readonly string[]; allowedColorIds: readonly string[]; projectColors: readonly ProjectColor[]; context?: ResolvedDesignContext | null; onAddColor: (value: string) => Promise<ProjectColor>; onChange: (element: RichTextElement) => void };
const labels = (values: readonly string[]) => values.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

export function RichTextElementEditor(props: Props) {
  const appearance = props.element.appearance ?? {};
  const responsive = props.viewport === "desktop" ? undefined : appearance.responsive?.[props.viewport];
  const update = (next: TextAppearance) => {
    const allowed = { fontFamilyId: next.fontFamilyId, fontSize: next.fontSize, lineHeight: next.lineHeight, letterSpacing: next.letterSpacing, alignment: next.alignment, colorId: next.colorId, textTransform: next.textTransform, responsive: next.responsive };
    const compact = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
    const element = { ...props.element };
    if (Object.keys(compact).length) element.appearance = compact; else delete element.appearance;
    props.onChange(element);
  };
  const setGlobal = (key: "fontFamilyId" | "fontSize" | "lineHeight" | "letterSpacing" | "alignment" | "colorId" | "textTransform", value?: string) => { const next = { ...appearance } as TextAppearance; if (value) Object.assign(next, { [key]: value }); else delete next[key]; update(next); };
  const responsiveValue = (key: "fontSize" | "alignment") => props.viewport === "desktop" ? appearance[key] : responsive?.[key];
  const setResponsive = (key: "fontSize" | "alignment", value: string) => props.viewport === "desktop" ? setGlobal(key, value) : update(setTextResponsiveProperty(appearance, props.viewport, key, value ? value as never : undefined));
  const colors = props.library.colors.filter(({ id }) => props.allowedColorIds.includes(id));
  return <div className="space-y-4" data-rich-text-editor data-editor-mode="appearance">
    <Field label="Font family"><FontPicker value={appearance.fontFamilyId ?? ""} role="body" library={{ ...props.library, fontFamilies: props.library.fontFamilies.filter(({ id }) => props.allowedFontIds.includes(id)) }} onChange={(value) => setGlobal("fontFamilyId", value || undefined)} /></Field>
    <Field label={`Base font size · ${props.viewport}`}><IconChoices label={`Base font size · ${props.viewport}`} value={responsiveValue("fontSize") ?? ""} options={[{ value: "", label: props.viewport === "desktop" ? "Inherited" : "Use desktop size", icon: <RotateCcw size={15} /> }, ...TEXT_SIZES.map((value, index) => ({ value, label: labels([value])[0].label, icon: <span className="leading-none" style={{ fontSize: `${11 + index * 2}px` }}>A</span> }))]} onChange={(value) => setResponsive("fontSize", value)} /></Field>
      <Field label="Line height"><IconChoices label="Line height" value={appearance.lineHeight ?? ""} options={[{ value: "", label: "Inherited", icon: <RotateCcw size={15} /> }, ...TEXT_LINE_HEIGHTS.map((value) => ({ value, label: labels([value])[0].label, icon: <LineHeightIcon value={value} /> }))]} onChange={(value) => setGlobal("lineHeight", value)} /></Field>
      <Field label="Letter spacing"><IconChoices label="Letter spacing" value={appearance.letterSpacing ?? ""} options={[{ value: "", label: "Inherited", icon: <RotateCcw size={15} /> }, ...TEXT_LETTER_SPACINGS.map((value) => ({ value, label: labels([value])[0].label, icon: <span className="text-xs font-medium leading-none" style={{ letterSpacing: value === "tight" ? "-0.12em" : value === "wide" ? "0.22em" : "0" }}>AV</span> }))]} onChange={(value) => setGlobal("letterSpacing", value)} /></Field>
    <Field label={`Alignment · ${props.viewport}`}><IconChoices label={`Alignment · ${props.viewport}`} value={responsiveValue("alignment") ?? ""} options={[{ value: "", label: props.viewport === "desktop" ? "Inherited" : "Use desktop alignment", icon: <RotateCcw size={15} /> }, ...TEXT_ALIGNMENTS.map((value) => ({ value, label: labels([value])[0].label, icon: value === "start" ? <AlignLeft size={17} /> : value === "center" ? <AlignCenter size={17} /> : <AlignRight size={17} /> }))]} onChange={(value) => setResponsive("alignment", value)} /></Field>
    <Field label="Color"><WebsiteColorSwatchControl label="Rich Text color" colorId={appearance.colorId} allowedTemplateColorIds={colors.map(({ id }) => id)} templateColors={colors} projectColors={props.projectColors} inheritLabel="Default" onChange={(value) => setGlobal("colorId", value)} onAddColor={props.onAddColor} /></Field>
    <Field label="Case"><IconChoices label="Text case" value={appearance.textTransform ?? "none"} options={[{ value: "none", label: "Original case", icon: <span className="text-sm leading-none">Aa</span> }, { value: "uppercase", label: "Uppercase", icon: <span className="text-sm leading-none">AA</span> }, { value: "lowercase", label: "Lowercase", icon: <span className="text-sm leading-none">aa</span> }, { value: "capitalize", label: "Capitalize", icon: <span className="text-sm leading-none">Ab</span> }]} onChange={(value) => setGlobal("textTransform", value === "none" ? undefined : value)} /></Field>
    {props.viewport === "mobile" && <>
      <Field label="Formatting"><div className="flex flex-wrap gap-2"><MobileTool elementId={props.element.id} command="bold" label="Bold"><Bold size={16} /></MobileTool><MobileTool elementId={props.element.id} command="italic" label="Italic"><Italic size={16} /></MobileTool><MobileTool elementId={props.element.id} command="underline" label="Underline"><Underline size={16} /></MobileTool><MobileTool elementId={props.element.id} command="strikeThrough" label="Strikethrough"><Strikethrough size={16} /></MobileTool><MobileTool elementId={props.element.id} command="createLink" label="Link"><Link size={16} /></MobileTool><MobileTool elementId={props.element.id} command="insertUnorderedList" label="Bulleted list"><List size={16} /></MobileTool><MobileTool elementId={props.element.id} command="insertOrderedList" label="Numbered list"><ListOrdered size={16} /></MobileTool></div></Field>
    </>}
    {props.viewport !== "desktop" && <button type="button" className="text-xs text-foreground-muted underline" onClick={() => update(resetTextResponsiveDevice(appearance, props.viewport as "tablet" | "mobile"))}>Reset {props.viewport} overrides</button>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5 text-xs font-medium"><div>{label}</div>{children}</div>; }
function MobileTool({ elementId, command, label, children }: { elementId: string; command: RichTextCommand; label: string; children: React.ReactNode }) { return <button type="button" aria-label={label} title={label} onPointerDown={(event) => { event.preventDefault(); dispatchRichTextCommand(elementId, command); }} className="grid size-10 place-items-center rounded-md border border-border text-foreground-muted outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40">{children}</button>; }
