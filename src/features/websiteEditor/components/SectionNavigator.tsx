import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { IconButton } from "../../../components/ui/IconButton";
import { Heading } from "../../../components/ui/Heading";
import { Text } from "../../../components/ui/Text";
import type { WebsiteSection } from "../types";

type Props = {
  sections: WebsiteSection[];
  selectedId: string | null;
  pending: boolean;
  onSelect: (id: string) => void;
  onToggle: (section: WebsiteSection) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

export function SectionNavigator({
  sections,
  selectedId,
  pending,
  onSelect,
  onToggle,
  onMove,
}: Props) {
  return (
    <section
      className="rounded-2xl border border-border bg-surface p-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0"
      aria-label="Website sections"
    >
      <div className="px-2 py-2">
        <Heading level={2} variant="section">Sections</Heading>
        <Text className="mt-0.5" variant="helper">
          Select, reorder, or change visibility.
        </Text>
      </div>
      <div className="mt-1 space-y-1">
        {sections.map((section, index) => (
          <div
            className={`group flex items-center gap-1 rounded-xl border px-1.5 py-1.5 xl:rounded-md ${selectedId === section.id ? "border-accent border-2 bg-surface-muted" : "border-transparent hover:bg-surface-muted"}`}
            key={section.id}
          >
            <button
              className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left xl:rounded-md"
              type="button"
              onClick={() => onSelect(section.id)}
              aria-current={selectedId === section.id ? "true" : undefined}
            >
              <span className="block truncate text-sm font-medium">
                {section.displayName}
              </span>
              <span className="block text-[11px] text-foreground-muted">
                {section.isEnabled ? "Visible" : "Hidden"}
              </span>
            </button>
            <IconButton
              className="hover:bg-background!"
              size="sm"
              type="button"
              disabled={pending || index === 0}
              onClick={() => onMove(index, -1)}
              aria-label={`Move ${section.displayName} up`}
            >
              <ArrowUp size={15} />
            </IconButton>
            <IconButton
              className="hover:bg-background!"
              size="sm"
              type="button"
              disabled={pending || index === sections.length - 1}
              onClick={() => onMove(index, 1)}
              aria-label={`Move ${section.displayName} down`}
            >
              <ArrowDown size={15} />
            </IconButton>
            <IconButton
              className="hover:bg-background! disabled:opacity-50"
              size="sm"
              type="button"
              disabled={pending}
              onClick={() => onToggle(section)}
              aria-label={`${section.isEnabled ? "Disable" : "Enable"} ${section.displayName}`}
              aria-pressed={section.isEnabled}
            >
              {section.isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
            </IconButton>
          </div>
        ))}
      </div>
    </section>
  );
}
