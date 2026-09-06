import type { CSSProperties } from "react";

const inlineAlignmentProperty = "--website-element-inline-justify";

export function elementInlineAlignmentOverride(value: CSSProperties["justifyContent"]): CSSProperties {
  return value ? { [inlineAlignmentProperty]: value } as CSSProperties : {};
}

export function resolveElementInlineAlignment(fallback: string) {
  return `var(${inlineAlignmentProperty}, ${fallback})`;
}
