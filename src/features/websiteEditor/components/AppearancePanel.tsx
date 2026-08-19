import { AlignCenter, AlignLeft, AlignRight, Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { Tooltip } from "../../../components/ui/Tooltip";
import type {
  DesignOption,
  WebsiteSectionAppearance,
  WebsiteSectionAppearanceOptions,
} from "../types";

export function AppearancePanel({
  appearance,
  options,
  error,
  onChange,
}: {
  appearance: WebsiteSectionAppearance;
  options: WebsiteSectionAppearanceOptions;
  error: string | null;
  onChange: (appearance: WebsiteSectionAppearance) => void;
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
    <div
      className={
        alignment
          ? "flex flex-wrap items-center gap-2"
          : "grid grid-cols-2 gap-2"
      }
    >
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
        if (alignment && Icon) {
          const label = `Align ${option.key}`;
          return (
            <Tooltip key={option.key} label={label}>
              <IconButton
                className="border border-border border-2 aria-pressed:border-accent aria-pressed:bg-surface-muted aria-pressed:text-foreground xl:size-9!"
                size="md"
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => onSelect(option.key)}
              >
                <Icon size={16} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          );
        }

        return (
          <Button
            className={`min-h-11 gap-1.5 px-3 py-2 font-normal! xl:min-h-9 xl:py-1.5 ${alignment ? "min-w-28" : "px-2"} ${selected ? "border-accent! border-2 bg-surface-muted" : ""}`}
            key={option.key}
            size="sm"
            variant="secondary"
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.key)}
          >
            <span>{option.displayName}</span>
            {selected && !alignment && (
              <Check size={13} className="text-accent" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
