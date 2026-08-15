import { AlignCenter, AlignLeft, AlignRight, Check, Save } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type {
  DesignOption,
  WebsiteSectionAppearance,
  WebsiteSectionAppearanceOptions,
} from "../types";

export function AppearancePanel({
  appearance,
  options,
  dirty,
  saving,
  error,
  onChange,
  onSave,
}: {
  appearance: WebsiteSectionAppearance;
  options: WebsiteSectionAppearanceOptions;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  onChange: (appearance: WebsiteSectionAppearance) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      {error && (
        <p
          className="rounded-xl bg-danger-muted p-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Heading alignment
        </legend>
        <OptionGrid
          options={options.headingAlignments}
          value={appearance.headingAlignment}
          onSelect={(headingAlignment) =>
            onChange({
              ...appearance,
              headingAlignment:
                headingAlignment as WebsiteSectionAppearance["headingAlignment"],
            })
          }
          alignment
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Content alignment
        </legend>
        <OptionGrid
          options={options.bodyAlignments}
          value={appearance.bodyAlignment}
          onSelect={(bodyAlignment) =>
            onChange({
              ...appearance,
              bodyAlignment:
                bodyAlignment as WebsiteSectionAppearance["bodyAlignment"],
            })
          }
          alignment
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Background</legend>
        <OptionGrid
          options={options.backgroundTreatments}
          value={appearance.backgroundTreatment}
          onSelect={(backgroundTreatment) =>
            onChange({
              ...appearance,
              backgroundTreatment:
                backgroundTreatment as WebsiteSectionAppearance["backgroundTreatment"],
            })
          }
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Emphasis</legend>
        <OptionGrid
          options={options.emphasisOptions}
          value={appearance.emphasis}
          onSelect={(emphasis) =>
            onChange({
              ...appearance,
              emphasis: emphasis as WebsiteSectionAppearance["emphasis"],
            })
          }
        />
      </fieldset>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-foreground-muted">
          {dirty ? "Unsaved appearance" : "Appearance saved"}
        </span>
        <Button
          className="rounded-sm! text-lg! xl:px-3 xl:py-1.5 xl:text-sm!"
          size="sm"
          type="button"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          <Save size={15} />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
  alignment = false,
}: {
  options: DesignOption[];
  value: string;
  onSelect: (key: string) => void;
  alignment?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => {
        const selected = option.key === value;
        const Icon =
          option.key === "left"
            ? AlignLeft
            : option.key === "right"
              ? AlignRight
              : option.key === "center"
                ? AlignCenter
                : null;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs xl:min-h-9 xl:rounded-md xl:py-1.5 ${selected ? "border-accent bg-surface-muted" : "border-border hover:bg-surface-muted"}`}
            onClick={() => onSelect(option.key)}
          >
            {alignment && Icon && <Icon size={14} />}
            <span>{option.displayName}</span>
            {selected && !alignment && (
              <Check size={13} className="text-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
