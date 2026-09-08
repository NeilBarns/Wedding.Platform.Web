import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";
import type {
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../../websiteCapabilities/types";
import type { ProjectColor } from "../../websiteColors/projectColors";
import {
  changeTextFontFamily,
  selectTextGlobalAppearanceProperty,
  selectTextResponsiveProperty,
  setTextFontWeight,
  TEXT_ALIGNMENTS,
  TEXT_LETTER_SPACINGS,
  TEXT_LINE_HEIGHTS,
  TEXT_SIZES,
  TEXT_FONT_WEIGHTS,
  textFontCapabilities,
  type TextAppearance,
  type TextFontWeight,
} from "../../websiteElements/text";
import type { RichTextElement } from "../../websiteElements/types";
import type { ResponsiveViewport } from "../types";
import { FontPicker } from "./FontPicker";
import { WebsiteColorSwatchControl } from "./WebsiteColorSwatchControl";
import { IconChoices, LineHeightIcon } from "./TextElementEditor";
import {
  dispatchRichTextCommand,
  type RichTextCommand,
} from "../richTextCommands";

type Props = {
  element: RichTextElement;
  viewport: ResponsiveViewport;
  library: TemplateDesignLibrary;
  allowedFontIds: readonly string[];
  allowedColorIds: readonly string[];
  projectColors: readonly ProjectColor[];
  context?: ResolvedDesignContext | null;
  onAddColor: (value: string) => Promise<ProjectColor>;
  onAppearanceChange: (appearance: RichTextElement["appearance"]) => void;
};
const labels = (values: readonly string[]) =>
  values.map((value) => ({
    value,
    label: value[0].toUpperCase() + value.slice(1),
  }));

export function RichTextElementEditor(props: Props) {
  const appearance = props.element.appearance ?? {};
  const effectiveFontFamilyId = appearance.fontFamilyId ?? props.context?.bodyFontId;
  const fontCapabilities = textFontCapabilities(effectiveFontFamilyId);
  const responsive =
    props.viewport === "desktop"
      ? undefined
      : appearance.responsive?.[props.viewport];
  const update = (next: TextAppearance) => {
    const allowed = {
      fontFamilyId: next.fontFamilyId,
      fontSize: next.fontSize,
      fontWeight: next.fontWeight,
      lineHeight: next.lineHeight,
      letterSpacing: next.letterSpacing,
      alignment: next.alignment,
      colorId: next.colorId,
      responsive: next.responsive,
    };
    const compact = Object.fromEntries(
      Object.entries(allowed).filter(([, value]) => value !== undefined),
    );
    props.onAppearanceChange(Object.keys(compact).length ? compact : undefined);
  };
  const setGlobal = (
    key:
      | "fontFamilyId"
      | "fontSize"
      | "fontWeight"
      | "lineHeight"
      | "letterSpacing"
      | "alignment"
      | "colorId",
    value?: string | number,
  ) => {
    const next = { ...appearance } as TextAppearance;
    if (value) Object.assign(next, { [key]: value });
    else delete next[key];
    update(next);
  };
  const responsiveValue = (key: "fontSize" | "alignment") =>
    props.viewport === "desktop" ? appearance[key] : responsive?.[key];
  const setResponsive = (key: "fontSize" | "alignment", value: string) =>
    props.viewport === "desktop"
      ? setGlobal(key, value)
      : update(
          selectTextResponsiveProperty(
            appearance,
            props.viewport,
            key,
            value as never,
          ),
        );
  const colors = props.library.colors.filter(({ id }) =>
    props.allowedColorIds.includes(id),
  );
  return (
    <div
      className="space-y-4"
      data-rich-text-editor
      data-editor-mode="appearance"
    >
      <Field label="Font family">
        <FontPicker
          value={appearance.fontFamilyId ?? ""}
          role="body"
          library={{
            ...props.library,
            fontFamilies: props.library.fontFamilies.filter(({ id }) =>
              props.allowedFontIds.includes(id),
            ),
          }}
          onChange={(value) =>
            update(
              changeTextFontFamily(
                appearance,
                value || undefined,
                props.context?.bodyFontId,
              ),
            )
          }
        />
      </Field>
      <Field label="Font weight">
        <IconChoices label="Font weight" value={String(appearance.fontWeight ?? 400)} options={TEXT_FONT_WEIGHTS.filter((weight) => fontCapabilities.weights.includes(weight)).map((weight) => ({ value: String(weight), label: weight === 400 ? "Normal" : weight === 600 ? "Semi-bold" : "Bold", icon: <Bold size={15} /> }))} onChange={(value) => update(setTextFontWeight(appearance, effectiveFontFamilyId, Number(value) as TextFontWeight))} />
      </Field>
      <Field label={`Base font size · ${props.viewport}`}>
        <IconChoices
          label={`Base font size · ${props.viewport}`}
          value={responsiveValue("fontSize") ?? "m"}
          options={TEXT_SIZES.map((value, index) => ({
            value,
            label: labels([value])[0].label,
            icon: (
              <span
                className="leading-none"
                style={{ fontSize: `${11 + index * 2}px` }}
              >
                A
              </span>
            ),
          }))}
          onChange={(value) => setResponsive("fontSize", value)}
        />
      </Field>
      <Field label="Line height">
        <IconChoices
          label="Line height"
          value={appearance.lineHeight ?? "normal"}
          options={TEXT_LINE_HEIGHTS.map((value) => ({
            value,
            label: labels([value])[0].label,
            icon: <LineHeightIcon value={value} />,
          }))}
          onChange={(value) => update(selectTextGlobalAppearanceProperty(appearance, "lineHeight", value as TextAppearance["lineHeight"], "normal"))}
        />
      </Field>
      <Field label="Letter spacing">
        <IconChoices
          label="Letter spacing"
          value={appearance.letterSpacing ?? "normal"}
          options={TEXT_LETTER_SPACINGS.map((value) => ({
            value,
            label: labels([value])[0].label,
            icon: (
              <span
                className="text-xs font-medium leading-none"
                style={{
                  letterSpacing:
                    value === "tight"
                      ? "-0.12em"
                      : value === "wide"
                        ? "0.22em"
                        : "0",
                }}
              >
                AV
              </span>
            ),
          }))}
          onChange={(value) => update(selectTextGlobalAppearanceProperty(appearance, "letterSpacing", value as TextAppearance["letterSpacing"], "normal"))}
        />
      </Field>
      <Field label={`Alignment · ${props.viewport}`}>
        <IconChoices
          label={`Alignment · ${props.viewport}`}
          value={responsiveValue("alignment") ?? "start"}
          options={TEXT_ALIGNMENTS.map((value) => ({
            value,
            label: labels([value])[0].label,
            icon:
              value === "start" ? (
                <AlignLeft size={17} />
              ) : value === "center" ? (
                <AlignCenter size={17} />
              ) : (
                <AlignRight size={17} />
              ),
          }))}
          onChange={(value) => setResponsive("alignment", value)}
        />
      </Field>
      <Field label="Color">
        <WebsiteColorSwatchControl key={props.element.id} previewTarget={`${props.element.id}:color`}
          label="Rich Text color"
          colorId={appearance.colorId}
          allowedTemplateColorIds={colors.map(({ id }) => id)}
          templateColors={colors}
          projectColors={props.projectColors}
          inheritLabel="Default"
          onChange={(value) => setGlobal("colorId", value)}
          onAddColor={props.onAddColor}
        />
      </Field>
      {props.viewport === "mobile" && (
        <>
          <Field label="Formatting">
            <div className="flex flex-wrap gap-2">
              <MobileTool
                elementId={props.element.id}
                command="bold"
                label="Bold"
                disabled={!fontCapabilities.weights.includes(700)}
              >
                <Bold size={16} />
              </MobileTool>
              <MobileTool
                elementId={props.element.id}
                command="italic"
                label="Italic"
                disabled={!fontCapabilities.italic}
              >
                <Italic size={16} />
              </MobileTool>
              <MobileTool
                elementId={props.element.id}
                command="underline"
                label="Underline"
              >
                <Underline size={16} />
              </MobileTool>
              <MobileTool
                elementId={props.element.id}
                command="strikeThrough"
                label="Strikethrough"
              >
                <Strikethrough size={16} />
              </MobileTool>
            </div>
          </Field>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 text-xs font-medium">
      <div>{label}</div>
      {children}
    </div>
  );
}
function MobileTool({
  elementId,
  command,
  label,
  disabled,
  children,
}: {
  elementId: string;
  command: RichTextCommand;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        if (!disabled) dispatchRichTextCommand(elementId, command);
      }}
      className="grid size-10 place-items-center rounded-md border border-border text-foreground-muted outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {children}
    </button>
  );
}
