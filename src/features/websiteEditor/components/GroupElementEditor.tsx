import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import {
  GROUP_ALIGNMENTS,
  GROUP_COLUMNS,
  GROUP_DIRECTIONS,
  GROUP_GAPS,
  GROUP_SHADOWS,
  GROUP_WIDTHS,
  resolveGroupLayout,
  selectGroupLayoutProperty,
  selectGroupPaddingSide,
  setGroupBackgroundColor,
  setGroupDecoration,
  setGroupShadow,
  setGroupLayoutProperty,
  type GroupLayout,
} from "../../websiteElements/group";
import type { CompositionGroup } from "../../websiteElements/types";
import type { ResponsiveViewport } from "../types";
import type {
  ElementCapability,
  TemplateDesignLibrary,
} from "../../websiteCapabilities/types";
import type { ProjectColor } from "../../websiteColors/projectColors";
import { InspectorResetAction, InspectorSection } from "./InspectorPrimitives";
import {
  InspectorVisualChoiceGroup,
  type InspectorVisualChoiceOption,
} from "./InspectorVisualChoice";
import { WebsiteColorSwatchControl } from "./WebsiteColorSwatchControl";
import { DecorativeStrengthControl } from "./DecorativeStrengthControl";
import {
  decorativeHelpers,
  decorativeLabel,
} from "./decorativeAppearanceOptions";
import { resolveDecorativeDefaultStrength } from "../../websiteRenderer/templateDecorativeAssets";

const label = (value: string) =>
  value === "none"
    ? "None"
    : value === "stretch"
      ? "Fill"
      : value
          .replace("equal-2", "50 / 50")
          .replace("content-wide", "40 / 60")
          .replace("content-narrow", "60 / 40")
          .replace("equal-3", "Thirds")
          .replace(/^./, (letter) => letter.toUpperCase());
const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: label(value) }));

export function GroupElementEditor({
  group,
  viewport,
  onChange,
  onUngroup,
  templateKey,
  capability,
  library,
  projectColors = [],
  onAddColor,
}: {
  group: CompositionGroup;
  viewport: ResponsiveViewport;
  onChange: (group: CompositionGroup) => void;
  onUngroup: () => void;
  templateKey?: string;
  capability?: NonNullable<ElementCapability["narrativeBlock"]>;
  library?: TemplateDesignLibrary;
  projectColors?: readonly ProjectColor[];
  onAddColor?: (value: string) => Promise<ProjectColor>;
}) {
  const layout = group.layout ?? {};
  const effective = resolveGroupLayout(layout, viewport);
  const set = <
    K extends "width" | "direction" | "gap" | "alignment" | "columns",
  >(
    key: K,
    value: GroupLayout[K] | undefined,
  ) =>
    onChange({
      ...group,
      layout:
        value === undefined
          ? setGroupLayoutProperty(layout, viewport, key, undefined)
          : selectGroupLayoutProperty(layout, viewport, key, value as never),
    });
  const effectiveDirection = effective.direction ?? "vertical";
  const updatePadding = (
    side: "top" | "right" | "bottom" | "left",
    value: string,
  ) => {
    onChange({
      ...group,
      layout: selectGroupPaddingSide(
        layout,
        viewport,
        side,
        value as NonNullable<NonNullable<GroupLayout["padding"]>[typeof side]>,
      ),
    });
  };

  return (
    <div className="space-y-5" data-group-element-editor>
      <InspectorSection title="Size & spacing">
        <Field label={`Width · ${viewport}`}>
          <Select
            value={effective.width ?? "full"}
            options={options(GROUP_WIDTHS)}
            onChange={(width) =>
              set("width", width ? (width as GroupLayout["width"]) : undefined)
            }
          />
        </Field>
        <Field label={`Inner spacing · ${viewport}`}>
          <PaddingSideDiagram
            padding={effective.padding}
            onCycle={(side, value) => updatePadding(side, value)}
          />
        </Field>
      </InspectorSection>
      <InspectorSection title="Layout">
        <CompactField
          label={`Direction · ${viewport}`}
          value={effective.direction ?? "vertical"}
          options={GROUP_DIRECTIONS.map((value) => ({
            value,
            label: label(value),
            content: label(value),
          }))}
          onChange={(value) =>
            set(
              "direction",
              value ? (value as GroupLayout["direction"]) : undefined,
            )
          }
        />
        <CompactField
          label={`Alignment · ${viewport}`}
          value={effective.alignment ?? "stretch"}
          options={GROUP_ALIGNMENTS.map((value) => ({
            value,
            label: label(value),
            content: label(value),
          }))}
          onChange={(value) =>
            set(
              "alignment",
              value ? (value as GroupLayout["alignment"]) : undefined,
            )
          }
        />
        <CompactField
          label={`Gap · ${viewport}`}
          value={effective.gap ?? "none"}
          options={GROUP_GAPS.map((value) => ({
            value,
            label: label(value),
            content: value === "none" ? "None" : value.toUpperCase(),
          }))}
          onChange={(value) =>
            set("gap", value ? (value as GroupLayout["gap"]) : undefined)
          }
        />
        {effectiveDirection === "horizontal" && (
          <VisualField
            label={`Columns · ${viewport}`}
            value={effective.columns ?? "equal-2"}
            columns={2}
            options={[
              ...GROUP_COLUMNS.map((value) => ({
                value,
                label: label(value),
                illustration: <ColumnsDiagram value={value} />,
                ariaLabel: `${label(value)} columns`,
              })),
            ]}
            onChange={(value) =>
              set(
                "columns",
                value ? (value as GroupLayout["columns"]) : undefined,
              )
            }
          />
        )}
      </InspectorSection>
      <InspectorSection title="Appearance">
        <Field label="Shadow">
          <Select
            value={group.appearance?.shadow ?? "none"}
            options={options(GROUP_SHADOWS)}
            onChange={(shadow) =>
              onChange(
                setGroupShadow(
                  group,
                  shadow as NonNullable<
                    CompositionGroup["appearance"]
                  >["shadow"],
                ),
              )
            }
          />
        </Field>
      </InspectorSection>
      {templateKey && capability && library && onAddColor && (
        <InspectorSection title="Background">
          <div>
            <p className="mb-1.5 text-xs font-medium">Background Color</p>
            <WebsiteColorSwatchControl
              label="Group background color"
              inheritLabel="No Background"
              colorId={group.appearance?.backgroundColorId}
              allowedTemplateColorIds={capability.appearance.backgroundColorIds}
              templateColors={library.colors}
              projectColors={projectColors}
              onChange={(colorId) =>
                onChange(setGroupBackgroundColor(group, colorId))
              }
              onAddColor={onAddColor}
            />
          </div>
          {(["texture", "pattern"] as const).map((kind) => {
            const background =
              group.appearance?.decorativeAppearance?.background;
            const value = background?.[kind] ?? "";
            const strengthField =
              kind === "texture" ? "textureStrength" : "patternStrength";
            const strength = background?.[strengthField];
            const decorationOptions =
              capability.appearance.decorativeAppearance[
                kind === "texture" ? "textures" : "patterns"
              ];
            return (
              <div key={kind} className="space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">
                      {decorativeLabel(kind)}
                    </p>
                    {background?.[kind] !== undefined && (
                      <InspectorResetAction
                        onClick={() =>
                          onChange(setGroupDecoration(group, kind))
                        }
                      />
                    )}
                  </div>
                  <InspectorVisualChoiceGroup
                    label={`Group ${kind}`}
                    layout="stack"
                    showIllustration={false}
                    value={value}
                    options={decorationOptions.map((option) => ({
                      value: option,
                      label: decorativeLabel(option),
                      helper: decorativeHelpers[kind][option],
                      illustration: null,
                    }))}
                    onChange={(next) =>
                      onChange(setGroupDecoration(group, kind, next))
                    }
                  />
                </div>
                {value && value !== "none" && (
                  <DecorativeStrengthControl
                    label={
                      kind === "texture"
                        ? "Texture Strength"
                        : "Pattern Strength"
                    }
                    value={strength}
                    defaultValue={resolveDecorativeDefaultStrength(
                      templateKey,
                      kind,
                      value,
                    )}
                    onChange={(next) =>
                      onChange(setGroupDecoration(group, strengthField, next))
                    }
                  />
                )}
              </div>
            );
          })}
        </InspectorSection>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onUngroup}>
        Ungroup
      </Button>
    </div>
  );
}

function Field({
  label: fieldLabel,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 text-xs font-medium">
      <div>{fieldLabel}</div>
      {children}
    </div>
  );
}

function VisualField({
  label: fieldLabel,
  value,
  options: fieldOptions,
  onChange,
  columns,
  layout,
}: {
  label: string;
  value: string;
  options: InspectorVisualChoiceOption<string>[];
  onChange: (value: string) => void;
  columns?: 2 | 3;
  layout?: "grid" | "inline";
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium">{fieldLabel}</div>
      <InspectorVisualChoiceGroup
        label={fieldLabel}
        value={value}
        options={fieldOptions}
        onChange={onChange}
        columns={columns}
        layout={layout}
      />
    </div>
  );
}

function CompactField({
  label: fieldLabel,
  value,
  options: fieldOptions,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; content: React.ReactNode }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="text-xs font-medium">
      <div className="mb-1.5">{fieldLabel}</div>
      <div
        role="group"
        aria-label={fieldLabel}
        className="flex flex-wrap gap-2"
      >
        {fieldOptions.map((option) => (
          <button
            key={option.value || "default"}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`grid min-h-10 min-w-10 place-items-center rounded-sm border px-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${value === option.value ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-foreground-muted hover:bg-surface-muted"}`}
          >
            {option.content}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaddingSideDiagram({
  padding,
  onCycle,
}: {
  padding: GroupLayout["padding"];
  onCycle: (side: "top" | "right" | "bottom" | "left", value: string) => void;
}) {
  type Side = "top" | "right" | "bottom" | "left";
  const values = [...GROUP_GAPS];
  const current = (side: Side) => padding?.[side] ?? "none";
  const display = (side: Side) => label(current(side));
  const cycle = (side: Side) => {
    const index = values.indexOf(current(side));
    onCycle(side, values[(index + 1) % values.length]);
  };
  const control = (side: Side, className: string) => (
    <button
      type="button"
      className={`flex items-center justify-center rounded-sm border border-border bg-surface text-[10px] font-semibold uppercase tracking-wide text-foreground-muted outline-none transition-colors hover:border-accent/50 hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
      aria-label={`${label(side)} inner spacing: ${display(side)}. Click to use next value.`}
      title={`${label(side)}: ${display(side)} · Click to cycle`}
      onClick={() => cycle(side)}
    >
      <span>
        <span className="block">{label(side)}</span>
        <span className="block text-[9px] font-normal normal-case tracking-normal opacity-75">
          {display(side)}
        </span>
      </span>
    </button>
  );
  return (
    <div
      className="grid grid-cols-[4.5rem_minmax(7rem,1fr)_4.5rem] grid-rows-[3rem_6rem_3rem] gap-2"
      aria-label="Inner spacing sides"
    >
      {control("top", "col-start-2 row-start-1")}
      {control("left", "col-start-1 row-start-2")}
      <div className="col-start-2 row-start-2 grid place-items-center rounded-sm border-2 border-foreground-muted/45 bg-foreground-muted/10 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
        Group
      </div>
      {control("right", "col-start-3 row-start-2")}
      {control("bottom", "col-start-2 row-start-3")}
    </div>
  );
}

function ColumnsDiagram({ value }: { value: string }) {
  const widths =
    value === "content-wide"
      ? [2, 3]
      : value === "content-narrow"
        ? [3, 2]
        : value === "equal-3"
          ? [1, 1, 1]
          : [1, 1];
  return (
    <span className="flex h-full items-center gap-1">
      {widths.map((width, index) => (
        <span
          key={index}
          className="h-7 rounded-[2px] bg-foreground-muted/40"
          style={{ flex: width }}
        />
      ))}
    </span>
  );
}
