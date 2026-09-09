import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "../../../components/ui/Select";
import type { TemplateDesignLibrary } from "../../websiteCapabilities/types";
import { DateElementEditor } from "./DateElementEditor";

const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as unknown as TemplateDesignLibrary;
const props = { viewport: "desktop" as const, templateKey: "classic-filipiniana-v1", library, allowedFontIds: [], allowedColorIds: [], projectColors: [], context: null, onAddColor: vi.fn(), onChange: vi.fn() };

describe("DateElementEditor text styles", () => {
  it("offers every shared Text style and a derived Custom state", () => {
    const tree = DateElementEditor({ ...props, element: { id: "date", type: "date", editorName: "Date 1" } });
    const styleSelect = findSelects(tree).find(({ props: selectProps }) => selectProps.options.some(({ value }) => value === "subheading"));
    expect(styleSelect?.props.options.map(({ label }) => label)).toEqual(["Heading", "Subheading", "Eyebrow", "Body", "Caption", "Custom"]);
    expect(styleSelect?.props.value).toBe("heading");
  });
});

function findSelects(node: ReactNode): Array<ReactElement<ComponentProps<typeof Select>>> {
  if (Array.isArray(node)) return node.flatMap(findSelects);
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ children?: ReactNode }>;
  return [...(element.type === Select ? [element as ReactElement<ComponentProps<typeof Select>>] : []), ...Children.toArray(element.props.children).flatMap(findSelects)];
}
