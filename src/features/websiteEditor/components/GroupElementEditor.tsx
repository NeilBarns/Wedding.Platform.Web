import { RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import {
  GROUP_ALIGNMENTS,
  GROUP_COLUMNS,
  GROUP_DIRECTIONS,
  GROUP_GAPS,
  GROUP_WIDTHS,
  setGroupLayoutProperty,
  type GroupLayout,
} from "../../websiteElements/group";
import type { CompositionGroup } from "../../websiteElements/types";
import type { ResponsiveViewport } from "../types";
import { InspectorSection } from "./InspectorPrimitives";
import {
  InspectorVisualChoiceGroup,
  type InspectorVisualChoiceOption,
} from "./InspectorVisualChoice";

const label = (value: string) =>
  value === "none"
    ? "None"
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
}: {
  group: CompositionGroup;
  viewport: ResponsiveViewport;
  onChange: (group: CompositionGroup) => void;
  onUngroup: () => void;
}) {
  const layout = group.layout ?? {};
  const branch =
    viewport === "desktop" ? layout : (layout.responsive?.[viewport] ?? {});
  const inheritedOption: InspectorVisualChoiceOption<string>[] =
    viewport === "desktop"
      ? []
      : [
          {
            value: "",
            label: "Use larger viewport",
            illustration: <RotateCcw size={18} />,
            ariaLabel: "Use larger viewport setting",
          },
        ];
  const set = <K extends "direction" | "gap" | "alignment" | "columns">(
    key: K,
    value: GroupLayout[K] | undefined,
  ) =>
    onChange({
      ...group,
      layout: setGroupLayoutProperty(layout, viewport, key, value as never),
    });
  const effectiveDirection =
    branch.direction ??
    (viewport === "mobile" ? "vertical" : (layout.direction ?? "vertical"));
  const updatePadding = (
    side: "top" | "right" | "bottom" | "left",
    value: string,
  ) => {
    const current = { ...branch.padding };
    if (value)
      current[side] = value as NonNullable<GroupLayout["padding"]>[typeof side];
    else delete current[side];
    onChange({
      ...group,
      layout: setGroupLayoutProperty(
        layout,
        viewport,
        "padding",
        Object.keys(current).length ? current : undefined,
      ),
    });
  };

  return (
    <div className="space-y-5" data-group-element-editor>
      <InspectorSection title="Size & spacing">
        {viewport === "desktop" && (
          <Field label="Width">
            <Select
              value={layout.width ?? "full"}
              options={options(GROUP_WIDTHS)}
              onChange={(width) =>
                onChange({
                  ...group,
                  layout: { ...layout, width: width as GroupLayout["width"] },
                })
              }
            />
          </Field>
        )}
        <Field label={`Inner spacing · ${viewport}`}>
          <PaddingSideDiagram
            padding={branch.padding}
            viewport={viewport}
            onCycle={(side, value) => updatePadding(side, value)}
          />
        </Field>
      </InspectorSection>
      <InspectorSection title="Layout">
        <CompactField
          label={`Direction · ${viewport}`}
          value={branch.direction ?? ""}
          options={[
            {
              value: "",
              label: viewport === "desktop" ? "Default" : "Use larger viewport",
              content: <RotateCcw size={15} />,
            },
            ...GROUP_DIRECTIONS.map((value) => ({
              value,
              label: label(value),
              content: label(value),
            })),
          ]}
          onChange={(value) =>
            set(
              "direction",
              value ? (value as GroupLayout["direction"]) : undefined,
            )
          }
        />
        <CompactField
          label={`Alignment · ${viewport}`}
          value={branch.alignment ?? ""}
          options={[
            {
              value: "",
              label: viewport === "desktop" ? "Default" : "Use larger viewport",
              content: <RotateCcw size={15} />,
            },
            ...GROUP_ALIGNMENTS.map((value) => ({
              value,
              label: label(value),
              content: label(value),
            })),
          ]}
          onChange={(value) =>
            set(
              "alignment",
              value ? (value as GroupLayout["alignment"]) : undefined,
            )
          }
        />
        <CompactField
          label={`Gap · ${viewport}`}
          value={branch.gap ?? ""}
          options={[
            {
              value: "",
              label: viewport === "desktop" ? "No gap" : "Use larger viewport",
              content: <RotateCcw size={15} />,
            },
            ...GROUP_GAPS.filter((value) => value !== "none").map((value) => ({
              value,
              label: label(value),
              content: value.toUpperCase(),
            })),
          ]}
          onChange={(value) =>
            set("gap", value ? (value as GroupLayout["gap"]) : undefined)
          }
        />
        {effectiveDirection === "horizontal" && (
          <VisualField
            label={`Columns · ${viewport}`}
            value={branch.columns ?? (viewport === "desktop" ? "equal-2" : "")}
            columns={2}
            options={[
              ...inheritedOption,
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
  viewport,
  onCycle,
}: {
  padding: GroupLayout["padding"];
  viewport: ResponsiveViewport;
  onCycle: (side: "top" | "right" | "bottom" | "left", value: string) => void;
}) {
  type Side = "top" | "right" | "bottom" | "left";
  const values = viewport === "desktop" ? [...GROUP_GAPS] : ["", ...GROUP_GAPS];
  const current = (side: Side) =>
    viewport === "desktop"
      ? (padding?.[side] ?? "none")
      : (padding?.[side] ?? "");
  const display = (side: Side) =>
    current(side) ? label(current(side)) : "Inherit";
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
