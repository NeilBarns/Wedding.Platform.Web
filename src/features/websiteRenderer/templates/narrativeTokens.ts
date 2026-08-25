import type { NarrativeTemplateTokens } from "../narrativeAppearance";

const shared = {
  lineSpacing: { tight: 1.1, normal: 1.4, relaxed: 1.8 },
  letterSpacing: { tight: "-0.025em", normal: "0", wide: "0.08em" },
} as const;
const size = (
  desktop: "xs" | "s" | "m" | "l" | "xl",
  tablet = desktop,
  mobile = tablet,
) => ({ desktop, tablet, mobile });

export const classicNarrativeTokens: NarrativeTemplateTokens = {
  ...shared,
  fontSize: {
    xs: "0.7rem",
    s: "0.875rem",
    m: "1rem",
    l: "1.875rem",
    xl: "2.5rem",
  },
  defaults: {
    eyebrow: { size: size("xs"), lineSpacing: "normal", letterSpacing: "wide" },
    heading: {
      size: size("l", "l", "m"),
      lineSpacing: "tight",
      letterSpacing: "normal",
    },
    body: { size: size("s"), lineSpacing: "relaxed", letterSpacing: "normal" },
    quote: { size: size("m"), lineSpacing: "normal", letterSpacing: "normal" },
    caption: {
      size: size("xs"),
      lineSpacing: "normal",
      letterSpacing: "normal",
    },
    cta: { size: size("xs"), lineSpacing: "normal", letterSpacing: "wide" },
  },
};

export const modernNarrativeTokens: NarrativeTemplateTokens = {
  ...shared,
  fontSize: { xs: "0.7rem", s: "0.875rem", m: "1rem", l: "2rem", xl: "3rem" },
  defaults: {
    eyebrow: { size: size("xs"), lineSpacing: "normal", letterSpacing: "wide" },
    heading: {
      size: size("xl", "l", "l"),
      lineSpacing: "tight",
      letterSpacing: "tight",
    },
    body: { size: size("m"), lineSpacing: "relaxed", letterSpacing: "normal" },
    quote: {
      size: size("l", "l", "m"),
      lineSpacing: "normal",
      letterSpacing: "tight",
    },
    caption: {
      size: size("xs"),
      lineSpacing: "normal",
      letterSpacing: "normal",
    },
    cta: { size: size("xs"), lineSpacing: "normal", letterSpacing: "wide" },
  },
};
