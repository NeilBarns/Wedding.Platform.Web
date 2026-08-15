import { Check, Palette, Save, Sparkles, Type } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { DesignGroup } from "../../../components/ui/DesignGroup";
import { Heading } from "../../../components/ui/Heading";
import { SelectableCard } from "../../../components/ui/SelectableCard";
import { Text } from "../../../components/ui/Text";
import type { WebsiteDesignOptions, WebsiteDesignSettings } from "../types";

export function DesignPanel({
  settings,
  options,
  dirty,
  saving,
  error,
  eventName,
  onChange,
  onSave,
}: {
  settings: WebsiteDesignSettings;
  options: WebsiteDesignOptions;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  eventName: string;
  onChange: (settings: WebsiteDesignSettings) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0">
      <div className="mb-5 xl:mb-4">
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
                    background: colorSwatch(option.key),
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
            const family =
              option.key === "modern"
                ? "font-sans"
                : option.key === "romantic"
                  ? "[font-family:Palatino,Georgia,serif]"
                  : "font-serif";
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
                <span className={`block h-12 ${artPreview(option.key)}`} />
                <span className="flex items-center justify-between px-2.5 py-2 text-sm! xl:text-xs!">
                  {option.displayName}
                  {selected && <Check size={14} className="text-accent" />}
                </span>
              </SelectableCard>
            );
          })}
        </div>
      </DesignGroup>
      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <Button
          className="rounded-sm! text-lg! xl:px-3 xl:py-1.5 xl:text-sm!"
          size="sm"
          type="button"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}

function artPreview(key: string): string {
  if (key === "botanical")
    return "bg-[radial-gradient(ellipse_at_20%_20%,#8a9b75_0_12%,transparent_13%),radial-gradient(ellipse_at_75%_70%,#b97861_0_15%,transparent_16%)] bg-[#f3ede1]";
  if (key === "woven")
    return "bg-[repeating-linear-gradient(45deg,#e7ddd0_0_4px,#f4eee5_4px_8px)]";
  if (key === "clean") return "bg-[#f8f4ee]";
  if (key === "rule") return "bg-[linear-gradient(90deg,transparent_0_22%,#202020_22%_24%,transparent_24%_100%)] bg-[#f3f1ed]";
  if (key === "frame") return "border-[10px] border-[#dedbd5] bg-[#faf9f7]";
  if (key === "offset") return "bg-[linear-gradient(135deg,#202020_0_42%,#e9e5de_42%_58%,#faf9f7_58%)]";
  return "bg-[radial-gradient(#a7654f_1px,transparent_1px)] bg-[#f4ece1] bg-[size:8px_8px]";
}

function colorSwatch(key: string): string {
  return ({
    terracotta: "#9d5b45", olive: "#70764e", sage: "#748a70", burgundy: "#7d3443", neutral: "#74645a",
    ink: "#171717", stone: "#817b72", blush: "#b17879", plum: "#5f405f", navy: "#263c5a",
  } as Record<string, string>)[key] ?? "#777";
}
