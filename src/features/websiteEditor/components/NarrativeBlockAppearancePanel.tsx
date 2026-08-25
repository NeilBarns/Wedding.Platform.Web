import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import type {
  ElementCapability,
  TemplateDesignLibrary,
} from "../../websiteCapabilities/types";
import type { ResponsiveViewport, StoryBlock } from "../types";

type SlotKey = "eyebrow" | "heading" | "body" | "quote" | "caption" | "cta";
type Appearance = NonNullable<StoryBlock["slots"]["heading"]["appearance"]>;
const groups: Array<{ key: SlotKey; label: string; role: "heading" | "body" }> =
  [
    { key: "eyebrow", label: "Eyebrow", role: "body" },
    { key: "heading", label: "Heading", role: "heading" },
    { key: "body", label: "Body", role: "body" },
    { key: "quote", label: "Quote", role: "body" },
    { key: "caption", label: "Caption", role: "body" },
    { key: "cta", label: "CTA", role: "body" },
  ];

export function NarrativeBlockAppearancePanel({
  block,
  viewport,
  capability,
  library,
  onChange,
}: {
  block: StoryBlock;
  viewport: ResponsiveViewport;
  capability: ElementCapability;
  library: TemplateDesignLibrary;
  onChange: (block: StoryBlock) => void;
}) {
  const contract = capability.narrativeBlock;
  if (!contract)
    return (
      <p className="text-sm text-foreground-muted">
        This Template does not advertise Narrative Block appearance controls.
      </p>
    );

  const update = (key: SlotKey, appearance: Appearance | undefined) => {
    const slot = block.slots[key];
    const nextSlot = {
      ...slot,
      ...(appearance && Object.keys(appearance).length ? { appearance } : {}),
    };
    if (!appearance || Object.keys(appearance).length === 0)
      delete nextSlot.appearance;
    onChange({ ...block, slots: { ...block.slots, [key]: nextSlot } });
  };
  const fontOptions = (role: "heading" | "body") => {
    const allowed =
      capability.appearance?.typography.find((control) => control.role === role)
        ?.allowedFontIds ?? [];
    return [
      { value: "", label: "Inherited" },
      ...allowed.map((id) => ({
        value: id,
        label:
          library.fontFamilies.find((font) => font.id === id)?.displayName ??
          id,
      })),
    ];
  };
  const colorOptions = (role: "heading" | "body") => {
    const capabilityRole = role === "heading" ? "headingColor" : "textColor";
    const allowed =
      capability.appearance?.colors.find(
        (control) => control.role === capabilityRole,
      )?.allowedColorIds ?? [];
    return [
      { value: "", label: "Inherited" },
      ...allowed.map((id) => ({
        value: id,
        label:
          library.colors.find((color) => color.id === id)?.displayName ?? id,
      })),
    ];
  };

  return (
    <div className="space-y-5">
      {groups.map(({ key, label, role }) => {
        const slot = block.slots[key];
        const appearance = slot.appearance ?? {};
        const set = <K extends keyof Appearance>(
          property: K,
          value: Appearance[K] | undefined,
        ) => {
          const next = { ...appearance };
          if (value === undefined || value === "") delete next[property];
          else next[property] = value;
          update(key, next);
        };
        const sizes = contract.appearance.fontSizeOptions.map((value) => ({
          value,
          label: value.toUpperCase(),
        }));
        return (
          <fieldset className="space-y-3 border-b border-border pb-5" key={key}>
            <div className="flex items-center justify-between gap-3">
              <legend className="text-sm font-semibold">
                {label}
                {slot.isHidden && (
                  <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                    Hidden
                  </span>
                )}
              </legend>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={!slot.appearance}
                onClick={() => update(key, undefined)}
              >
                Reset all
              </Button>
            </div>
            <Control
              label="Font"
              value={appearance.fontFamilyId ?? ""}
              options={fontOptions(role)}
              onChange={(value) => set("fontFamilyId", value || undefined)}
              onReset={() => set("fontFamilyId", undefined)}
              resetDisabled={!appearance.fontFamilyId}
            />
            <Control
              label={`Size · ${viewport}`}
              value={appearance.fontSize?.[viewport] ?? ""}
              options={[{ value: "", label: "Template default" }, ...sizes]}
              onChange={(value) => {
                const fontSize = { ...appearance.fontSize };
                if (value)
                  fontSize[viewport] =
                    value as (typeof fontSize)[typeof viewport];
                else delete fontSize[viewport];
                set(
                  "fontSize",
                  Object.keys(fontSize).length ? fontSize : undefined,
                );
              }}
              onReset={() => {
                const fontSize = { ...appearance.fontSize };
                delete fontSize[viewport];
                set(
                  "fontSize",
                  Object.keys(fontSize).length ? fontSize : undefined,
                );
              }}
              resetDisabled={!appearance.fontSize?.[viewport]}
            />
            <Control
              label="Line spacing"
              value={appearance.lineSpacing ?? ""}
              options={[
                { value: "", label: "Template default" },
                ...["tight", "normal", "relaxed"].map((value) => ({
                  value,
                  label: title(value),
                })),
              ]}
              onChange={(value) =>
                set(
                  "lineSpacing",
                  value ? (value as Appearance["lineSpacing"]) : undefined,
                )
              }
              onReset={() => set("lineSpacing", undefined)}
              resetDisabled={!appearance.lineSpacing}
            />
            <Control
              label="Letter spacing"
              value={appearance.letterSpacing ?? ""}
              options={[
                { value: "", label: "Template default" },
                ...["tight", "normal", "wide"].map((value) => ({
                  value,
                  label: title(value),
                })),
              ]}
              onChange={(value) =>
                set(
                  "letterSpacing",
                  value ? (value as Appearance["letterSpacing"]) : undefined,
                )
              }
              onReset={() => set("letterSpacing", undefined)}
              resetDisabled={!appearance.letterSpacing}
            />
            <Control
              label="Color"
              value={appearance.colorId ?? ""}
              options={colorOptions(role)}
              onChange={(value) => set("colorId", value || undefined)}
              onReset={() => set("colorId", undefined)}
              resetDisabled={!appearance.colorId}
            />
          </fieldset>
        );
      })}
      <p className="text-xs text-foreground-muted">
        <strong>Divider:</strong> presentation is Template-owned.
      </p>
      <p className="text-xs text-foreground-muted">
        <strong>Media:</strong> framing and layout controls are deferred.
      </p>
    </div>
  );
}

function Control({
  label,
  value,
  options,
  onChange,
  onReset,
  resetDisabled,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  onReset: () => void;
  resetDisabled: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-xs font-medium">{label}</label>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          disabled={resetDisabled}
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
      <Select
        value={value}
        options={options}
        aria-label={label}
        onChange={onChange}
      />
    </div>
  );
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
