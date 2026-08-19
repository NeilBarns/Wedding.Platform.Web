import { Check, Palette, Sparkles, Type } from "lucide-react";
import { DesignGroup } from "../../../components/ui/DesignGroup";
import { Heading } from "../../../components/ui/Heading";
import { SelectableCard } from "../../../components/ui/SelectableCard";
import { Text } from "../../../components/ui/Text";
import type { WebsiteDesignOptions, WebsiteDesignSettings } from "../types";
import { designPreviewFor } from "../../websiteTemplates/designPreviews";
import { BuilderSaveBar } from "./BuilderSaveBar";

export function DesignPanel({
  settings,
  options,
  dirty,
  saving,
  error,
  eventName,
  templateKey,
  onChange,
  onSave,
}: {
  settings: WebsiteDesignSettings;
  options: WebsiteDesignOptions;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  eventName: string;
  templateKey: string;
  onChange: (settings: WebsiteDesignSettings) => void;
  onSave: () => void;
}) {
  const preview = designPreviewFor(templateKey);
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-6 sm:px-2 xl:px-0 xl:pb-6">
        <div className="hidden xl:mb-4 xl:block">
          <Heading className="xl:text-base!" level={2} variant="panel">Design</Heading>
          <Text className="mt-1 xl:text-xs" variant="muted">
            Customize this Template with curated visual choices.
          </Text>
        </div>
      {error && (
        <Text
          className="mb-4 rounded-xl bg-danger-muted p-3"
          variant="error"
          role="alert"
        >
          {error}
        </Text>
      )}
      <DesignGroup icon={<Palette size={16} />} title="Color">
        <div className="grid grid-cols-2 gap-2">
          {options.colorThemes.map((option) => {
            const selected = settings.colorTheme === option.key;
            return (
              <SelectableCard
                className="flex items-center gap-2 p-2.5 text-sm! data-[selected=true]:bg-surface-muted xl:p-2 xl:text-xs!"
                key={option.key}
                selected={selected}
                onClick={() =>
                  onChange({
                    ...settings,
                    colorTheme:
                      option.key as WebsiteDesignSettings["colorTheme"],
                  })
                }
              >
                <span
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{
                    background: preview?.colorSwatches[option.key] ?? "#777",
                  }}
                />{" "}
                <span className="flex-1">{option.displayName}</span>
                {selected && <Check size={14} className="text-accent" />}
              </SelectableCard>
            );
          })}
        </div>
      </DesignGroup>
      <DesignGroup icon={<Type size={16} />} title="Font">
        <div className="space-y-2">
          {options.fontSets.map((option) => {
            const selected = settings.fontSet === option.key;
            const family = preview?.fontClasses[option.key] ?? "font-sans";
            return (
              <SelectableCard
                className="w-full p-3 data-[selected=true]:bg-surface-muted xl:p-2.5"
                key={option.key}
                selected={selected}
                onClick={() =>
                  onChange({
                    ...settings,
                    fontSet: option.key as WebsiteDesignSettings["fontSet"],
                  })
                }
              >
                <span className="flex items-center justify-between text-sm! xl:text-xs! font-medium">
                  <span>{option.displayName}</span>
                  {selected && <Check size={14} className="text-accent" />}
                </span>
                <span className={`mt-1 block truncate text-lg ${family}`}>
                  {eventName}
                </span>
              </SelectableCard>
            );
          })}
        </div>
      </DesignGroup>
      <DesignGroup icon={<Sparkles size={16} />} title="Art">
        <div className="grid grid-cols-2 gap-2">
          {options.artStyles.map((option) => {
            const selected = settings.artStyle === option.key;
            return (
              <SelectableCard
                className="overflow-hidden"
                key={option.key}
                selected={selected}
                onClick={() =>
                  onChange({
                    ...settings,
                    artStyle: option.key as WebsiteDesignSettings["artStyle"],
                  })
                }
              >
                <span className={`block h-12 ${preview?.artClasses[option.key] ?? "bg-surface-muted"}`} />
                <span className="flex items-center justify-between px-2.5 py-2 text-sm! xl:text-xs!">
                  {option.displayName}
                  {selected && <Check size={14} className="text-accent" />}
                </span>
              </SelectableCard>
            );
          })}
        </div>
      </DesignGroup>
      </div>
      <BuilderSaveBar dirty={dirty} saving={saving} onSave={onSave} />
    </section>
  );
}
