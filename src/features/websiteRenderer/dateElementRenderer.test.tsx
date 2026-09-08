import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DateElementRenderer } from "./DateElementRenderer";
import { formatDateOnly } from "./formatDateOnly";

const library = { colors: [{ id: "heading", value: "#123456" }, { id: "accent", value: "#abcdef" }] } as never;
const context = { headingFontId: "", bodyFontId: "", headingColorId: "heading", bodyColorId: "heading", accentColorId: "accent" };

describe("Date block formatting", () => {
  it("preserves the existing default and supports bounded formats", () => {
    expect(formatDateOnly("2026-12-22")).toBe("Tuesday, December 22, 2026");
    expect(formatDateOnly("2026-12-22", { showWeekday: false })).toBe("December 22, 2026");
    expect(formatDateOnly("2026-12-22", { format: "medium" })).toBe("December 22, 2026");
    expect(formatDateOnly("2026-12-22", { format: "short" })).toBe("Dec 22, 2026");
    expect(formatDateOnly("2026-12-22", { format: "numeric" })).toBe("12/22/2026");
  });

  it("applies authored style, alignment, and color", () => {
    const html = renderToStaticMarkup(<DateElementRenderer element={{ id: "date", type: "date", editorName: "Date 1", appearance: { format: "short", alignment: "end", textStyle: "body", colorId: "accent" } }} eventDate="2026-12-22" mode="public" templateKey="classic-filipiniana-v1" library={library} context={context} />);
    expect(html).toContain("Dec 22, 2026");
    expect(html).toContain("text-align:end");
    expect(html).toContain("font-size:1rem");
    expect(html).toContain("color:#abcdef");
  });
});
