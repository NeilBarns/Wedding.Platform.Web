import type { NarrativeComposition } from "./narrativeComposition";

export type NarrativeTextAlignment = NonNullable<
  NarrativeComposition["textAlignment"]
>;

export function narrativeAlignmentClasses(alignment: NarrativeTextAlignment) {
  if (alignment === "center") {
    return {
      text: "text-center",
      constrainedGroup: "mx-auto",
      divider: "mx-auto",
      action: "mx-auto",
    } as const;
  }
  if (alignment === "end") {
    return {
      text: "text-end",
      constrainedGroup: "ml-auto",
      divider: "ml-auto",
      action: "ml-auto",
    } as const;
  }
  return {
    text: "text-start",
    constrainedGroup: "mr-auto",
    divider: "mr-auto",
    action: "mr-auto",
  } as const;
}

export type NarrativeAlignmentClasses = ReturnType<
  typeof narrativeAlignmentClasses
>;
