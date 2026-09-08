import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Select } from "../../../components/ui/Select";
import type {
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../../websiteCapabilities/types";
import type { ProjectColor } from "../../websiteColors/projectColors";
import type { TextElement } from "../../websiteElements/types";
import {
  changeTextFontFamily,
  resolveTextResponsiveAppearance,
  selectTextGlobalAppearanceProperty,
  selectTextResponsiveProperty,
  setTextFontWeight,
  textFontCapabilities,
  toggleTextBold,
  toggleTextItalic,
  TEXT_ALIGNMENTS,
  TEXT_LETTER_SPACINGS,
  TEXT_LINE_HEIGHTS,
  TEXT_SIZES,
  type TextAppearance,
  type TextFontWeight,
} from "../../websiteElements/text";
import {
  applyTextStylePreset,
  curatedTextColors,
  friendlyFontWeightOptions,
  resolveTextStyle,
  textStylePreset,
  TEXT_STYLE_IDS,
  withTextAppearance,
  type TextStyleId,
} from "../../websiteElements/textStylePresets";
import type { ResponsiveViewport } from "../types";
import { FontPicker } from "./FontPicker";
import { WebsiteColorSwatchControl } from "./WebsiteColorSwatchControl";

type Props = {
  element: TextElement;
  viewport: ResponsiveViewport;
  templateKey: string;
  library: TemplateDesignLibrary;
  allowedFontIds: readonly string[];
  allowedColorIds: readonly string[];
  projectColors: readonly ProjectColor[];
  context?: ResolvedDesignContext | null;
  onAddColor: (value: string) => Promise<ProjectColor>;
  onChange: (element: TextElement) => void;
};

const options = (values: readonly string[]) =>
  values.map((value) => ({
    value,
    label: value[0].toUpperCase() + value.slice(1),
  }));
const styleLabels: Record<TextStyleId | "custom", string> = {
  heading: "Heading",
  subheading: "Subheading",
  eyebrow: "Eyebrow",
  body: "Body",
  caption: "Caption",
  custom: "Custom",
};

export function TextElementEditor({
  element,
  viewport,
  templateKey,
  library,
  allowedFontIds,
  allowedColorIds,
  projectColors,
  context,
  onAddColor,
  onChange,
}: Props) {
  const appearance = element.appearance ?? {};
  const effectiveResponsive = resolveTextResponsiveAppearance(
    appearance,
    viewport,
    { fontSize: "m", alignment: "start" },
  );
  const effectiveFontId = appearance.fontFamilyId ?? context?.bodyFontId;
  const fontCapabilities = textFontCapabilities(effectiveFontId);
  const updateAppearance = (next: TextAppearance) =>
    onChange(withTextAppearance(element, next));
  const setGlobal = <K extends keyof TextAppearance>(
    key: K,
    value: TextAppearance[K] | undefined,
  ) => {
    const next = { ...appearance };
    if (value === undefined || value === "") delete next[key];
    else Object.assign(next, { [key]: value });
    updateAppearance(next);
  };
  const responsiveValue = <K extends "fontSize" | "alignment">(key: K) =>
    effectiveResponsive[key];
  const setResponsive = (key: "fontSize" | "alignment", value: string) =>
    updateAppearance(
      selectTextResponsiveProperty(
        appearance,
        viewport,
        key,
        value as Parameters<typeof selectTextResponsiveProperty>[3],
      ),
    );
  const toggle = (key: "underline" | "strikethrough") => {
    const base = appearance;
    const next = { ...base };
    if (next[key]) delete next[key];
    else next[key] = true;
    updateAppearance(next);
  };
  const toggleBold = () =>
    updateAppearance(toggleTextBold(appearance, effectiveFontId));
  const toggleItalic = () =>
    updateAppearance(toggleTextItalic(appearance, effectiveFontId));
  const curatedColors = curatedTextColors(
    library,
    allowedColorIds,
    context,
    appearance.colorId,
  );
  const inheritedColorId = context?.bodyColorId;
  const style = resolveTextStyle(
    appearance,
    templateKey,
    library,
    context,
    allowedColorIds,
  );

  return (
    <div
      className="space-y-4"
      data-text-element-editor
      data-text-editor-mode="appearance"
    >
      <Field label="Text Style">
        <Select
          value={style}
          options={[
            ...TEXT_STYLE_IDS.map((value) => ({
              value,
              label: styleLabels[value],
            })),
            { value: "custom", label: "Custom", disabled: true },
          ]}
          onChange={(value) =>
            onChange(
              withTextAppearance(
                element,
                applyTextStylePreset(
                  appearance,
                  textStylePreset(
                    value as TextStyleId,
                    templateKey,
                    library,
                    context,
                    allowedColorIds,
                  ),
                ),
              ),
            )
          }
        />
      </Field>
      <Field label="Font family">
        <FontPicker
          value={appearance.fontFamilyId ?? ""}
          role="body"
          library={{
            ...library,
            fontFamilies: library.fontFamilies.filter(({ id }) =>
              allowedFontIds.includes(id),
            ),
          }}
          onChange={(value) =>
            updateAppearance(
              changeTextFontFamily(
                appearance,
                value || undefined,
                context?.bodyFontId,
              ),
            )
          }
        />
      </Field>
      <Field label="Font weight">
        <Select
          aria-label="Font weight"
          value={String(appearance.fontWeight ?? 400)}
          options={friendlyFontWeightOptions(effectiveFontId)}
          onChange={(value) =>
            updateAppearance(
              setTextFontWeight(
                appearance,
                effectiveFontId,
                Number(value) as TextFontWeight,
              ),
            )
          }
        />
      </Field>
      <Field label={`Font size · ${viewport}`}>
        <IconChoices
          label={`Font size · ${viewport}`}
          value={responsiveValue("fontSize")}
          options={TEXT_SIZES.map((value, index) => ({
            value,
            label: options([value])[0].label,
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
            label: options([value])[0].label,
            icon: <LineHeightIcon value={value} />,
          }))}
          onChange={(value) =>
            updateAppearance(
              selectTextGlobalAppearanceProperty(
                appearance,
                "lineHeight",
                value as TextAppearance["lineHeight"],
                "normal",
              ),
            )
          }
        />
      </Field>
      <Field label="Letter spacing">
        <IconChoices
          label="Letter spacing"
          value={appearance.letterSpacing ?? "normal"}
          options={TEXT_LETTER_SPACINGS.map((value) => ({
            value,
            label: options([value])[0].label,
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
          onChange={(value) =>
            updateAppearance(
              selectTextGlobalAppearanceProperty(
                appearance,
                "letterSpacing",
                value as TextAppearance["letterSpacing"],
                "normal",
              ),
            )
          }
        />
      </Field>
      <Field label={`Alignment · ${viewport}`}>
        <IconChoices
          label={`Alignment · ${viewport}`}
          value={responsiveValue("alignment")}
          options={TEXT_ALIGNMENTS.map((value) => ({
            value,
            label: options([value])[0].label,
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
        <WebsiteColorSwatchControl key={element.id} previewTarget={`${element.id}:color`}
          label="Text color"
          colorId={appearance.colorId ?? inheritedColorId}
          allowedTemplateColorIds={curatedColors.map(({ id }) => id)}
          templateColors={curatedColors}
          projectColors={projectColors}
          showInheritChoice={!inheritedColorId}
          onChange={(value) =>
            updateAppearance(
              selectTextGlobalAppearanceProperty(
                appearance,
                "colorId",
                value,
                inheritedColorId,
              ),
            )
          }
          onAddColor={onAddColor}
        />
      </Field>
      {viewport === "mobile" && (
        <Field label="Formatting">
          <div className="flex flex-wrap gap-2">
            <FormatToggle
              label="Bold"
              pressed={appearance.fontWeight === 700}
              disabled={!fontCapabilities.weights.includes(700)}
              onClick={toggleBold}
            >
              <Bold size={16} />
            </FormatToggle>
            <FormatToggle
              label="Italic"
              pressed={appearance.italic === true}
              disabled={!fontCapabilities.italic}
              onClick={toggleItalic}
            >
              <Italic size={16} />
            </FormatToggle>
            <FormatToggle
              label="Underline"
              pressed={appearance.underline === true}
              onClick={() => toggle("underline")}
            >
              <Underline size={16} />
            </FormatToggle>
            <FormatToggle
              label="Strikethrough"
              pressed={appearance.strikethrough === true}
              onClick={() => toggle("strikethrough")}
            >
              <Strikethrough size={16} />
            </FormatToggle>
          </div>
        </Field>
      )}
      <Field label="Case">
        <IconChoices
          label="Text case"
          value={appearance.textTransform ?? "none"}
          options={[
            {
              value: "none",
              label: "Original case",
              icon: <span className="text-sm leading-none">Aa</span>,
            },
            {
              value: "uppercase",
              label: "Uppercase",
              icon: <span className="text-sm leading-none">AA</span>,
            },
            {
              value: "lowercase",
              label: "Lowercase",
              icon: <span className="text-sm leading-none">aa</span>,
            },
            {
              value: "capitalize",
              label: "Capitalize",
              icon: <span className="text-sm leading-none">Ab</span>,
            },
          ]}
          onChange={(value) =>
            setGlobal(
              "textTransform",
              value === "none"
                ? undefined
                : (value as TextAppearance["textTransform"]),
            )
          }
        />
      </Field>
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
export function IconChoices({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; icon: React.ReactNode }>;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value || "inherit"}
          type="button"
          aria-label={option.label}
          title={option.label}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`grid size-10 place-items-center rounded-md border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${value === option.value ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-foreground-muted hover:bg-surface-muted"}`}
        >
          {option.icon}
          <span className="sr-only">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
export function LineHeightIcon({ value }: { value: string }) {
  const gap = value === "tight" ? 2 : value === "relaxed" ? 6 : 4;
  return (
    <span aria-hidden="true" className="flex w-5 flex-col" style={{ gap }}>
      {[16, 20, 14].map((width, index) => (
        <span key={index} className="block h-px bg-current" style={{ width }} />
      ))}
    </span>
  );
}
function FormatToggle({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-md border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40 ${pressed ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-foreground-muted hover:bg-surface-muted"}`}
    >
      {children}
    </button>
  );
}
