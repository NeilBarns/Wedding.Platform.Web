import { EditableText } from "../../../websiteEditor/inline/EditableText";
import type {
  GalleryContent,
  HeroContent,
  PeopleContent,
  ResolvedWebsiteMedia,
  RsvpContent,
  StoryBlock,
  StoryContent,
} from "../../../websiteEditor/types";
import { ZoomedMediaImage } from "../../ZoomedMediaImage";
import {
  ClassicFoundationOrnament,
} from "./decorations";
import type { ResponsiveViewport } from "../../../websiteEditor/types";
import type { ProjectColor } from "../../../websiteColors/projectColors";
import { resolveNarrativeBackgroundColor } from "../../narrativeBackground";
import { DecorativeBackgroundLayers } from "../../DecorativeBackgroundLayers";
import { SectionContentInset } from "../../SectionContentInset";
import type {
  ElementCapability,
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../../../websiteCapabilities/types";
import {
  narrativeSlotCss,
  resolveNarrativeSlotAppearance,
  type NarrativeTextSlotKey,
} from "../../narrativeAppearance";
import { classicNarrativeTokens } from "../narrativeTokens";
import {
  narrativeResponsiveOrderClasses,
  type ResolvedNarrativeComposition,
} from "../../narrativeComposition";
import { narrativeMediaCornerClass } from "../../narrativeMediaAppearance";
import type { NarrativeMediaCornerStyle } from "../../../websiteEditor/narrativeMediaAppearance";
import { NarrativeMediaFrameLayer } from "../../NarrativeMediaFrameLayer";
import { resolveStoryHeaderParticipation, type StoryBlockChoreographyContext } from "../../storyEffectiveSequence";
import { EditorSelectionFrame } from "../../EditorSelectionFrame";
import { useSelectedStoryHeaderField } from "../../EditorSelectionContext";
import {
  narrativeAlignmentClasses,
  type NarrativeAlignmentClasses,
} from "../../narrativeAlignment";

const emptyContext: ResolvedDesignContext = {
  headingFontId: "",
  bodyFontId: "",
  headingColorId: "",
  bodyColorId: "",
  accentColorId: "",
};

export function ClassicFilipinianaHero({
  sectionId,
  eventName,
  content,
}: {
  sectionId: string;
  eventName: string;
  content: HeroContent;
}) {
  return (
    <div
      data-section-content
      data-section-specialized-content
      data-hero-foreground-inset
      className="relative flex min-h-[34rem] flex-col items-center justify-center overflow-hidden px-8 py-20 text-center sm:py-24"
    >
      <ClassicFoundationOrnament className="relative mb-8" />
      <p className="relative text-[10px] font-semibold uppercase tracking-[0.38em] text-[var(--cf-secondary)]">
        Together with their families
      </p>
      <h1
        data-section-heading
        className="relative mt-7 w-full max-w-2xl font-[family-name:var(--cf-heading-font)] text-5xl leading-[1.05] text-[var(--cf-text)] sm:text-6xl"
      >
        <EditableText
          sectionId={sectionId}
          path={["headline"]}
          value={content.headline}
          fallback={eventName}
          showFallbackInEditor
          placeholder="Add headline"
          label="Hero headline"
        />
      </h1>
      <p
        data-section-body
        className="relative mt-6 w-full max-w-lg text-sm leading-7 text-[var(--cf-muted)]"
      >
        <EditableText
          sectionId={sectionId}
          path={["subheadline"]}
          value={content.subheadline}
          placeholder="Add subheadline"
          label="Hero subheadline"
          multiline
        />
      </p>
      <ClassicFoundationOrnament className="relative mt-10 rotate-180 opacity-70" />
    </div>
  );
}

export function ClassicFilipinianaStoryHeader({
  sectionId,
  content,
  mode,
  fields,
  library,
  projectColors,
  context = emptyContext,
  viewport,
}: {
  sectionId: string;
  content: StoryContent;
  mode: "editor" | "public";
  fields: import("../../../websiteEditor/types").StoryHeaderField[];
  library: TemplateDesignLibrary;
  projectColors: ProjectColor[];
  context?: ResolvedDesignContext;
  viewport: ResponsiveViewport;
}) {
  const selectedField = useSelectedStoryHeaderField();
  const participation = resolveStoryHeaderParticipation(content);
  const renderedFields = mode === "public" ? fields.filter((field) => participation[field]) : fields;
  const storyStyle = (field: import("../../../websiteEditor/types").StoryHeaderField) => ({ ...narrativeSlotCss(resolveNarrativeSlotAppearance(field === "intro" ? "body" : field, content.singletonAppearance?.[field], context, classicNarrativeTokens.defaults[field === "intro" ? "body" : field], viewport), library, "classic-filipiniana-v1", classicNarrativeTokens, projectColors), ...(content.singletonAppearance?.[field]?.alignment ? { textAlign: content.singletonAppearance[field]!.alignment === 'start' ? 'left' : content.singletonAppearance[field]!.alignment === 'end' ? 'right' : 'center' } : {}) } as React.CSSProperties);
  const storyTextAlignmentClass = (field: import("../../../websiteEditor/types").StoryHeaderField) => content.singletonAppearance?.[field]?.alignment === "start" ? "text-left" : content.singletonAppearance?.[field]?.alignment === "end" ? "text-right" : content.singletonAppearance?.[field]?.alignment === "center" ? "text-center" : undefined;
  if (renderedFields.length === 0) return null;
  return (
    <SectionContentInset className="relative overflow-hidden text-center">
      <div data-section-specialized-content className="relative mx-auto max-w-5xl">
        <ClassicFoundationOrnament className="mx-auto mb-5 h-5 w-32 opacity-75" />
        {renderedFields.map((field, index) => field === "eyebrow" ? (
          <p style={storyStyle(field)} key={field} data-editor-story-field={field} className={`${index ? "mt-3" : ""} relative rounded-sm text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--cf-secondary)]`}><EditableText sectionId={sectionId} path={["eyebrow"]} value={content.eyebrow ?? ""} placeholder="Add eyebrow" label="Story eyebrow" className={storyTextAlignmentClass(field)} /><EditorSelectionFrame selected={mode === "editor" && selectedField === field} /></p>
        ) : field === "heading" ? (
          <h2 style={storyStyle(field)} key={field} data-editor-story-field={field} data-section-heading={content.singletonAppearance?.heading?.alignment ? undefined : ""} className={`${index ? "mt-3" : ""} relative mx-auto w-full max-w-2xl break-words rounded-sm font-[family-name:var(--cf-heading-font)] text-3xl leading-tight text-[var(--cf-text)] md:text-4xl`}><EditableText sectionId={sectionId} path={["heading"]} value={content.heading} placeholder="Add heading" label="Story heading" className={storyTextAlignmentClass(field)} /><EditorSelectionFrame selected={mode === "editor" && selectedField === field} /></h2>
        ) : (
          <p style={storyStyle(field)} key={field} data-editor-story-field={field} data-section-body={content.singletonAppearance?.intro?.alignment ? undefined : ""} className={`${index ? "mt-6 md:mt-8" : ""} relative mx-auto max-w-2xl break-words rounded-sm whitespace-pre-line text-sm leading-8 text-[var(--cf-section-body)]`}><EditableText sectionId={sectionId} path={["intro"]} value={content.intro ?? ""} placeholder="Add introduction" label="Story introduction" multiline className={storyTextAlignmentClass(field)} /><EditorSelectionFrame selected={mode === "editor" && selectedField === field} /></p>
        ))}
      </div>
    </SectionContentInset>
  );
}

export function ClassicFilipinianaStoryBlock({
  sectionId,
  block,
  index,
  library,
  projectColors,
  viewport,
  context = emptyContext,
  composition,
  mediaCornerStyle,
  mediaFrameStyles = [],
  mediaFrameColorIds = [],
  defaultMediaFrameStyle,
  media,
  mode = "public",
  choreography,
}: {
  sectionId: string;
  block: StoryBlock;
  index: number;
  library: TemplateDesignLibrary;
  projectColors: ProjectColor[];
  viewport: ResponsiveViewport;
  context?: ResolvedDesignContext;
  composition: ResolvedNarrativeComposition;
  mediaCornerStyle?: NarrativeMediaCornerStyle;
  mediaFrameStyles?: NonNullable<ElementCapability["narrativeBlock"]>["appearance"]["media"]["frameStyles"];
  mediaFrameColorIds?: readonly string[];
  defaultMediaFrameStyle?: string;
  media?: React.ReactNode;
  mode?: "editor" | "public";
  choreography?: StoryBlockChoreographyContext;
}) {
  const { slots } = block;
  const style = (key: NarrativeTextSlotKey) =>
    narrativeSlotCss(
      resolveNarrativeSlotAppearance(
        key,
        slots[key].appearance,
        context,
        classicNarrativeTokens.defaults[key],
        viewport,
      ),
      library,
      "classic-filipiniana-v1",
      classicNarrativeTokens,
      projectColors,
    );
  const alignment = narrativeAlignmentClasses(
    composition.effective.textAlignment,
  );
  const backgroundColor = resolveNarrativeBackgroundColor(block.appearance?.backgroundColorId, library, projectColors);
  const surface = backgroundColor ? "" : composition.effective.surface === "feature"
      ? "border-y border-[var(--cf-section-accent)] bg-[color-mix(in_srgb,var(--cf-section-accent)_12%,var(--cf-page))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--cf-section-accent)_22%,transparent)]"
      : composition.effective.surface === "soft"
        ? "bg-[color-mix(in_srgb,var(--cf-section-body)_7%,transparent)]"
        : "";
  const split = ["splitStart", "splitEnd"].includes(
    composition.effective.mediaPlacement ?? "",
  );
  const layout = split
    ? "grid gap-x-10 md:grid-cols-2 md:items-center"
    : "grid grid-cols-1";
  const textColumn =
    composition.effective.mediaPlacement === "splitStart"
      ? "md:col-start-2"
      : "md:col-start-1";
  const rendered = composition.rendering.slots;
  const hasTextGroup =
    rendered.eyebrow || rendered.heading || rendered.divider || rendered.body || rendered.quote;
  const beforeDivider = rendered.eyebrow || rendered.heading;
  const afterDivider = rendered.body || rendered.quote;
  const beforeBody = beforeDivider || rendered.divider;
  const beforeQuote = beforeBody || rendered.body;
  const rendersMedia = Boolean(media) && !composition.rendering.suppressMedia;
  const responsiveOrder = narrativeResponsiveOrderClasses(composition);
  const mediaClass = narrativeMediaClass(
    composition,
    viewport,
    "classic",
    hasTextGroup,
  );
  const hasVisibleSlot = Object.values(rendered).some(Boolean);
  const slotTarget = (slot: string) => mode === "editor" ? { "data-editor-narrative-slot": slot, "data-editor-narrative-block": block.id } : {};
  const hasAdjacentPredecessor = Boolean(choreography && choreography.effectiveIndex > 0);
  const consecutiveMediaFirst = choreography?.previousPresentation === "mediaFirst"
    && composition.effective.legacyPresentation === "mediaFirst";
  const rootRhythm = composition.effective.legacyPresentation === "mediaFirst"
    ? hasAdjacentPredecessor
      ? consecutiveMediaFirst ? "pb-10 pt-6 md:pb-14 md:pt-8" : "pb-10 pt-8 md:pb-14 md:pt-10"
      : "py-10 md:py-14"
    : hasAdjacentPredecessor
      ? "pb-14 pt-10 md:pb-20 md:pt-14"
      : "py-14 md:py-20";
  return (
    <div
      data-section-content
      data-section-specialized-content
      data-narrative-presentation={composition.effective.legacyPresentation}
      style={backgroundColor ? { backgroundColor } : undefined}
      className={`relative isolate min-w-0 overflow-hidden px-7 md:px-12 [&>:not([data-background-decoration])]:relative [&>:not([data-background-decoration])]:z-10 ${rootRhythm} ${alignment.text} ${surface} ${layout}`}
    >
      <DecorativeBackgroundLayers templateKey="classic-filipiniana-v1" appearance={block.appearance?.decorativeAppearance?.background} viewport={viewport} />
      {!hasVisibleSlot && mode === "editor" ? (
        <p className="col-span-full text-center text-xs italic text-[var(--cf-muted)]">
          Nothing currently visible.
        </p>
      ) : null}
      {rendered.eyebrow && (
        <p
          {...slotTarget("eyebrow")}
          style={style("eyebrow")}
          className={`text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--cf-muted)] ${textColumn}`}
        >
          <EditableText
            sectionId={sectionId}
            narrativeSlot={{ blockId: block.id, slot: "eyebrow" }}
            path={["elements", index, "slots", "eyebrow", "text"]}
            value={slots.eyebrow.text}
            placeholder="Add eyebrow"
            label={`Story block ${index + 1} eyebrow`}
          />
        </p>
      )}
      {rendered.heading && (
        <ClassicFilipinianaStoryBlockHeading
          sectionId={sectionId}
          block={block}
          index={index}
          style={style("heading")}
          editorSlotTarget={mode === "editor"}
          className={`${rendered.eyebrow ? "mt-3" : ""} ${textColumn} ${alignment.constrainedGroup}`}
        />
      )}
      {rendered.divider && (
        <ClassicFoundationOrnament
          editorNarrativeSlot={mode === "editor" ? "divider" : undefined}
          editorNarrativeBlock={mode === "editor" ? block.id : undefined}
          className={`${beforeDivider ? "mt-5" : ""} ${afterDivider ? "mb-5" : ""} h-4 w-28 opacity-55 ${textColumn} ${alignment.divider}`}
        />
      )}
      {rendered.body && (
        <div {...slotTarget("body")}
          className={`${beforeBody && !rendered.divider ? "mt-6" : ""} ${textColumn}`}
        >
          <ClassicFilipinianaStoryBlockBody
            sectionId={sectionId}
            block={block}
            index={index}
            style={style("body")}
            alignment={alignment}
          />
        </div>
      )}
      {rendered.quote && (
        <blockquote
          {...slotTarget("quote")}
          style={style("quote")}
          className={`${composition.effective.legacyPresentation === "quoteLed" ? `${beforeQuote ? "mt-8" : ""} border-y border-[var(--cf-section-accent)] py-8 text-3xl md:text-4xl` : `${beforeQuote && !rendered.divider ? "mt-7" : ""} text-xl`} max-w-xl break-words font-[family-name:var(--cf-heading-font)] italic ${textColumn} ${alignment.constrainedGroup}`}
        >
          <EditableText
            sectionId={sectionId}
            narrativeSlot={{ blockId: block.id, slot: "quote" }}
            path={["elements", index, "slots", "quote", "text"]}
            value={slots.quote.text}
            placeholder="Add quote"
            label={`Story block ${index + 1} quote`}
          />
          {slots.quote.attribution && (
            <footer className="mt-2 text-xs not-italic">
              - {slots.quote.attribution}
            </footer>
          )}
        </blockquote>
      )}
      {rendersMedia ? (
        <div {...slotTarget("media")} className={`${mediaClass} ${responsiveOrder.media}`}><div className="relative isolate"><div className={`overflow-hidden ${narrativeMediaCornerClass(mediaCornerStyle)}`}>{media}</div><NarrativeMediaFrameLayer templateKey="classic-filipiniana-v1" viewport={viewport} appearance={block.slots.media.appearance} frameStyles={mediaFrameStyles} frameColorIds={mediaFrameColorIds} library={library} projectColors={projectColors} defaultStyle={defaultMediaFrameStyle} /></div></div>
      ) : null}
      {rendered.caption && (
        <p
          {...slotTarget("caption")}
          style={style("caption")}
          className={`${rendersMedia ? "mt-4" : ""} max-w-xl text-xs text-[var(--cf-muted)] ${textColumn} ${alignment.constrainedGroup} ${responsiveOrder.caption}`}
        >
          <EditableText
            sectionId={sectionId}
            narrativeSlot={{ blockId: block.id, slot: "caption" }}
            path={["elements", index, "slots", "caption", "text"]}
            value={slots.caption.text}
            placeholder="Add caption"
            label={`Story block ${index + 1} caption`}
          />
        </p>
      )}
      {rendered.cta && (
        <span
          {...slotTarget("cta")}
          style={style("cta")}
          className={`${hasTextGroup || rendersMedia || rendered.caption ? "mt-7" : ""} block w-fit border border-[var(--cf-theme-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${textColumn} ${alignment.action}`}
        >
          {slots.cta.label}
        </span>
      )}
      {mode === "editor" && !composition.rendering.suppressMedia &&
        !slots.media.isHidden &&
        slots.media.content &&
        slots.media.content.type !== "image" && (
          <p className={`${hasTextGroup ? "mt-5" : ""} text-xs text-[var(--cf-muted)]`}>
            {slots.media.content.type === "video"
              ? "Video"
              : "Media collection"}{" "}
            is preserved but is not previewable yet.
          </p>
        )}
    </div>
  );
}

export function ClassicFilipinianaStoryBlockHeading({
  sectionId,
  block,
  index,
  style,
  library,
  viewport = "desktop",
  context = emptyContext,
  editorSlotTarget = false,
  className = "",
}: {
  sectionId: string;
  block: StoryBlock;
  index: number;
  style?: React.CSSProperties;
  library?: TemplateDesignLibrary;
  viewport?: ResponsiveViewport;
  context?: ResolvedDesignContext;
  editorSlotTarget?: boolean;
  className?: string;
}) {
  const slot = block.slots.heading;
  const effectiveStyle =
    style ??
    (library
      ? narrativeSlotCss(
          resolveNarrativeSlotAppearance(
            "heading",
            slot.appearance,
            context,
            classicNarrativeTokens.defaults.heading,
            viewport,
          ),
          library,
          "classic-filipiniana-v1",
          classicNarrativeTokens,
        )
      : undefined);
  return !slot.isHidden ? (
    <h3
      data-editor-narrative-slot={editorSlotTarget ? "heading" : undefined}
      data-editor-narrative-block={editorSlotTarget ? block.id : undefined}
      style={effectiveStyle}
      className={`max-w-2xl break-words font-[family-name:var(--cf-heading-font)] text-3xl text-[var(--cf-text)] ${className}`}
    >
      <EditableText
        sectionId={sectionId}
        narrativeSlot={{ blockId: block.id, slot: "heading" }}
        path={["elements", index, "slots", "heading", "text"]}
        value={slot.text}
        placeholder="Add block heading"
        label={`Story block ${index + 1} heading`}
      />
    </h3>
  ) : null;
}

function narrativeMediaClass(
  composition: ResolvedNarrativeComposition,
  viewport: ResponsiveViewport,
  template: "classic",
  hasTextGroup: boolean,
) {
  const placement = composition.effective.mediaPlacement;
  const treatment = composition.effective.mediaTreatment;
  const compact = viewport === "mobile";
  const split = placement === "splitStart" || placement === "splitEnd";
  const collapsedMediaFirstSplit =
    compact && split && composition.effective.legacyPresentation === "mediaFirst";
  const column =
    placement === "splitStart" ? "md:col-start-1" : "md:col-start-2";
  const position = collapsedMediaFirstSplit
    ? ""
    : split && !compact
      ? `${column} md:row-start-1 md:row-span-8`
      : placement === "above" || placement === "leading"
        ? `${composition.effective.legacyPresentation === "mediaFirst" ? "" : "-order-1"} ${hasTextGroup ? "mb-8" : ""}`
        : placement === "inset"
          ? `mx-auto w-3/4 max-w-xl ${hasTextGroup ? "mt-8" : ""}`
          : hasTextGroup
            ? "mt-8"
            : "";
  const treatmentClass =
    treatment === "cinematic"
      ? "[&_img]:aspect-[16/7] [&_img]:object-cover"
      : treatment === "wide"
        ? "w-full md:scale-[1.06]"
        : treatment === "fullBleed"
          ? "-mx-7 w-[calc(100%+3.5rem)] md:-mx-12 md:w-[calc(100%+6rem)]"
          : "";
  return `min-w-0 ${position} ${treatmentClass} ${template === "classic" ? "[&_img]:grayscale-[12%]" : ""}`;
}

export function ClassicFilipinianaStoryBlockBody({
  sectionId,
  block,
  index,
  style,
  library,
  viewport = "desktop",
  context = emptyContext,
  alignment = narrativeAlignmentClasses("start"),
}: {
  sectionId: string;
  block: StoryBlock;
  index: number;
  style?: React.CSSProperties;
  library?: TemplateDesignLibrary;
  viewport?: ResponsiveViewport;
  context?: ResolvedDesignContext;
  alignment?: NarrativeAlignmentClasses;
}) {
  const slot = block.slots.body;
  const effectiveStyle =
    style ??
    (library
      ? narrativeSlotCss(
          resolveNarrativeSlotAppearance(
            "body",
            slot.appearance,
            context,
            classicNarrativeTokens.defaults.body,
            viewport,
          ),
          library,
          "classic-filipiniana-v1",
          classicNarrativeTokens,
        )
      : undefined);
  return !slot.isHidden ? (
    <p
      style={effectiveStyle}
      className={`max-w-2xl break-words whitespace-pre-line text-sm leading-8 text-[var(--cf-section-body)] ${alignment.text} ${alignment.constrainedGroup}`}
    >
      <EditableText
        sectionId={sectionId}
        narrativeSlot={{ blockId: block.id, slot: "body" }}
        path={["elements", index, "slots", "body", "text"]}
        value={slot.text}
        placeholder="Add story"
        label={`Story block ${index + 1} body`}
        multiline
        className={alignment.text}
      />
    </p>
  ) : null;
}

export function ClassicFilipinianaPeople({
  sectionId,
  content,
  mode,
  media,
  showMedia,
  presentation,
}: {
  sectionId: string;
  content: PeopleContent;
  mode: "editor" | "public";
  media: Record<string, ResolvedWebsiteMedia>;
  showMedia: boolean;
  presentation: string;
}) {
  const groups = content.groups.filter((group) => group.people.length > 0);
  const imagesVisible = showMedia && presentation !== "namesOnly";
  const imageClass =
    presentation === "portraitCards"
      ? "mx-auto mb-3 aspect-[4/5] w-full max-w-48 rounded-sm object-cover md:max-w-40 xl:max-w-36"
      : "mx-auto mb-3 aspect-square w-full max-w-32 rounded-full object-cover md:max-w-28";
  return (
    <ContentSection
      eyebrow="Those beside us"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Wedding Party"
          placeholder="Add heading"
          label="Wedding Party heading"
        />
      }
      specializedClassName="px-5 py-12 [&_[data-section-body]]:mt-6 md:px-8 md:py-16 md:[&_[data-section-body]]:mt-8 xl:px-12 xl:py-20"
    >
      {groups.length > 0 ? (
        <div data-people-groups className={`mx-auto grid w-full gap-7 md:gap-8 xl:gap-x-10 xl:gap-y-10 ${groups.length === 1 ? "max-w-2xl" : "max-w-5xl md:grid-cols-2"}`}>
          {groups.map((group, groupIndex) => (
            <section
              data-people-group
              className={`${groups.length > 1 && groups.length % 2 === 1 && groupIndex === groups.length - 1 ? "md:col-span-2 md:mx-auto md:w-full md:max-w-xl" : ""} min-w-0 bg-[color-mix(in_srgb,var(--cf-surface)_52%,transparent)] px-4 py-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--cf-border)_20%,transparent)] md:px-5 md:py-6`}
              key={group.id}
            >
              <h3 className="break-words [overflow-wrap:anywhere] font-[family-name:var(--cf-heading-font)] text-xl text-[var(--cf-text)]">
                {group.name}
              </h3>
              <ul
                data-people-list
                className={`mt-4 ${imagesVisible && group.people.some((person) => person.media && media[person.media.assetId]) ? `grid min-w-0 grid-cols-1 gap-5 ${groups.length === 1 ? "md:grid-cols-2" : "xl:grid-cols-2"}` : "space-y-3"}`}
              >
                {group.people.map((person) => {
                  const asset =
                    imagesVisible && person.media
                      ? media[person.media.assetId]
                      : undefined;
                  return (
                    <li className="min-w-0" data-person-card key={person.id}>
                      {asset && person.media && (
                        <ZoomedMediaImage
                          className={imageClass}
                          height={asset.web.height}
                          reference={person.media}
                          src={asset.web.url}
                          width={asset.web.width}
                        />
                      )}
                      <span className="block break-words [overflow-wrap:anywhere] text-base text-[var(--cf-text)]">
                        {person.name}
                      </span>
                      {person.role && (
                        <span className="mt-0.5 block break-words [overflow-wrap:anywhere] text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--cf-section-accent)]">
                          {person.role}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : mode === "editor" ? (
        <EmptyCopy>Add groups and people from the Content panel.</EmptyCopy>
      ) : null}
    </ContentSection>
  );
}

export function ClassicFilipinianaGallery({
  sectionId,
  content,
  mode,
}: {
  sectionId: string;
  content: GalleryContent;
  mode: "editor" | "public";
}) {
  return (
    <ContentSection
      eyebrow="Memories"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Gallery"
          placeholder="Add heading"
          label="Gallery heading"
        />
      }
    >
      {mode === "editor" && (
        <div
          className="mx-auto grid max-w-xl grid-cols-3 items-center gap-3"
          aria-label="Empty gallery preview"
        >
          <div className="aspect-[4/5] -rotate-2 border border-[var(--cf-border)] bg-[color-mix(in_srgb,var(--cf-surface)_65%,transparent)] shadow-sm" />
          <div className="flex aspect-[4/5] items-center justify-center border border-[var(--cf-border)] bg-[var(--cf-surface)] px-2 text-xs italic text-[var(--cf-muted)] shadow-sm">
            Photos will appear here
          </div>
          <div className="aspect-[4/5] rotate-2 border border-[var(--cf-border)] bg-[color-mix(in_srgb,var(--cf-surface)_65%,transparent)] shadow-sm" />
        </div>
      )}
    </ContentSection>
  );
}

export function ClassicFilipinianaRsvp({
  sectionId,
  content,
}: {
  sectionId: string;
  content: RsvpContent;
}) {
  return (
    <ContentSection
      eyebrow="Celebrate with us"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Kindly Respond"
          placeholder="Add heading"
          label="RSVP heading"
        />
      }
    >
      <p className="mx-auto max-w-lg whitespace-pre-line">
        <EditableText
          sectionId={sectionId}
          path={["description"]}
          value={content.description}
          fallback="We would be honored to celebrate this day with you."
          placeholder="Add description"
          label="RSVP description"
          multiline
        />
      </p>
      <div
        data-rsvp-button
        className="mx-auto mt-9 max-w-xs border border-[var(--cf-theme-accent)] bg-[var(--cf-theme-accent)] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white"
      >
        <EditableText
          sectionId={sectionId}
          path={["buttonLabel"]}
          value={content.buttonLabel}
          fallback="RSVP"
          placeholder="Add button label"
          label="RSVP button label"
        />
      </div>
    </ContentSection>
  );
}

function ContentSection({
  eyebrow,
  heading,
  children,
  eyebrowParticipates,
  headingParticipates = true,
  bodyParticipates = true,
  renderFlow,
  specializedClassName = "",
}: {
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  children: React.ReactNode;
  eyebrowParticipates?: boolean;
  headingParticipates?: boolean;
  bodyParticipates?: boolean;
  renderFlow?: (specialized: React.ReactNode) => React.ReactNode;
  specializedClassName?: string;
}) {
  const hasEyebrow = eyebrowParticipates ?? Boolean(eyebrow);
  return (
    <SectionContentInset
      className={renderFlow ? "" : "relative overflow-hidden"}
    >
      {(() => { const specialized = <div data-section-specialized-content className={`relative mx-auto max-w-5xl overflow-hidden text-center ${specializedClassName}`}>
        <ClassicFoundationOrnament className="mx-auto mb-5 h-5 w-32 opacity-75" />
        {hasEyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--cf-secondary)]">{eyebrow}</p>}
        {headingParticipates && <h2
          data-section-heading
          className={`mx-auto w-full max-w-2xl font-[family-name:var(--cf-heading-font)] text-3xl leading-tight text-[var(--cf-text)] sm:text-4xl ${hasEyebrow ? "mt-3" : ""}`}
        >
          {heading}
        </h2>}
        {bodyParticipates && <div
          data-section-body
          className={`mx-auto text-sm leading-7 text-[var(--cf-muted)] ${hasEyebrow || headingParticipates ? "mt-8" : ""}`}
        >
          {children}
        </div>}
      </div>; return renderFlow ? renderFlow(specialized) : specialized; })()}
    </SectionContentInset>
  );
}
function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="italic text-[var(--cf-muted)]">{children}</p>;
}
