import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { addGroupChild, createGroupElement, findSectionElement, ungroupSectionElement, updateGroupChildren, updateSectionTextElement, type SectionChildFlow } from "../websiteEditor/sectionChildFlow";
import { GroupElementRenderer } from "../websiteRenderer/GroupElementRenderer";
import { WebsiteElementFrame } from "../websiteRenderer/WebsiteElementFrame";
import { resolveGroupLayout, selectGroupLayoutProperty, selectGroupPaddingSide, setGroupLayoutProperty } from "./group";
import { compositionGroupSchema } from "./schemas";
import type { CompositionGroup } from "./types";

const library = { colors: [], fontFamilies: [], fontRecommendations: { heading: [], body: [], accent: [] }, palettePresets: [], typographyPresets: [] } as never;
const childJustification = { start: "flex-start", center: "center", end: "flex-end" } as const;
const group: CompositionGroup = { id: "group", type: "compositionGroup", children: [{ id: "a", type: "text", text: "First" }, { id: "b", type: "text", text: "Second" }], layout: { width: "narrow", direction: "horizontal", gap: "l", padding: { top: "s" }, alignment: "center", columns: "content-wide", responsive: { mobile: { direction: "vertical", gap: "s" } } } };

describe("Group", () => {
  it("validates the focused layout contract and rejects the retired placeholder", () => {
    expect(compositionGroupSchema.safeParse(group).success).toBe(true);
    expect(compositionGroupSchema.safeParse({ id: "old", type: "compositionGroup", composition: "flow", children: [] }).success).toBe(false);
    expect(compositionGroupSchema.safeParse({ id: "unsupported", type: "compositionGroup", children: [{ id: "heading", type: "heading", text: "No" }] }).success).toBe(false);
  });

  it("validates Group background appearance", () => {
    expect(compositionGroupSchema.safeParse({ ...group, appearance: { backgroundColorId: "sage-accent", shadow: "medium", decorativeAppearance: { background: { texture: "paper", textureStrength: 40, pattern: "botanical", patternStrength: 60 } } } }).success).toBe(true);
    expect(compositionGroupSchema.safeParse({ ...group, appearance: { decorativeAppearance: { background: { texture: "invalid" } } } }).success).toBe(false);
  });

  it("renders the same shadow scale used by Media blocks", () => {
    const shadowed: CompositionGroup = { ...group, appearance: { shadow: "strong" } };
    const html = renderToStaticMarkup(<GroupElementRenderer group={shadowed} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);

    expect(html).toContain("box-shadow:0 18px 45px rgb(0 0 0 / .24)");
  });

  it("renders responsive composition without decoration or external margin", () => {
    const desktop = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    const mobile = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(desktop).toContain("grid-template-columns:minmax(0,2fr) minmax(0,3fr)");
    expect(desktop).toContain("gap:1.5rem");
    expect(desktop).toContain("max-width:32rem");
    expect(mobile).toContain("flex-direction:column");
    expect(mobile).toContain("gap:0.5rem");
    expect(desktop).not.toMatch(/background|border-radius|box-shadow/);
  });

  it("resolves each viewport from base plus only its own sparse override", () => {
    const layout = { width: "wide", direction: "horizontal", gap: "l", padding: { top: "xl" }, alignment: "center", columns: "content-wide", responsive: { tablet: { width: "medium", gap: "m", alignment: "end", columns: "equal-3" }, mobile: { width: "full", direction: "vertical", gap: "s", padding: { top: "xs" } } } } as const;
    expect(resolveGroupLayout(layout, "desktop")).toMatchObject({ width: "wide", direction: "horizontal", gap: "l", alignment: "center", columns: "content-wide" });
    expect(resolveGroupLayout(layout, "tablet")).toMatchObject({ width: "medium", direction: "horizontal", gap: "m", alignment: "end", columns: "equal-3" });
    expect(resolveGroupLayout(layout, "mobile")).toMatchObject({ width: "full", direction: "vertical", gap: "s", alignment: "center", columns: "content-wide", padding: { top: "xs" } });
  });

  it("does not force or inherit a Tablet direction on Mobile", () => {
    const layout = { direction: "horizontal", responsive: { tablet: { direction: "vertical", gap: "xl" }, mobile: { gap: "xs" } } } as const;
    expect(resolveGroupLayout(layout, "tablet")).toMatchObject({ direction: "vertical", gap: "xl" });
    expect(resolveGroupLayout(layout, "mobile")).toMatchObject({ direction: "horizontal", gap: "xs" });
  });

  it("stores sparse overrides and reset reveals base", () => {
    const base = { direction: "horizontal", gap: "l" } as const;
    const overridden = setGroupLayoutProperty(base, "mobile", "direction", "vertical");
    expect(overridden.responsive?.mobile).toEqual({ direction: "vertical" });
    const reset = setGroupLayoutProperty(overridden, "mobile", "direction", undefined);
    expect(reset).toEqual(base);
    expect(resolveGroupLayout(reset, "mobile").direction).toBe("horizontal");
  });

  it.each(["desktop", "tablet", "mobile"] as const)("persists explicit %s gap none distinctly from reset", (viewport) => {
    const base = { gap: "l" } as const;
    const explicitNone = setGroupLayoutProperty(base, viewport, "gap", "none");
    if (viewport === "desktop") expect(explicitNone.gap).toBe("none");
    else expect(explicitNone.responsive?.[viewport]?.gap).toBe("none");
    expect(resolveGroupLayout(explicitNone, viewport).gap).toBe("none");

    const reset = setGroupLayoutProperty(explicitNone, viewport, "gap", undefined);
    expect(resolveGroupLayout(reset, viewport).gap).toBe(viewport === "desktop" ? undefined : "l");
    if (viewport !== "desktop") expect(reset.responsive?.[viewport]).toBeUndefined();
  });

  it("keeps stretch as the persisted alignment and renders fill behavior", () => {
    const stretched: CompositionGroup = { ...group, layout: { direction: "vertical", alignment: "stretch" } };
    expect(compositionGroupSchema.parse(stretched).layout?.alignment).toBe("stretch");
    const html = renderToStaticMarkup(<GroupElementRenderer group={stretched} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).toContain("align-items:stretch");
  });

  it.each(["desktop", "tablet", "mobile"] as const)("keeps Vertical Group children bounded under every alignment on %s", (viewport) => {
    const children: CompositionGroup["children"] = [
      { id: "rich", type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "A long wrapping Rich Text value that must remain inside the Group bounds." }] }] } },
      { id: "media", type: "media", items: [{ id: "video", type: "video", url: "https://example.com/video.mp4" }] },
      { id: "divider", type: "divider", appearance: { width: 50 } },
    ];

    for (const alignment of ["start", "center", "end", "stretch"] as const) {
      const candidate: CompositionGroup = { id: `vertical-${viewport}-${alignment}`, type: "compositionGroup", children, layout: { direction: "vertical", alignment } };
      const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="editor" viewport={viewport} templateKey="modern-editorial-v1" library={library} projectColors={[]} />);

      expect(html).toContain("align-items:stretch");
      expect(html.match(/data-group-child-containment/g)).toHaveLength(children.length);
      expect(html.match(new RegExp(`data-group-child-alignment="${alignment}"`, "g"))).toHaveLength(children.length);
      expect(html.match(/display:flex;justify-content:(flex-start|center|flex-end);width:100%;min-width:0;max-width:100%/g)).toHaveLength(children.length);
      expect(html.match(/data-group-rendered-child/g)).toHaveLength(children.length);
      expect(html).toContain("width:100%;max-width:100%;flex:0 1 auto");
      if (alignment === "stretch") expect(html).not.toContain("--website-element-inline-justify:");
      else expect(html).toContain(`--website-element-inline-justify:${childJustification[alignment]}`);
      expect(html).toContain('data-website-element="richText"');
      expect(html).toContain('data-media-presentation="single"');
      expect(html).toContain('data-website-element="divider"');
      expect(html).toContain("max-width:100%");
      expect(html).toMatch(/width:(50|[0-9.]+)%/);
      expect(html).not.toMatch(/100vw|w-screen|margin-left:-|margin-right:-|overflow-x:hidden/);
    }
  });

  it("does not add Vertical containment rows to Horizontal Group layout", () => {
    const html = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).not.toContain("data-group-child-containment");
    expect(html).toContain("align-items:center");
    expect(html).toContain("grid-template-columns:minmax(0,2fr) minmax(0,3fr)");
  });

  it("positions constrained rendered-child boxes without changing their authored widths", () => {
    const constrained: CompositionGroup = {
      id: "constrained",
      type: "compositionGroup",
      children: [
        { id: "media", type: "media", items: [{ id: "video", type: "video", url: "https://example.com/video.mp4" }], presentation: { width: "small" } },
        { id: "divider", type: "divider", appearance: { width: 50 } },
        { id: "rich", type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: "Bounded copy" }] }] } },
      ],
      layout: { direction: "vertical" },
    };
    const rendered = (["start", "center", "end"] as const).map((alignment) => {
      const html = renderToStaticMarkup(<GroupElementRenderer group={{ ...constrained, layout: { ...constrained.layout, alignment } }} sectionId="date" mode="editor" viewport="desktop" templateKey="classic-filipiniana-v1" library={library} projectColors={[]} />);
      expect(html).toContain(`data-group-child-alignment="${alignment}"`);
      expect(html).toContain(`justify-content:${childJustification[alignment]}`);
      expect(html.match(/width:100%;max-width:100%;flex:0 1 auto/g)).toHaveLength(constrained.children.length);
      expect(html.match(new RegExp(`--website-element-inline-justify:${childJustification[alignment]}`, "g"))).toHaveLength(constrained.children.length);
      expect(html).toContain("max-width:20rem");
      return html;
    });
    const dividerWidth = (html: string) => html.match(/role="separator"[^>]*><span[^>]*style="width:([^;]+);/)?.[1];
    expect(rendered.map(dividerWidth)).toEqual([dividerWidth(rendered[0]), dividerWidth(rendered[0]), dividerWidth(rendered[0])]);
  });

  it.each(["desktop", "tablet", "mobile"] as const)("keeps Divider width values stable for every Vertical alignment on %s", (viewport) => {
    for (const width of [0, 50, 100]) {
      const visualWidths = (["start", "center", "end", "stretch"] as const).map((alignment) => {
        const candidate: CompositionGroup = { id: `divider-${viewport}-${alignment}-${width}`, type: "compositionGroup", children: [{ id: "divider", type: "divider", appearance: { width } }], layout: { direction: "vertical", alignment } };
        const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport={viewport} templateKey="classic-filipiniana-v1" library={library} projectColors={[]} />);
        expect(html).toContain("width:100%;min-width:0;max-width:100%");
        expect(html).not.toMatch(/width:fit-content|overflow:hidden|100vw|w-screen/);
        if (alignment === "stretch") expect(html).not.toContain("--website-element-inline-justify:");
        else expect(html).toContain(`--website-element-inline-justify:${childJustification[alignment]}`);
        return html.match(/role="separator"[^>]*><span[^>]*style="width:([^;]+);/)?.[1];
      });
      expect(visualWidths.every(Boolean)).toBe(true);
      expect(new Set(visualWidths).size).toBe(1);
    }
  });

  it.each(["tablet", "mobile"] as const)("creates and removes sparse %s selections against Desktop", (viewport) => {
    const base = { width: "wide", direction: "horizontal", gap: "l", alignment: "center", columns: "content-wide" } as const;
    const overridden = selectGroupLayoutProperty(base, viewport, "gap", "none");
    expect(overridden.responsive?.[viewport]?.gap).toBe("none");
    const restored = selectGroupLayoutProperty(overridden, viewport, "gap", "l");
    expect(restored.responsive?.[viewport]).toBeUndefined();
    expect(resolveGroupLayout(restored, viewport).gap).toBe("l");
  });

  it("normalizes each responsive padding side independently", () => {
    const base = { padding: { top: "l", right: "m", bottom: "s", left: "xs" } } as const;
    const topOverride = selectGroupPaddingSide(base, "mobile", "top", "none");
    const twoOverrides = selectGroupPaddingSide(topOverride, "mobile", "right", "xl");
    expect(twoOverrides.responsive?.mobile?.padding).toEqual({ top: "none", right: "xl" });
    const resetTop = selectGroupPaddingSide(twoOverrides, "mobile", "top", "l");
    expect(resetTop.responsive?.mobile?.padding).toEqual({ right: "xl" });
    const resetRight = selectGroupPaddingSide(resetTop, "mobile", "right", "m");
    expect(resetRight.responsive?.mobile).toBeUndefined();
  });

  it("persists explicit responsive None when Desktop spacing is non-None", () => {
    const gap = selectGroupLayoutProperty({ gap: "xl" }, "mobile", "gap", "none");
    const padding = selectGroupPaddingSide({ padding: { left: "l" } }, "mobile", "left", "none");
    expect(gap.responsive?.mobile?.gap).toBe("none");
    expect(padding.responsive?.mobile?.padding?.left).toBe("none");
  });

  it("compares Mobile selections directly with Desktop rather than Tablet", () => {
    const layout = { gap: "m", responsive: { tablet: { gap: "xl" } } } as const;
    expect(selectGroupLayoutProperty(layout, "mobile", "gap", "m").responsive).toEqual({ tablet: { gap: "xl" } });
    expect(selectGroupLayoutProperty(layout, "mobile", "gap", "xl").responsive?.mobile).toEqual({ gap: "xl" });
  });

  it("renders all semantic widths responsively and keeps padding internal", () => {
    for (const [width, maxWidth] of [["full", "100%"], ["wide", "72rem"], ["medium", "48rem"], ["narrow", "32rem"]] as const) {
      const candidate: CompositionGroup = {
        ...group,
        layout: {
          ...group.layout,
          width,
          padding: { top: "xl", right: "l", bottom: "m", left: "s" },
          responsive: { mobile: { width: "full", padding: { top: "xs", right: "none", bottom: "s", left: "none" } } },
        },
      };
      const desktop = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
      const mobile = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
      expect(desktop).toContain(`max-width:${maxWidth}`);
      expect(desktop).toContain("padding-top:2rem");
      expect(mobile).toContain("max-width:100%");
      expect(mobile).toContain("padding-top:0.25rem");
      expect(mobile).not.toMatch(/margin-top|margin-right|margin-bottom|margin-left/);
    }
  });

  it("uses safe tracks, shrinkable children, and authored DOM order", () => {
    const html = renderToStaticMarkup(<GroupElementRenderer group={{ ...group, children: [...group.children, { id: "c", type: "text", text: "Third" }], layout: { direction: "horizontal", columns: "equal-3", gap: "none" } }} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).toContain("grid-template-columns:repeat(6,minmax(0,1fr))");
    expect(html).toContain('class="min-w-0 max-w-full [overflow-wrap:anywhere]"');
    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
    expect(html.indexOf("Second")).toBeLessThan(html.indexOf("Third"));
    expect(html).not.toMatch(/100vw|w-screen|margin-left:-|margin-right:-|position:absolute/);
  });

  it("keeps nested geometry independent and relative to its parent", () => {
    const nested: CompositionGroup = { id: "outer", type: "compositionGroup", children: [{ id: "inner", type: "compositionGroup", children: [{ id: "copy", type: "text", text: "Nested" }], layout: { width: "narrow", gap: "s", padding: { left: "m" }, responsive: { mobile: { width: "full", gap: "none", padding: { left: "none" } } } } }], layout: { width: "medium", gap: "l", padding: { right: "xl" } } };
    const html = renderToStaticMarkup(<GroupElementRenderer group={nested} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).toContain("max-width:48rem");
    expect(html).toContain("padding-right:2rem");
    expect(html).toContain("max-width:100%");
    expect(html).toContain("padding-left:0");
    expect(html).toContain("box-sizing:border-box;min-width:0;width:100%");
  });

  it("contains long unbroken Rich Text beside Media in a nested 50 / 50 Group", () => {
    const token = "WeddingPlatform".repeat(80);
    const nested: CompositionGroup = {
      id: "outer",
      type: "compositionGroup",
      children: [{
        id: "inner",
        type: "compositionGroup",
        layout: { direction: "horizontal", columns: "equal-2" },
        children: [
          { id: "rich", type: "richText", document: { type: "doc", children: [{ type: "paragraph", children: [{ text: token }] }] } },
          { id: "media", type: "media", items: [] },
        ],
      }],
    };

    const html = renderToStaticMarkup(<GroupElementRenderer group={nested} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).toContain("grid-template-columns:repeat(2,minmax(0,1fr))");
    expect(html.match(/class="min-w-0 max-w-full \[overflow-wrap:anywhere\]"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain(token);
    expect(html.indexOf(token)).toBeLessThan(html.indexOf('data-section-child-element="media"'));
    expect(html).not.toContain("overflow-hidden");
  });

  it.each(["equal-2", "content-wide", "content-narrow"] as const)("spans the orphan child across both %s columns for 1, 3, and 5 children", (columns) => {
    for (const count of [1, 3, 5]) {
      const children = Array.from({ length: count }, (_, index) => ({ id: `child-${index + 1}`, type: "text" as const, text: `Authored ${index + 1}` }));
      const candidate: CompositionGroup = { id: `group-${columns}-${count}`, type: "compositionGroup", children, layout: { direction: "horizontal", columns } };
      const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);

      expect(html.match(/grid-column:1 \/ -1/g)).toHaveLength(1);
      expect(html.lastIndexOf("grid-column:1 / -1")).toBeLessThan(html.indexOf(`Authored ${count}`));
      for (let index = 1; index < count; index += 1) expect(html.indexOf(`Authored ${index}`)).toBeLessThan(html.indexOf(`Authored ${index + 1}`));
      expect(html).toContain("min-w-0 max-w-full [overflow-wrap:anywhere]");
      expect(html).not.toMatch(/overflow-hidden|100vw|w-screen/);
    }
  });

  it("leaves even two-column rows unchanged", () => {
    const children = [1, 2, 3].map((index) => ({ id: `third-${index}`, type: "text" as const, text: `Third ${index}` }));
    const even = renderToStaticMarkup(<GroupElementRenderer group={{ id: "even", type: "compositionGroup", children: children.slice(0, 2), layout: { direction: "horizontal", columns: "equal-2" } }} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(even).not.toContain("grid-column");
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])("balances %i authored children in Thirds", (count) => {
    const children = Array.from({ length: count }, (_, index) => ({ id: `third-${index + 1}`, type: "text" as const, text: `Authored third ${index + 1}` }));
    const html = renderToStaticMarkup(<GroupElementRenderer group={{ id: `thirds-${count}`, type: "compositionGroup", children, layout: { direction: "horizontal", columns: "equal-3" } }} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);

    expect(html).toContain("grid-template-columns:repeat(6,minmax(0,1fr))");
    if (count % 3 === 0) {
      expect(html.match(/grid-column:span 2/g)).toHaveLength(count);
      expect(html).not.toContain("grid-column:1 / -1");
      expect(html).not.toContain("grid-column:span 3");
    } else if (count % 3 === 1) {
      expect(html.match(/grid-column:span 2/g) ?? []).toHaveLength(count - 1);
      expect(html.match(/grid-column:1 \/ -1/g)).toHaveLength(1);
    } else {
      expect(html.match(/grid-column:span 2/g) ?? []).toHaveLength(count - 2);
      expect(html.match(/grid-column:span 3/g)).toHaveLength(2);
    }
    for (let index = 1; index < count; index += 1) expect(html.indexOf(`Authored third ${index}`)).toBeLessThan(html.indexOf(`Authored third ${index + 1}`));
    expect(html).toContain("min-w-0 max-w-full [overflow-wrap:anywhere]");
    expect(html).not.toMatch(/overflow-hidden|100vw|w-screen/);
  });

  it("balances Thirds from the resolved viewport override without affecting two-column behavior", () => {
    const children = [1, 2, 3, 4, 5].map((index) => ({ id: `responsive-third-${index}`, type: "text" as const, text: `Responsive ${index}` }));
    const candidate: CompositionGroup = { id: "responsive-thirds", type: "compositionGroup", children, layout: { direction: "horizontal", columns: "equal-2", responsive: { tablet: { columns: "equal-3" }, mobile: { direction: "vertical", columns: "equal-3" } } } };
    const render = (viewport: "desktop" | "tablet" | "mobile") => renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport={viewport} templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    const desktop = render("desktop");
    const tablet = render("tablet");
    const mobile = render("mobile");
    expect(desktop).toContain("grid-template-columns:repeat(2,minmax(0,1fr))");
    expect(desktop.match(/grid-column:1 \/ -1/g)).toHaveLength(1);
    expect(tablet).toContain("grid-template-columns:repeat(6,minmax(0,1fr))");
    expect(tablet.match(/grid-column:span 3/g)).toHaveLength(2);
    expect(mobile).not.toContain("grid-template-columns");
    expect(mobile).not.toContain("grid-column");
  });

  it("derives orphan spanning from the active responsive layout", () => {
    const candidate: CompositionGroup = { id: "responsive-orphan", type: "compositionGroup", children: [{ id: "only", type: "text", text: "Only" }], layout: { direction: "vertical", columns: "equal-3", responsive: { tablet: { direction: "horizontal", columns: "content-wide" }, mobile: { direction: "horizontal", columns: "equal-3" } } } };
    const render = (viewport: "desktop" | "tablet" | "mobile") => renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport={viewport} templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(render("desktop")).not.toContain("grid-column");
    expect(render("tablet")).toContain("grid-column:1 / -1");
    expect(render("mobile")).toContain("grid-column:1 / -1");
  });

  it("removes hidden children from Vertical layout without placeholder geometry", () => {
    const candidate: CompositionGroup = { id: "vertical-hidden", type: "compositionGroup", children: [{ id: "first", type: "text", text: "Visible first" }, { id: "hidden", type: "text", text: "Hidden middle", isHidden: true }, { id: "last", type: "text", text: "Visible last" }], layout: { direction: "vertical", gap: "xl" } };
    const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).toContain("Visible first");
    expect(html).toContain("Visible last");
    expect(html).not.toContain("Hidden middle");
    expect(html.match(/data-group-child-containment/g)).toHaveLength(2);
  });

  it("balances two-column orphans from visible children only", () => {
    for (const columns of ["equal-2", "content-wide", "content-narrow"] as const) {
      const candidate: CompositionGroup = { id: `hidden-${columns}`, type: "compositionGroup", children: [1, 2, 3, 4].map((index) => ({ id: `child-${index}`, type: "text" as const, text: `Visible order ${index}`, ...(index === 2 ? { isHidden: true } : {}) })), layout: { direction: "horizontal", columns } };
      const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="tablet" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
      expect(html).not.toContain("Visible order 2");
      expect(html.match(/grid-column:1 \/ -1/g)).toHaveLength(1);
      expect(html.indexOf("Visible order 1")).toBeLessThan(html.indexOf("Visible order 3"));
    }
  });

  it("balances Thirds from visible children only", () => {
    const candidate: CompositionGroup = { id: "hidden-thirds", type: "compositionGroup", children: [1, 2, 3, 4, 5].map((index) => ({ id: `third-${index}`, type: "text" as const, text: `Third visible ${index}`, ...(index === 2 ? { isHidden: true } : {}) })), layout: { direction: "horizontal", columns: "equal-3" } };
    const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).not.toContain("Third visible 2");
    expect(html.match(/grid-column:span 2/g)).toHaveLength(3);
    expect(html.match(/grid-column:1 \/ -1/g)).toHaveLength(1);
  });

  it("omits a hidden nested Group and all of its geometry", () => {
    const candidate: CompositionGroup = { id: "outer-visible", type: "compositionGroup", children: [{ id: "nested-hidden", type: "compositionGroup", isHidden: true, children: [{ id: "nested-copy", type: "text", text: "Never rendered" }], layout: { padding: { top: "xl" }, gap: "xl" } }, { id: "visible", type: "text", text: "Still rendered" }], layout: { direction: "vertical" } };
    const html = renderToStaticMarkup(<GroupElementRenderer group={candidate} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(html).toContain("Still rendered");
    expect(html).not.toContain("Never rendered");
    expect(html).not.toContain("padding-top:2rem");
    expect(html.match(/data-group-child-containment/g)).toHaveLength(1);
  });

  it("keeps an empty public Group space-free while exposing an editor affordance", () => {
    const empty = createGroupElement();
    const published = renderToStaticMarkup(<GroupElementRenderer group={empty} sectionId="date" mode="public" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    const editor = renderToStaticMarkup(<GroupElementRenderer group={empty} sectionId="date" mode="editor" viewport="mobile" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(published).not.toContain("min-height");
    expect(published).not.toContain("Empty Group");
    expect(editor).toContain("Empty Group · add children in Structure");
  });

  it("contains decorative backgrounds within the Group in public output", () => {
    const decorated: CompositionGroup = { ...group, appearance: { decorativeAppearance: { background: { texture: "paper", pattern: "botanical" } } } };
    const html = renderToStaticMarkup(<GroupElementRenderer group={decorated} sectionId="date" mode="public" viewport="desktop" templateKey="classic-filipiniana-v1" library={library} projectColors={[]} />);

    expect(html).toMatch(/^<div[^>]*data-website-element="group"[^>]*class="relative isolate"/);
    expect(html).toContain('data-background-decoration="true"');
  });

  it("shows a selectable Group boundary only in the editor", () => {
    const editor = renderToStaticMarkup(<WebsiteElementFrame mode="editor" sectionId="date" elementId="group" elementType="Group" selected onSelect={() => undefined}>
      <GroupElementRenderer group={group} sectionId="date" mode="editor" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} selectedElementId="group" />
    </WebsiteElementFrame>);
    const published = renderToStaticMarkup(<GroupElementRenderer group={group} sectionId="date" mode="public" viewport="desktop" templateKey="modern-editorial-v1" library={library} projectColors={[]} />);
    expect(editor).toContain('data-editor-group="true"');
    expect(editor).toContain('aria-label="Select Group"');
    expect(editor).toContain("editor-group-boundary");
    expect(published).not.toContain("Select Group");
    expect(published).not.toContain("editor-group-boundary");
  });

  it("supports child insertion, reordering updates, nested lookup, and stable ungroup order", () => {
    let flow: SectionChildFlow = { elements: [group], order: [{ kind: "specialized", key: "content" }, { kind: "element", id: group.id }] };
    flow = addGroupChild(flow, group.id, { id: "c", type: "text", text: "Third" });
    expect(findSectionElement(flow, "c")?.type).toBe("text");
    flow = updateGroupChildren(flow, group.id, [...group.children].reverse());
    expect((findSectionElement(flow, group.id) as CompositionGroup).children.map(({ id }) => id)).toEqual(["b", "a"]);
    flow = ungroupSectionElement(flow, group.id);
    expect(flow.order).toEqual([{ kind: "specialized", key: "content" }, { kind: "element", id: "b" }, { kind: "element", id: "a" }]);
  });

  it("caps nesting at two Group levels", () => {
    const nested = { id: "one", type: "compositionGroup", children: [{ id: "two", type: "compositionGroup", children: [{ id: "three", type: "compositionGroup", children: [] }] }] };
    expect(compositionGroupSchema.safeParse(nested).success).toBe(false);
    expect(createGroupElement()).toMatchObject({ type: "compositionGroup", children: [] });
    expect(createGroupElement()).not.toHaveProperty("layout");
  });

  it("updates nested Text without replacing its Group or identity", () => {
    const flow: SectionChildFlow = { elements: [group], order: [{ kind: "specialized", key: "content" }, { kind: "element", id: "group" }] };
    const updated = updateSectionTextElement(flow, "a", "Typing works");
    expect(findSectionElement(updated ?? undefined, "a")).toMatchObject({ id: "a", type: "text", text: "Typing works" });
    expect(findSectionElement(updated ?? undefined, "group")?.type).toBe("compositionGroup");
  });
});
