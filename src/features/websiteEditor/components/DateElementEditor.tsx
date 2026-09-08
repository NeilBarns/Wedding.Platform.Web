import { Select } from "../../../components/ui/Select";
import type { ResolvedDesignContext, TemplateDesignLibrary } from "../../websiteCapabilities/types";
import type { ProjectColor } from "../../websiteColors/projectColors";
import { resolveWebsiteColor } from "../../websiteColors/projectColors";
import type { DateElement } from "../../websiteElements/types";
import { InspectorSection } from "./InspectorPrimitives";
import { InspectorVisualChoiceGroup } from "./InspectorVisualChoice";
import { WebsiteColorSwatchControl } from "./WebsiteColorSwatchControl";

export function DateElementEditor({ element, library, allowedColorIds, projectColors, context, onAddColor, onChange }: { element: DateElement; library: TemplateDesignLibrary; allowedColorIds: readonly string[]; projectColors: readonly ProjectColor[]; context?: ResolvedDesignContext | null; onAddColor: (value: string) => Promise<ProjectColor>; onChange: (element: DateElement) => void }) {
  const appearance = element.appearance ?? {};
  const set = (key: keyof NonNullable<DateElement["appearance"]>, value: unknown) => {
    const next = { ...appearance, [key]: value };
    if (value === undefined) delete next[key];
    onChange({ ...element, appearance: Object.keys(next).length ? next : undefined });
  };
  const inheritedColor = resolveWebsiteColor(context?.headingColorId, library, projectColors);
  const authoredColor = resolveWebsiteColor(appearance.colorId, library, projectColors);
  return <div className="space-y-5" data-date-element-editor><InspectorSection title="Date appearance">
    <p className="text-xs text-foreground-muted">Uses the wedding date from Event settings. This block does not store a separate date.</p>
    <Field label="Format"><Select value={appearance.format ?? "long"} options={[{ value: "long", label: "Long" }, { value: "medium", label: "Medium" }, { value: "short", label: "Short" }, { value: "numeric", label: "Numeric" }]} onChange={(value) => set("format", value === "long" ? undefined : value)} /></Field>
    {(appearance.format ?? "long") === "long" && <Field label="Weekday"><InspectorVisualChoiceGroup label="Weekday" layout="stack" showIllustration={false} value={(appearance.showWeekday ?? true) ? "show" : "hide"} options={[{ value: "show", label: "Show", illustration: null }, { value: "hide", label: "Hide", illustration: null }]} onChange={(value) => set("showWeekday", value === "show" ? undefined : false)} /></Field>}
    <Field label="Text style"><Select value={appearance.textStyle ?? "heading"} options={[{ value: "display", label: "Display" }, { value: "heading", label: "Heading" }, { value: "body", label: "Body" }]} onChange={(value) => set("textStyle", value === "heading" ? undefined : value)} /></Field>
    <Field label="Alignment"><InspectorVisualChoiceGroup label="Alignment" layout="stack" showIllustration={false} value={appearance.alignment ?? "inherit"} options={[{ value: "inherit", label: "Default", illustration: null }, { value: "start", label: "Left", illustration: null }, { value: "center", label: "Center", illustration: null }, { value: "end", label: "Right", illustration: null }]} onChange={(value) => set("alignment", value === "inherit" ? undefined : value)} /></Field>
    <Field label="Color"><WebsiteColorSwatchControl key={element.id} previewTarget={`${element.id}:color`} label="Date color" colorId={authoredColor ? appearance.colorId : undefined} allowedTemplateColorIds={allowedColorIds} templateColors={library.colors} projectColors={projectColors} inheritLabel="Default" inheritColor={inheritedColor} showUnresolvedWarning={false} onChange={(value) => set("colorId", value)} onAddColor={onAddColor} />{appearance.colorId && !authoredColor && <p role="status" className="mt-2 text-xs text-foreground-muted">The selected color is unavailable. Default is shown.</p>}</Field>
  </InspectorSection></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-xs font-medium">{label}</div>{children}</div>;
}
