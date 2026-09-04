import { EditableText } from "../../../websiteEditor/inline/EditableText";
import type {
  DateContent,
  DressCodeContent,
  FaqContent,
  GalleryContent,
  HeroContent,
  PeopleContent,
  ResolvedWebsiteMedia,
  RsvpContent,
  ScheduleContent,
  StoryBlock,
  StoryContent,
  VenueContent,
} from "../../../websiteEditor/types";
import { ZoomedMediaImage } from "../../ZoomedMediaImage";
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
import { modernNarrativeTokens } from "../narrativeTokens";
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

const emptyContext = {
  headingFontId: "",
  bodyFontId: "",
  headingColorId: "",
  bodyColorId: "",
  accentColorId: "",
};

export function ModernEditorialHero({
  sectionId,
  eventName,
  date,
  content,
  compact = false,
}: {
  sectionId: string;
  eventName: string;
  date: string | null;
  content: HeroContent;
  compact?: boolean;
}) {
  return (
    <div
      data-section-content
      data-hero-foreground-inset
      className={`relative overflow-hidden ${compact ? "min-h-0 px-5 py-10 sm:px-8 sm:py-12" : "min-h-[38rem] px-7 py-20 sm:px-14 sm:py-28"}`}
      style={{ boxShadow: "var(--me-frame)" }}
    >
      <div
        className={`${compact ? "mb-9" : "mb-16"} flex items-center justify-between border-t-[length:var(--me-rule-width)] border-[var(--me-border)] pt-3 text-[9px] font-semibold uppercase tracking-[0.28em]`}
      >
        <span>Wedding announcement</span>
        <span>{date ?? "Date forthcoming"}</span>
      </div>
      <h1
        data-section-heading
        className={`max-w-4xl translate-x-[var(--me-offset)] font-[family-name:var(--me-heading-font)] ${compact ? "text-[clamp(3.5rem,9vw,6.5rem)]" : "text-[clamp(4rem,12vw,8.5rem)]"} leading-[0.82] tracking-[-0.055em] text-[var(--me-text)]`}
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
        className={`${compact ? "mt-9" : "mt-14"} max-w-lg whitespace-pre-line text-sm leading-7 text-[var(--me-muted)]`}
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
    </div>
  );
}

export function ModernEditorialDate({
  sectionId,
  date,
  content,
  renderFlow,
}: {
  sectionId: string;
  date: string | null;
  content: DateContent;
  renderFlow?: (specialized: React.ReactNode) => React.ReactNode;
}) {
  return (
    <EditorialSection
      number="02"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="The Date"
          placeholder="Add heading"
          label="Date heading"
        />
      }
      renderFlow={renderFlow}
    >
      <p className="font-[family-name:var(--me-heading-font)] text-4xl sm:text-6xl">
        {date ?? "Date to be announced"}
      </p>
      <p className="mt-6 max-w-xl whitespace-pre-line">
        <EditableText
          sectionId={sectionId}
          path={["description"]}
          value={content.description}
          placeholder="Add description"
          label="Date description"
          multiline
        />
      </p>
    </EditorialSection>
  );
}
export function ModernEditorialStoryHeader({
  sectionId,
  content,
  mode,
  fields,
  showNumber,
  library, projectColors, context = emptyContext, viewport,
}: {
  sectionId: string;
  content: StoryContent;
  mode: "editor" | "public";
  fields: import("../../../websiteEditor/types").StoryHeaderField[];
  showNumber: boolean;
  library: TemplateDesignLibrary; projectColors: ProjectColor[]; context?: ResolvedDesignContext; viewport: ResponsiveViewport;
}) {
  const selectedField = useSelectedStoryHeaderField();
  const participation = resolveStoryHeaderParticipation(content);
  const renderedFields = mode === "public" ? fields.filter((field) => participation[field]) : fields;
  const storyStyle = (field: import("../../../websiteEditor/types").StoryHeaderField) => ({ ...narrativeSlotCss(resolveNarrativeSlotAppearance(field === "intro" ? "body" : field, content.singletonAppearance?.[field], context, modernNarrativeTokens.defaults[field === "intro" ? "body" : field], viewport), library, "modern-editorial-v1", modernNarrativeTokens, projectColors), ...(content.singletonAppearance?.[field]?.alignment ? { textAlign: content.singletonAppearance[field]!.alignment === 'start' ? 'left' : content.singletonAppearance[field]!.alignment === 'end' ? 'right' : 'center' } : {}) } as React.CSSProperties);
  const storyTextAlignmentClass = (field: import("../../../websiteEditor/types").StoryHeaderField) => content.singletonAppearance?.[field]?.alignment === "start" ? "text-left" : content.singletonAppearance?.[field]?.alignment === "end" ? "text-right" : content.singletonAppearance?.[field]?.alignment === "center" ? "text-center" : undefined;
  if (renderedFields.length === 0) return null;
  return (
    <SectionContentInset className="" style={{ boxShadow: "var(--me-frame)" }}>
      <div className={showNumber ? "grid gap-9 sm:grid-cols-[5rem_1fr]" : "block"}>
        {showNumber && <p className="text-[10px] font-bold tracking-[0.25em]" aria-hidden="true">03 / 10</p>}
        <div>
          {renderedFields.map((field, index) => field === "eyebrow" ? (
            <p style={storyStyle(field)} key={field} data-editor-story-field={field} className={`${index ? "mt-4" : ""} relative rounded-sm text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--me-section-accent)]`}><EditableText sectionId={sectionId} path={["eyebrow"]} value={content.eyebrow ?? ""} placeholder="Add eyebrow" label="Story eyebrow" className={storyTextAlignmentClass(field)} /><EditorSelectionFrame selected={mode === "editor" && selectedField === field} /></p>
          ) : field === "heading" ? (
            <h2 style={storyStyle(field)} key={field} data-editor-story-field={field} data-section-heading={content.singletonAppearance?.heading?.alignment ? undefined : ""} className={`${index ? "mt-4" : ""} relative max-w-3xl rounded-sm font-[family-name:var(--me-heading-font)] text-4xl leading-none tracking-[-0.035em] sm:text-6xl`}><EditableText sectionId={sectionId} path={["heading"]} value={content.heading} placeholder="Add heading" label="Story heading" className={storyTextAlignmentClass(field)} /><EditorSelectionFrame selected={mode === "editor" && selectedField === field} /></h2>
          ) : (
            <p style={storyStyle(field)} key={field} data-editor-story-field={field} data-section-body={content.singletonAppearance?.intro?.alignment ? undefined : ""} className={`${index ? "mt-12" : ""} relative max-w-2xl rounded-sm whitespace-pre-line font-[family-name:var(--me-body-font)] text-xl leading-9 text-[var(--me-section-body)]`}><EditableText sectionId={sectionId} path={["intro"]} value={content.intro ?? ""} placeholder="Add introduction" label="Story introduction" multiline className={storyTextAlignmentClass(field)} /><EditorSelectionFrame selected={mode === "editor" && selectedField === field} /></p>
          ))}
        </div>
      </div>
    </SectionContentInset>
  );
}
export function ModernEditorialStoryBlock({
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
        modernNarrativeTokens.defaults[key],
        viewport,
      ),
      library,
      "modern-editorial-v1",
      modernNarrativeTokens,
      projectColors,
    );
  const alignment = narrativeAlignmentClasses(
    composition.effective.textAlignment,
  );
  const backgroundColor = resolveNarrativeBackgroundColor(block.appearance?.backgroundColorId, library, projectColors);
  const surface = backgroundColor ? "" : composition.effective.surface === "feature"
      ? "border-l-4 border-[var(--me-section-accent)] bg-[color-mix(in_srgb,var(--me-section-accent)_11%,var(--me-page))]"
      : composition.effective.surface === "soft"
        ? "bg-[color-mix(in_srgb,var(--me-section-body)_6%,transparent)]"
        : "";
  const split = ["splitStart", "splitEnd"].includes(
    composition.effective.mediaPlacement ?? "",
  );
  const textColumn =
    composition.effective.mediaPlacement === "splitStart"
      ? "sm:col-start-2"
      : "sm:col-start-1";
  const rendered = composition.rendering.slots;
  const hasTextGroup =
    rendered.eyebrow || rendered.heading || rendered.divider || rendered.body || rendered.quote;
  const beforeDivider = rendered.eyebrow || rendered.heading;
  const afterDivider = rendered.body || rendered.quote;
  const beforeBody = beforeDivider || rendered.divider;
  const beforeQuote = beforeBody || rendered.body;
  const rendersMedia = Boolean(media) && !composition.rendering.suppressMedia;
  const responsiveOrder = narrativeResponsiveOrderClasses(composition);
  const hasVisibleSlot = Object.values(rendered).some(Boolean);
  const slotTarget = (slot: string) => mode === "editor" ? { "data-editor-narrative-slot": slot, "data-editor-narrative-block": block.id } : {};
  const hasAdjacentPredecessor = Boolean(choreography && choreography.effectiveIndex > 0);
  const consecutiveMediaFirst = choreography?.previousPresentation === "mediaFirst"
    && composition.effective.legacyPresentation === "mediaFirst";
  const rootRhythm = hasAdjacentPredecessor
    ? consecutiveMediaFirst
      ? "pb-12 pt-5 sm:pb-16 sm:pt-7"
      : "pb-12 pt-7 sm:pb-16 sm:pt-9"
    : "py-12 sm:py-16";
  return (
    <div
      data-section-content
      data-narrative-presentation={composition.effective.legacyPresentation}
      style={backgroundColor ? { backgroundColor } : undefined}
      className={`relative isolate grid overflow-hidden px-7 sm:px-12 [&>:not([data-background-decoration])]:relative [&>:not([data-background-decoration])]:z-10 ${rootRhythm} ${hasAdjacentPredecessor ? "border-t border-[var(--me-border)]" : ""} ${split ? "gap-x-12 sm:grid-cols-2 sm:items-center" : "grid-cols-1"} ${alignment.text} ${surface}`}
    >
      <DecorativeBackgroundLayers templateKey="modern-editorial-v1" appearance={block.appearance?.decorativeAppearance?.background} viewport={viewport} />
      {!hasVisibleSlot && mode === "editor" ? (
        <p className="col-span-full text-center text-xs text-[var(--me-muted)]">
          Nothing currently visible.
        </p>
      ) : null}
      {rendered.eyebrow && (
        <p
          {...slotTarget("eyebrow")}
          style={style("eyebrow")}
          className={`text-xs font-bold uppercase tracking-[0.22em] ${textColumn}`}
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
        <h3 {...slotTarget("heading")}
          className={`${rendered.eyebrow ? "mt-4" : ""} max-w-3xl font-[family-name:var(--me-heading-font)] text-4xl font-semibold leading-tight sm:text-5xl ${textColumn} ${alignment.constrainedGroup}`}
        >
          <ModernEditorialStoryBlockHeading
            sectionId={sectionId}
            block={block}
            index={index}
            style={style("heading")}
          />
        </h3>
      )}
      {rendered.divider && (
        <hr
          {...slotTarget("divider")}
          className={`${beforeDivider ? "mt-6" : ""} ${afterDivider ? "mb-6" : ""} w-20 border-2 border-[var(--me-section-accent)] ${textColumn} ${alignment.divider}`}
        />
      )}
      {rendered.body && (
        <div {...slotTarget("body")} className={`${beforeBody && !rendered.divider ? "mt-6" : ""} ${textColumn}`}>
          <ModernEditorialStoryBlockBody
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
          className={`${composition.effective.legacyPresentation === "quoteLed" ? `${beforeQuote ? "mt-10" : ""} border-l-4 border-[var(--me-section-accent)] pl-6 text-4xl font-semibold not-italic sm:text-5xl` : `${beforeQuote && !rendered.divider ? "mt-8" : ""} text-2xl italic`} max-w-2xl font-[family-name:var(--me-heading-font)] ${textColumn} ${alignment.constrainedGroup}`}
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
        <div
          {...slotTarget("media")}
          className={`${modernNarrativeMediaClass(composition, viewport, hasTextGroup)} ${responsiveOrder.media}`}
        >
          <div className="relative isolate"><div className={`overflow-hidden ${narrativeMediaCornerClass(mediaCornerStyle)}`}>{media}</div><NarrativeMediaFrameLayer templateKey="modern-editorial-v1" viewport={viewport} appearance={block.slots.media.appearance} frameStyles={mediaFrameStyles} frameColorIds={mediaFrameColorIds} library={library} projectColors={projectColors} defaultStyle={defaultMediaFrameStyle} /></div>
        </div>
      ) : null}
      {rendered.caption && (
        <p
          {...slotTarget("caption")}
          style={style("caption")}
          className={`${rendersMedia ? "mt-4" : ""} max-w-2xl text-xs text-[var(--me-muted)] ${textColumn} ${alignment.constrainedGroup} ${responsiveOrder.caption}`}
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
          className={`${hasTextGroup || rendersMedia || rendered.caption ? "mt-7" : ""} block w-fit border-2 border-[var(--me-theme-text)] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] ${textColumn} ${alignment.action}`}
        >
          {slots.cta.label}
        </span>
      )}
      {mode === "editor" && !composition.rendering.suppressMedia &&
        !slots.media.isHidden &&
        slots.media.content &&
        slots.media.content.type !== "image" && (
          <p className={`${hasTextGroup ? "mt-5" : ""} text-xs text-[var(--me-muted)]`}>
            {slots.media.content.type === "video"
              ? "Video"
              : "Media collection"}{" "}
            is preserved but is not previewable yet.
          </p>
        )}
    </div>
  );
}

function modernNarrativeMediaClass(
  composition: ResolvedNarrativeComposition,
  viewport: ResponsiveViewport,
  hasTextGroup: boolean,
) {
  const placement = composition.effective.mediaPlacement;
  const treatment = composition.effective.mediaTreatment;
  const compact = viewport === "mobile";
  const split = placement === "splitStart" || placement === "splitEnd";
  const collapsedMediaFirstSplit =
    compact && split && composition.effective.legacyPresentation === "mediaFirst";
  const column =
    placement === "splitStart" ? "sm:col-start-1" : "sm:col-start-2";
  const position = collapsedMediaFirstSplit
    ? ""
    : split && !compact
      ? `${column} sm:row-start-1 sm:row-span-8`
      : placement === "above" || placement === "leading"
        ? `${composition.effective.legacyPresentation === "mediaFirst" ? "" : "-order-1"} ${hasTextGroup ? "mb-10" : ""}`
        : placement === "inset"
          ? `mx-auto w-2/3 max-w-lg ${hasTextGroup ? "mt-9" : ""}`
          : hasTextGroup
            ? "mt-10"
            : "";
  const treatmentClass =
    treatment === "cinematic"
      ? "[&_img]:aspect-[2/1] [&_img]:object-cover"
      : treatment === "wide"
        ? "w-full sm:scale-[1.08]"
        : treatment === "fullBleed"
          ? "-mx-7 w-[calc(100%+3.5rem)] sm:-mx-12 sm:w-[calc(100%+6rem)]"
          : "";
  const dominance =
    composition.effective.legacyPresentation === "mediaFirst"
      ? "sm:[&_img]:min-h-[28rem]"
      : "";
  return `min-w-0 ${position} ${treatmentClass} ${dominance}`;
}
export function ModernEditorialStoryBlockHeading({
  sectionId,
  block,
  index,
  style,
  library,
  viewport = "desktop",
  context = emptyContext,
}: {
  sectionId: string;
  block: StoryBlock;
  index: number;
  style?: React.CSSProperties;
  library?: TemplateDesignLibrary;
  viewport?: ResponsiveViewport;
  context?: ResolvedDesignContext;
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
            modernNarrativeTokens.defaults.heading,
            viewport,
          ),
          library,
          "modern-editorial-v1",
          modernNarrativeTokens,
        )
      : undefined);
  return !slot.isHidden ? (
    <span style={effectiveStyle}>
      <EditableText
        sectionId={sectionId}
        narrativeSlot={{ blockId: block.id, slot: "heading" }}
        path={["elements", index, "slots", "heading", "text"]}
        value={slot.text}
        placeholder="Add block heading"
        label={`Story block ${index + 1} heading`}
      />
    </span>
  ) : null;
}
export function ModernEditorialStoryBlockBody({
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
            modernNarrativeTokens.defaults.body,
            viewport,
          ),
          library,
          "modern-editorial-v1",
          modernNarrativeTokens,
        )
      : undefined);
  return !slot.isHidden ? (
    <p
      style={effectiveStyle}
      className={`max-w-2xl whitespace-pre-line text-base leading-8 text-[var(--me-section-body)] ${alignment.text} ${alignment.constrainedGroup}`}
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
export function ModernEditorialSchedule({
  sectionId,
  content,
}: {
  sectionId: string;
  content: ScheduleContent;
}) {
  return (
    <EditorialSection
      number="04"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Schedule"
          placeholder="Add heading"
          label="Schedule heading"
        />
      }
    >
      {content.items.length ? (
        <ol>
          {content.items.map((item, index) => (
            <li
              className="grid grid-cols-[5rem_1fr] gap-5 border-t border-[var(--me-border)] py-6 sm:grid-cols-[8rem_1fr]"
              key={index}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--me-section-accent)]">
                <EditableText
                  sectionId={sectionId}
                  path={["items", index, "time"]}
                  value={item.time}
                  fallback="TBA"
                  placeholder="Add time"
                  label={`Schedule item ${index + 1} time`}
                />
              </span>
              <div>
                <h3 className="font-[family-name:var(--me-heading-font)] text-2xl">
                  <EditableText
                    sectionId={sectionId}
                    path={["items", index, "title"]}
                    value={item.title}
                    fallback="Celebration detail"
                    placeholder="Add title"
                    label={`Schedule item ${index + 1} title`}
                  />
                </h3>
                <p className="mt-2 whitespace-pre-line">
                  <EditableText
                    sectionId={sectionId}
                    path={["items", index, "description"]}
                    value={item.description}
                    placeholder="Add description"
                    label={`Schedule item ${index + 1} description`}
                    multiline
                  />
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyCopy>Celebration details will appear here.</EmptyCopy>
      )}
    </EditorialSection>
  );
}
export function ModernEditorialVenue({
  sectionId,
  content,
}: {
  sectionId: string;
  content: VenueContent;
}) {
  return (
    <EditorialSection
      number="05"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Venue"
          placeholder="Add heading"
          label="Venue heading"
        />
      }
    >
      <div className="space-y-7">
        <div>
          <p className="font-[family-name:var(--me-heading-font)] text-3xl">
            <EditableText
              sectionId={sectionId}
              path={["name"]}
              value={content.name}
              fallback="Venue details to follow"
              placeholder="Add venue name"
              label="Venue name"
            />
          </p>
          <p className="mt-3 whitespace-pre-line text-xs font-semibold uppercase tracking-widest">
            <EditableText
              sectionId={sectionId}
              path={["address"]}
              value={content.address}
              placeholder="Add address"
              label="Venue address"
              multiline
            />
          </p>
        </div>
        <p className="max-w-xl whitespace-pre-line">
          <EditableText
            sectionId={sectionId}
            path={["description"]}
            value={content.description}
            placeholder="Add description"
            label="Venue description"
            multiline
          />
        </p>
      </div>
    </EditorialSection>
  );
}
export function ModernEditorialDressCode({
  sectionId,
  content,
  renderFlow,
}: {
  sectionId: string;
  content: DressCodeContent;
  renderFlow?: (specialized: React.ReactNode) => React.ReactNode;
}) {
  return (
    <EditorialSection
      number="06"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Dress Code"
          placeholder="Add heading"
          label="Dress code heading"
        />
      }
      renderFlow={renderFlow}
    >
      <p className="max-w-2xl whitespace-pre-line text-xl leading-9">
        <EditableText
          sectionId={sectionId}
          path={["description"]}
          value={content.description}
          fallback="Attire guidance will be shared here."
          placeholder="Add description"
          label="Dress code description"
          multiline
        />
      </p>
    </EditorialSection>
  );
}
export function ModernEditorialPeople({
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
    presentation === "squareGrid"
      ? "mb-4 aspect-square w-full"
      : presentation === "minimal"
        ? "mb-3 aspect-square w-16 rounded-full"
        : "mb-4 aspect-[4/5] w-full";
  return (
    <EditorialSection
      number="07"
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
    >
      {groups.length > 0 ? (
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {groups.map((group, index) => (
            <section
              className={`${index % 2 ? "md:translate-y-8" : ""} border-t-2 border-[var(--me-theme-text)] pt-4`}
              key={group.id}
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--me-text)]">
                {group.name}
              </h3>
              <ul
                className={`mt-6 ${imagesVisible && group.people.some((person) => person.media && media[person.media.assetId]) ? (presentation === "minimal" ? "space-y-5" : "grid grid-cols-2 gap-5") : "space-y-4"}`}
              >
                {group.people.map((person) => {
                  const asset =
                    imagesVisible && person.media
                      ? media[person.media.assetId]
                      : undefined;
                  return (
                    <li
                      className={
                        presentation === "minimal" && asset
                          ? "grid grid-cols-[4rem_1fr] items-center gap-4"
                          : ""
                      }
                      key={person.id}
                    >
                      {asset && person.media && (
                        <ZoomedMediaImage
                          className={imageClass}
                          height={asset.web.height}
                          reference={person.media}
                          src={asset.web.url}
                          width={asset.web.width}
                        />
                      )}
                      <span>
                        <span className="block font-[family-name:var(--me-heading-font)] text-2xl text-[var(--me-text)]">
                          {person.name}
                        </span>
                        {person.role && (
                          <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-[var(--me-section-accent)]">
                            {person.role}
                          </span>
                        )}
                      </span>
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
    </EditorialSection>
  );
}
export function ModernEditorialGallery({
  sectionId,
  content,
  mode,
}: {
  sectionId: string;
  content: GalleryContent;
  mode: "editor" | "public";
}) {
  return (
    <EditorialSection
      number="08"
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
        <div className="border-y border-dashed border-[var(--me-border)] py-10 text-xs uppercase tracking-widest">
          Photos will appear here
        </div>
      )}
    </EditorialSection>
  );
}
export function ModernEditorialFaq({
  sectionId,
  content,
}: {
  sectionId: string;
  content: FaqContent;
}) {
  return (
    <EditorialSection
      number="09"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Questions"
          placeholder="Add heading"
          label="FAQ heading"
        />
      }
    >
      {content.items.length ? (
        <div>
          {content.items.map((item, index) => (
            <div
              className="grid gap-3 border-t border-[var(--me-border)] py-6 sm:grid-cols-[1fr_1.5fr]"
              key={index}
            >
              <h3 className="font-[family-name:var(--me-heading-font)] text-xl">
                <EditableText
                  sectionId={sectionId}
                  path={["items", index, "question"]}
                  value={item.question}
                  fallback="Question"
                  placeholder="Add question"
                  label={`FAQ ${index + 1} question`}
                />
              </h3>
              <p className="whitespace-pre-line">
                <EditableText
                  sectionId={sectionId}
                  path={["items", index, "answer"]}
                  value={item.answer}
                  placeholder="Add answer"
                  label={`FAQ ${index + 1} answer`}
                  multiline
                />
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyCopy>Helpful details will appear here.</EmptyCopy>
      )}
    </EditorialSection>
  );
}
export function ModernEditorialRsvp({
  sectionId,
  content,
}: {
  sectionId: string;
  content: RsvpContent;
}) {
  return (
    <EditorialSection
      number="10"
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
      <p className="max-w-xl whitespace-pre-line text-lg">
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
        className="mt-10 inline-block border-2 border-[var(--me-theme-text)] px-8 py-4 text-xs font-bold uppercase tracking-[0.22em]"
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
    </EditorialSection>
  );
}

function EditorialSection({
  number,
  eyebrow,
  heading,
  children,
  tabletEditorial = false,
  eyebrowParticipates,
  headingParticipates = true,
  bodyParticipates = true,
  renderFlow,
}: {
  number: string | null;
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  children: React.ReactNode;
  tabletEditorial?: boolean;
  eyebrowParticipates?: boolean;
  headingParticipates?: boolean;
  bodyParticipates?: boolean;
  renderFlow?: (specialized: React.ReactNode) => React.ReactNode;
}) {
  const hasEyebrow = eyebrowParticipates ?? Boolean(eyebrow);
  return (
    <SectionContentInset
      className=""
      style={{ boxShadow: "var(--me-frame)" }}
    >
      {(() => { const specialized = <div
        className={
          !number
            ? "block"
            : tabletEditorial
            ? "grid grid-cols-[3rem_minmax(0,1fr)] gap-5"
            : "grid gap-9 sm:grid-cols-[5rem_1fr]"
        }
      >
        {number && <p className="text-[10px] font-bold tracking-[0.25em]" aria-hidden="true">{number} / 10</p>}
        <div className={tabletEditorial ? "min-w-0" : ""}>
          {hasEyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--me-section-accent)]">{eyebrow}</p>}
          {headingParticipates && <h2
            data-section-heading
            className={`max-w-3xl font-[family-name:var(--me-heading-font)] text-4xl leading-none tracking-[-0.035em] sm:text-6xl ${hasEyebrow ? "mt-4" : ""}`}
          >
            {heading}
          </h2>}
          {bodyParticipates && <div
            data-section-body
            className={`text-sm leading-7 text-[var(--me-muted)] ${hasEyebrow || headingParticipates ? "mt-12" : ""}`}
          >
            {children}
          </div>}
        </div>
      </div>; return renderFlow ? renderFlow(specialized) : specialized; })()}
    </SectionContentInset>
  );
}
function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="italic text-[var(--me-muted)]">{children}</p>;
}
