import type {
  DateContent,
  DressCodeContent,
  FaqContent,
  GalleryContent,
  HeroContent,
  PeopleContent,
  ResolvedWebsiteMedia,
  ResponsiveViewport,
  RsvpContent,
  ScheduleContent,
  SectionMedia,
  StoryContent,
  VenueContent,
  WebsiteSection,
} from "../../websiteEditor/types";
import { formatDateOnly } from "../formatDateOnly";
import type { WebsiteRendererProps } from "../types";
import { ZoomedMediaImage } from "../ZoomedMediaImage";
import { storyElementMedia } from "../../websiteEditor/storyMedia";
import {
  ClassicFilipinianaDate,
  ClassicFilipinianaDressCode,
  ClassicFilipinianaFaq,
  ClassicFilipinianaGallery,
  ClassicFilipinianaHero,
  ClassicFilipinianaPeople,
  ClassicFilipinianaRsvp,
  ClassicFilipinianaSchedule,
  ClassicFilipinianaStoryBlock,
  ClassicFilipinianaStoryHeader,
  ClassicFilipinianaVenue,
} from "./classicFilipiniana/sections";
import { resolveClassicFilipinianaSectionAppearance } from "./classicFilipiniana/appearance";
import { resolveClassicFilipinianaDesign } from "./classicFilipiniana/design";
import {
  ClassicFrameCorners,
  ClassicSectionDivider,
} from "./classicFilipiniana/decorations";
import { resolveSectionDesignTokens } from "../../websiteTemplates/design/catalogs";
import { NarrativeBlockFrame } from "../NarrativeBlockFrame";
import { resolveNarrativeComposition } from "../narrativeComposition";
import { resolveNarrativeMediaCornerStyle } from "../narrativeMediaAppearance";
import type { ElementCapability } from "../../websiteCapabilities/types";
import { resolveEffectiveStorySequence } from "../storyEffectiveSequence";
import { resolveStoryRenderItems } from "../storyRenderSequence";
import { SectionDecorativeLayers } from "../SectionDecorativeLayers";
import { SectionChildFlowRenderer } from "../SectionChildFlowRenderer";

export function ClassicFilipinianaRenderer({
  event,
  website,
  mode = "public",
  selectedSectionId,
  onSectionSelect,
  targetViewport = "desktop",
  scope = { kind: "full" },
  selectedNarrativeBlockId,
  onNarrativeBlockSelect,
  selectedElementId,
  onElementSelect,
  onElementEdit,
}: WebsiteRendererProps) {
  const narrativeCapability = website.template!.capabilities.elementCapabilities.find(({ type }) => type === "narrativeBlock");
  const candidates =
    scope.kind === "single-section"
      ? website.sections
          .map((section, index) => ({ section, index }))
          .filter(({ section }) => section.id === scope.sectionId)
      : website.sections
          .map((section, index) => ({ section, index }))
          .filter(({ section }) => section.isEnabled);
  const sections = candidates.filter(({ section }) => {
    if (mode === "editor" || section.type !== "story") return true;
    const content = section.content as StoryContent;
    return resolveEffectiveStorySequence({
      content,
      capability: narrativeCapability?.narrativeBlock?.composition,
      isMediaRenderable: (block) => {
        const reference = storyElementMedia(content, block);
        return Boolean(reference && website.media[reference.assetId]);
      },
    }).length > 0;
  });

  return (
    <article
      className="min-h-full bg-[var(--cf-page)] font-[family-name:var(--cf-body-font)] text-[var(--cf-text)]"
      style={resolveClassicFilipinianaDesign(website.designSettings)}
    >
      {mode === "editor" && sections.length === 0 && (
        <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm italic text-[var(--cf-muted)]">
          {scope.kind === "single-section"
            ? "Select a section to edit."
            : "Enabled sections will appear here."}
        </div>
      )}
      {sections.map(({ section }, renderedIndex) => (
        <ClassicSection
          key={section.id}
          section={section}
          showLeadingDivider={scope.kind === "full" && renderedIndex > 0}
          eventName={event.name}
          eventDate={event.eventDate}
          mode={mode}
          media={website.media}
          targetViewport={targetViewport}
          library={website.template!.capabilities.designLibrary}
          narrativeCapability={narrativeCapability}
          designSettings={website.designSettings}
          templateKey={website.templateKey}
          selected={mode === "editor" && selectedSectionId === section.id}
          onSelect={onSectionSelect}
          selectedNarrativeBlockId={selectedNarrativeBlockId}
          onNarrativeBlockSelect={onNarrativeBlockSelect}
          selectedElementId={selectedElementId}
          onElementSelect={onElementSelect}
          onElementEdit={onElementEdit}
        />
      ))}
    </article>
  );
}

function ClassicSection({
  section,
  showLeadingDivider,
  eventName,
  eventDate,
  mode,
  media,
  targetViewport,
  library,
  narrativeCapability,
  designSettings,
  templateKey,
  selected,
  onSelect,
  selectedNarrativeBlockId,
  onNarrativeBlockSelect,
  selectedElementId,
  onElementSelect,
  onElementEdit,
}: {
  section: WebsiteSection;
  showLeadingDivider: boolean;
  eventName: string;
  eventDate: string | null;
  mode: "editor" | "public";
  media: Record<string, ResolvedWebsiteMedia>;
  targetViewport: ResponsiveViewport;
  library: NonNullable<
    WebsiteRendererProps["website"]["template"]
  >["capabilities"]["designLibrary"];
  narrativeCapability?: ElementCapability;
  designSettings: WebsiteRendererProps["website"]["designSettings"];
  templateKey: string;
  selected: boolean;
  onSelect?: (sectionId: string) => void;
  selectedNarrativeBlockId?: string | null;
  onNarrativeBlockSelect?: (blockId: string) => void;
  selectedElementId?: string | null;
  onElementSelect?: (sectionId: string, elementId: string) => void;
  onElementEdit?: (sectionId: string, elementId: string) => void;
}) {
  const appearance = resolveClassicFilipinianaSectionAppearance(
    section.type,
    designSettings,
    section.appearance,
    library,
    designSettings.customColors,
  );
  const design = resolveSectionDesignTokens(
    templateKey,
    library,
    section.resolvedDesignContext,
  );
  return (
    <section
      className={`${appearance.sectionClass} relative cursor-default font-[family-name:var(--cf-body-font)] transition-shadow ${section.type === "story" ? "isolate" : ""} ${selected ? "z-10" : ""}`}
      style={
        {
          ...appearance.sectionStyle,
          ...(design
            ? {
                "--cf-heading-font": design.headingFont,
                "--cf-body-font": design.bodyFont,
                "--cf-text": design.headingColor,
                "--cf-muted": design.bodyColor,
                "--cf-section-body": design.bodyColor,
                "--cf-section-accent": design.accentColor,
              }
            : {}),
        } as React.CSSProperties
      }
      data-preview-section={section.id}
      data-section-surface
      onClick={mode === "editor" ? () => onSelect?.(section.id) : undefined}
      onKeyDown={
        mode === "editor"
          ? (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(section.id);
              }
            }
          : undefined
      }
      role={mode === "editor" ? "group" : undefined}
      aria-label={
        mode === "editor" ? `${section.displayName} section` : undefined
      }
      tabIndex={mode === "editor" ? 0 : undefined}
    >
      {section.type === "story" ? <><SectionDecorativeLayers templateKey={templateKey} appearance={section.appearance.decorativeAppearance} viewport={targetViewport} /><div className="relative z-10">{showLeadingDivider && <ClassicSectionDivider />}<Section
        section={section}
        eventName={eventName}
        eventDate={eventDate}
        mode={mode}
        media={media}
        targetViewport={targetViewport}
        library={library}
        projectColors={designSettings.customColors}
        narrativeCapability={narrativeCapability}
        selectedNarrativeBlockId={selectedNarrativeBlockId}
        onNarrativeBlockSelect={onNarrativeBlockSelect}
        selectedElementId={selectedElementId}
        onElementSelect={onElementSelect}
        onElementEdit={onElementEdit}
      /></div></> : <>{showLeadingDivider && <ClassicSectionDivider />}<Section section={section} eventName={eventName} eventDate={eventDate} mode={mode} media={media} targetViewport={targetViewport} library={library} projectColors={designSettings.customColors} narrativeCapability={narrativeCapability} selectedNarrativeBlockId={selectedNarrativeBlockId} onNarrativeBlockSelect={onNarrativeBlockSelect} selectedElementId={selectedElementId} onElementSelect={onElementSelect} onElementEdit={onElementEdit} /></>}
    </section>
  );
}

function Section({
  section,
  eventName,
  eventDate,
  mode,
  media,
  targetViewport,
  library,
  projectColors,
  narrativeCapability,
  selectedNarrativeBlockId,
  onNarrativeBlockSelect,
  selectedElementId,
  onElementSelect,
  onElementEdit,
}: {
  section: WebsiteSection;
  eventName: string;
  eventDate: string | null;
  mode: "editor" | "public";
  media: Record<string, ResolvedWebsiteMedia>;
  targetViewport: ResponsiveViewport;
  library: NonNullable<
    WebsiteRendererProps["website"]["template"]
  >["capabilities"]["designLibrary"];
  projectColors: WebsiteRendererProps["website"]["designSettings"]["customColors"];
  narrativeCapability?: ElementCapability;
  selectedNarrativeBlockId?: string | null;
  onNarrativeBlockSelect?: (blockId: string) => void;
  selectedElementId?: string | null;
  onElementSelect?: (sectionId: string, elementId: string) => void;
  onElementEdit?: (sectionId: string, elementId: string) => void;
}) {
  const presentation =
    section.appearance.presentation ?? section.presentationCapability?.default;
  const present = (content: React.ReactNode) => (
    <ClassicMediaPresentation
      section={section}
      media={media}
      presentation={presentation}
      targetViewport={targetViewport}
    >
      {content}
    </ClassicMediaPresentation>
  );
  const childFlow = (flow: DateContent["childFlow"] | DressCodeContent["childFlow"]) => flow?.elements.length
    ? (specialized: React.ReactNode) => <SectionChildFlowRenderer media={media} sectionId={section.id} flow={flow} specialized={specialized} mode={mode} viewport={targetViewport} templateKey="classic-filipiniana-v1" library={library} projectColors={projectColors} context={section.resolvedDesignContext} selectedElementId={selectedElementId} onElementSelect={onElementSelect} onElementEdit={onElementEdit} />
    : undefined;
  switch (section.type) {
    case "hero":
      return present(
        <ClassicFilipinianaHero
          sectionId={section.id}
          eventName={eventName}
          content={section.content as HeroContent}
        />,
      );
    case "date": {
      const content = section.content as DateContent;
      return (
        <ClassicFilipinianaDate
          sectionId={section.id}
          date={formatDateOnly(eventDate)}
          content={content}
          renderFlow={childFlow(content.childFlow)}
        />
      );
    }
    case "story": {
      const content = section.content as StoryContent;
      const contract = narrativeCapability?.narrativeBlock?.composition;
      const isMediaRenderable = (block: StoryContent["elements"][number]) => {
        const reference = storyElementMedia(content, block);
        return Boolean(reference && media[reference.assetId]);
      };
      const effectiveSequence = resolveEffectiveStorySequence({ content, capability: contract, isMediaRenderable });
      const renderItems = resolveStoryRenderItems(content, effectiveSequence, mode);
      return (
        <>
          {renderItems.map((item) => {
            if (item.kind === "singletonRun") return <ClassicFilipinianaStoryHeader key={item.references.join("|")} sectionId={section.id} content={content} mode={mode} fields={item.fields} library={library} projectColors={projectColors} context={section.resolvedDesignContext ?? undefined} viewport={targetViewport} />;
            const block = item.block;
            const index = content.elements.findIndex(({ id }) => id === block.id);
            if (block.isHidden && mode === "public") return null;
            if (block.isHidden)
              return (
                <NarrativeBlockFrame
                  key={block.id}
                  mode={mode}
                  blockId={block.id}
                  selected={selectedNarrativeBlockId === block.id}
                  onSelect={onNarrativeBlockSelect}
                >
                  <div className="border-y border-dashed border-[var(--cf-border)] px-7 py-8 text-center text-xs text-[var(--cf-muted)]">
                    Hidden Narrative Block - select to restore from Content.
                  </div>
                </NarrativeBlockFrame>
              );
            if (!contract) return null;
            const effective = item.effective;
            const composition = effective?.composition ?? resolveNarrativeComposition({ block, capability: contract, mediaRenderable: isMediaRenderable(block) });
            const hasRenderableSlot = Object.values(
              composition.rendering.slots,
            ).some(Boolean);
            if (!hasRenderableSlot && mode === "public") return null;
            const showBoundary = effective?.choreography.previousKind === "narrative";
            const reference = storyElementMedia(content, block);
            const asset = reference ? media[reference.assetId] : undefined;
            const mediaNode =
              reference && asset ? (
                <ZoomedMediaImage
                  className="block max-h-[42rem] w-full object-cover"
                  height={asset.web.height}
                  reference={reference}
                  src={asset.web.url}
                  width={asset.web.width}
                />
              ) : undefined;
            return (
              <NarrativeBlockFrame
                key={block.id}
                mode={mode}
                blockId={block.id}
                selected={selectedNarrativeBlockId === block.id}
                onSelect={onNarrativeBlockSelect}
                preservePublicWrapper
                className="relative"
              >
                {showBoundary && <ClassicSectionDivider />}
                <ClassicFilipinianaStoryBlock
                  sectionId={section.id}
                  block={block}
                  index={index}
                  library={library}
                  projectColors={projectColors}
                  viewport={targetViewport}
                  context={section.resolvedDesignContext ?? undefined}
                  composition={composition}
                  mediaCornerStyle={resolveNarrativeMediaCornerStyle(block, narrativeCapability!.narrativeBlock!)}
                  mediaFrameStyles={narrativeCapability!.narrativeBlock!.appearance.media.frameStyles}
                  mediaFrameColorIds={narrativeCapability!.narrativeBlock!.appearance.media.frameColorIds}
                  defaultMediaFrameStyle={narrativeCapability!.narrativeBlock!.appearance.media.defaultFrameStyle}
                  media={mediaNode}
                  mode={mode}
                  choreography={effective?.choreography}
                />
              </NarrativeBlockFrame>
            );
          })}
        </>
      );
    }
    case "schedule":
      return (
        <ClassicFilipinianaSchedule
          sectionId={section.id}
          content={section.content as ScheduleContent}
        />
      );
    case "venue":
      return present(
        <ClassicFilipinianaVenue
          sectionId={section.id}
          content={section.content as VenueContent}
        />,
      );
    case "dressCode": {
      const content = section.content as DressCodeContent;
      return (
        <ClassicFilipinianaDressCode
          sectionId={section.id}
          content={content}
          renderFlow={childFlow(content.childFlow)}
        />
      );
    }
    case "people":
      return (
        <ClassicFilipinianaPeople
          sectionId={section.id}
          content={section.content as PeopleContent}
          mode={mode}
          media={media}
          showMedia={section.itemMediaCapability?.itemType === "person"}
          presentation={presentation ?? "medallions"}
        />
      );
    case "gallery":
      return (
        <ClassicFilipinianaGallery
          sectionId={section.id}
          content={section.content as GalleryContent}
          mode={mode}
        />
      );
    case "faq":
      return (
        <ClassicFilipinianaFaq
          sectionId={section.id}
          content={section.content as FaqContent}
        />
      );
    case "rsvp":
      return (
        <ClassicFilipinianaRsvp
          sectionId={section.id}
          content={section.content as RsvpContent}
        />
      );
    default:
      return mode === "editor" ? (
        <div className="px-6 py-10 text-center text-sm text-[var(--cf-muted)]">
          This section is not supported by this Template renderer.
        </div>
      ) : null;
  }
}

function ClassicMediaPresentation({
  section,
  media,
  presentation,
  targetViewport,
  children,
  mediaReference: mediaReferenceOverride,
  alternate = false,
  mobileStoryHeading,
  mobileStoryBody,
}: {
  section: WebsiteSection;
  media: Record<string, ResolvedWebsiteMedia>;
  presentation?: string;
  targetViewport: ResponsiveViewport;
  children: React.ReactNode;
  mediaReference?: SectionMedia;
  alternate?: boolean;
  mobileStoryHeading?: React.ReactNode;
  mobileStoryBody?: React.ReactNode;
}) {
  const reference =
    mediaReferenceOverride === undefined
      ? (section.content as { media?: SectionMedia }).media
      : mediaReferenceOverride;
  const asset = reference ? media[reference.assetId] : undefined;
  if (!section.mediaCapability || !asset) return <>{children}</>;
  const mediaReference = reference as NonNullable<SectionMedia>;
  const controls = section.presentationCapability?.options.find(
    (option) => option.key === presentation,
  )?.mediaControls;
  const value = (
    setting: keyof typeof section.appearance,
    group:
      | "mediaPlacements"
      | "mediaSizes"
      | "frameStyles"
      | "cornerStyles"
      | "shadowStyles"
      | "foregroundColors",
  ) => section.appearance[setting] ?? controls?.[group]?.default;
  const configuredPlacement = value("mediaPlacement", "mediaPlacements");
  const placement =
    alternate && configuredPlacement === "left"
      ? "right"
      : alternate && configuredPlacement === "right"
        ? "left"
        : configuredPlacement;
  const size = value("mediaSize", "mediaSizes");
  const frame = value("frameStyle", "frameStyles");
  const corner = value("cornerStyle", "cornerStyles");
  const shadow = value("shadowStyle", "shadowStyles");
  const spacing =
    section.appearance.mediaSpacing ?? controls?.mediaSpacing?.default;
  const contentGap =
    section.appearance.mediaContentGap ?? controls?.mediaContentGaps?.default;
  const spacingValue = (side: "top" | "right" | "bottom" | "left") =>
    spacing?.[side] ?? "medium";
  const spacingClass = `${spacingValue("top") === "none" ? "" : spacingValue("top") === "small" ? "pt-2 sm:pt-3" : spacingValue("top") === "large" ? "pt-5 sm:pt-10" : "pt-3 sm:pt-6"} ${spacingValue("right") === "none" ? "" : spacingValue("right") === "small" ? "pr-2 sm:pr-3" : spacingValue("right") === "large" ? "pr-5 sm:pr-10" : "pr-3 sm:pr-6"} ${spacingValue("bottom") === "none" ? "" : spacingValue("bottom") === "small" ? "pb-2 sm:pb-3" : spacingValue("bottom") === "large" ? "pb-5 sm:pb-10" : "pb-3 sm:pb-6"} ${spacingValue("left") === "none" ? "" : spacingValue("left") === "small" ? "pl-2 sm:pl-3" : spacingValue("left") === "large" ? "pl-5 sm:pl-10" : "pl-3 sm:pl-6"}`;
  const venueSpacingClass = `${spacingValue("top") === "none" ? "" : spacingValue("top") === "small" ? "pt-2 md:pt-3" : spacingValue("top") === "large" ? "pt-5 md:pt-8 xl:pt-10" : "pt-3 md:pt-5 xl:pt-6"} ${spacingValue("right") === "none" ? "" : spacingValue("right") === "small" ? "pr-2 md:pr-3" : spacingValue("right") === "large" ? "pr-5 md:pr-8 xl:pr-10" : "pr-3 md:pr-5 xl:pr-6"} ${spacingValue("bottom") === "none" ? "" : spacingValue("bottom") === "small" ? "pb-2 md:pb-3" : spacingValue("bottom") === "large" ? "pb-5 md:pb-8 xl:pb-10" : "pb-3 md:pb-5 xl:pb-6"} ${spacingValue("left") === "none" ? "" : spacingValue("left") === "small" ? "pl-2 md:pl-3" : spacingValue("left") === "large" ? "pl-5 md:pl-8 xl:pl-10" : "pl-3 md:pl-5 xl:pl-6"}`;
  const effectiveSpacingClass = section.type === "venue" ? venueSpacingClass : spacingClass;
  const gapClass =
    contentGap === "tight"
      ? "gap-3 sm:gap-4"
      : contentGap === "spacious"
        ? "gap-9 sm:gap-12"
        : contentGap === "generous"
          ? "gap-12 sm:gap-16"
          : "gap-6 sm:gap-8";
  const venueGapClass = contentGap === "tight" ? "gap-3 md:gap-4 xl:gap-5" : contentGap === "spacious" ? "gap-7 md:gap-9 xl:gap-12" : contentGap === "generous" ? "gap-8 md:gap-12 xl:gap-16" : "gap-5 md:gap-6 xl:gap-8";
  const effectiveGapClass = section.type === "venue" ? venueGapClass : gapClass;
  const frameClass =
    frame === "fineLine"
      ? "after:pointer-events-none after:absolute after:inset-1 after:z-10 after:border after:border-[var(--cf-border)] after:content-[''] after:[border-radius:inherit]"
      : frame === "doubleLine"
        ? "before:pointer-events-none before:absolute before:inset-1 before:z-10 before:border before:border-[var(--cf-border)] before:content-[''] before:[border-radius:inherit] after:pointer-events-none after:absolute after:inset-3 after:z-10 after:border after:border-[color-mix(in_srgb,var(--cf-border)_75%,transparent)] after:content-[''] after:[border-radius:inherit]"
        : frame === "heritage"
          ? "border-4 border-[var(--cf-accent)] after:pointer-events-none after:absolute after:inset-4 after:z-10 after:border after:border-[color-mix(in_srgb,var(--cf-accent)_70%,transparent)] after:shadow-[0_0_0_5px_color-mix(in_srgb,var(--cf-surface)_78%,transparent)] after:content-[''] after:[border-radius:inherit]"
          : frame === "inset"
            ? "after:pointer-events-none after:absolute after:inset-3 after:z-10 after:border-2 after:border-[var(--cf-surface)] after:shadow-[0_0_0_5px_color-mix(in_srgb,var(--cf-surface)_72%,transparent)] after:content-[''] after:[border-radius:inherit]"
            : "";
  const cornerClass =
    corner === "soft" ? "rounded-sm" : corner === "rounded" ? "rounded-xl" : "";
  const shadowClass =
    shadow === "subtle"
      ? "shadow-[0_2px_6px_-2px_rgb(44_31_23/24%)]"
      : shadow === "soft"
        ? "shadow-[0_10px_26px_-8px_rgb(44_31_23/30%)]"
        : shadow === "elevated"
          ? "shadow-[0_22px_48px_-12px_rgb(44_31_23/38%),0_8px_18px_-10px_rgb(44_31_23/24%)]"
          : "";
  const decorationSafeAreaClass = frame === "outset" ? "p-[10px]" : "";
  const sizing =
    size === "compact"
      ? "mx-auto w-3/4"
      : size === "balanced"
        ? "mx-auto w-[90%]"
        : "w-full";
  const image = (
    className: string,
    fill = false,
    applySizing = true,
    wrapperClassName = "",
  ) =>
    fill ? (
      <ZoomedMediaImage
        className={className}
        fill
        height={asset.web.height}
        reference={mediaReference}
        src={asset.web.url}
        width={asset.web.width}
      />
    ) : (
      <span
        className={`block ${applySizing ? sizing : "w-full"} ${effectiveSpacingClass} ${wrapperClassName}`}
      >
        <span className={`block w-full ${decorationSafeAreaClass}`}>
          <span
            className={`relative block w-full ${cornerClass} ${shadowClass}`}
          >
            <ClassicOuterFrameDecoration
              frame={typeof frame === "string" ? frame : undefined}
            />
            <ZoomedMediaImage
              className={`${className} relative z-[1] w-full ${frameClass} ${cornerClass}`}
              height={asset.web.height}
              reference={mediaReference}
              src={asset.web.url}
              width={asset.web.width}
            />
          </span>
        </span>
      </span>
    );
  const splitGrid = classicSplitGrid(
    typeof placement === "string" ? placement : "left",
    typeof size === "string" ? size : "balanced",
    targetViewport,
  );
  const effectiveSplitGrid = section.type === "venue" ? classicVenueSplitGrid(typeof placement === "string" ? placement : "left", typeof size === "string" ? size : "balanced", targetViewport) : splitGrid;
  const mediaOrder =
    placement === "right"
      ? semanticClass(targetViewport, "order-2", "order-2")
      : "";
  const copyOrder =
    placement === "right"
      ? semanticClass(targetViewport, "order-1", "order-1")
      : "";
  const splitAlignment = semanticClass(
    targetViewport,
    "items-center",
    "items-center",
  );
  const tabletContainedLayout =
    targetViewport === "tablet" &&
    (placement === "top" || placement === "bottom")
      ? resolveClassicTabletContainedLayout(
          section.type,
          presentation,
          typeof size === "string" ? size : "balanced",
        )
      : undefined;
  const tabletVertical = (media: React.ReactNode) => (
    <div
      className={`grid ${gapClass} [&_[data-section-specialized-content]]:min-h-0 ${classicTabletCopyRhythm(placement === "bottom" ? "bottom" : "top")}`}
    >
      {placement === "bottom" ? (
        <>
          {children}
          {media}
        </>
      ) : (
        <>
          {media}
          {children}
        </>
      )}
    </div>
  );

  if (
    section.type === "story" &&
    targetViewport === "mobile" &&
    mobileStoryBody !== undefined
  ) {
    const mobileWidth =
      size === "compact"
        ? "w-[78%]"
        : size === "feature"
          ? "w-full"
          : "w-[90%]";
    const imageClass =
      presentation === "portraitStory"
        ? "h-[clamp(18rem,58vw,32rem)]"
        : "max-h-[28rem]";
    const storyMedia = (
      <div className={`mx-auto ${mobileWidth}`}>
        {image(imageClass, false, false)}
      </div>
    );
    return (
      <div className={`grid py-12 text-center ${gapClass}`}>
        {mobileStoryHeading ? (
          <div className="px-7">{mobileStoryHeading}</div>
        ) : null}
        {storyMedia}
        <div className="px-7">{mobileStoryBody}</div>
      </div>
    );
  }

  if (presentation === "immersive" || presentation === "scenic") {
    const strength =
      section.appearance.overlayStrength ??
      controls?.overlayStrength?.default ??
      0.5;
    const foreground =
      value("foregroundColor", "foregroundColors") ?? "#FFFFFF";
    const immersiveHeight =
      section.type === "hero"
        ? "min-h-[100svh]"
        : "min-h-[32rem]";
    return (
      <div data-section-full-bleed className={`relative isolate overflow-hidden ${immersiveHeight}`}>
        {image("h-full", true)}
        <div
          data-section-full-bleed-foreground
          className={`relative grid place-items-stretch backdrop-blur-[1px] ${immersiveHeight} [&_[data-section-specialized-content]]:min-h-full`}
          style={
            {
              background: `linear-gradient(180deg, color-mix(in srgb, var(--cf-page) ${Math.round(strength * 65)}%, transparent), color-mix(in srgb, var(--cf-page) ${Math.round(strength * 100)}%, transparent))`,
              color: foreground,
              "--cf-text": foreground,
              "--cf-muted": foreground,
              "--cf-secondary": foreground,
              "--cf-section-accent": foreground,
              textShadow: "0 1px 20px rgb(0 0 0 / 24%)",
            } as React.CSSProperties
          }
        >
          {children}
        </div>
      </div>
    );
  }
  if (section.type === "story" && presentation === "portraitStory") {
    if (tabletContainedLayout)
      return tabletVertical(
        <div className={`mx-auto ${tabletContainedLayout.wrapperClass}`}>
          {image(tabletContainedLayout.imageClass, false, false)}
        </div>,
      );
    if (
      targetViewport === "tablet" &&
      (placement === "left" || placement === "right")
    ) {
      const columns = classicTabletSplitColumns(
        placement,
        typeof size === "string" ? size : "balanced",
      );
      const media = (
        <div className="min-w-0">{image("aspect-[8/5]", false, false)}</div>
      );
      const copy = (
        <div className="min-w-0 [&_[data-section-specialized-content]]:min-h-0 [&_[data-section-specialized-content]]:px-8 [&_[data-section-specialized-content]]:py-10">
          {children}
        </div>
      );
      return (
        <div className={`grid items-center ${columns} ${gapClass}`}>
          {placement === "right" ? (
            <>
              {copy}
              {media}
            </>
          ) : (
            <>
              {media}
              {copy}
            </>
          )}
        </div>
      );
    }
    if (targetViewport === "mobile") {
      const mobileWidth =
        size === "compact"
          ? "w-[78%]"
          : size === "feature"
            ? "w-full"
            : "w-[90%]";
      const media = (
        <div className={`mx-auto ${mobileWidth}`}>
          {image(
            "h-[clamp(18rem,58vw,32rem)] xl:h-[min(34rem,65vh)]",
            false,
            false,
          )}
        </div>
      );
      const copy = (
        <div className="[&_[data-section-specialized-content]]:py-12 sm:[&_[data-section-specialized-content]]:py-14">
          {children}
        </div>
      );
      return (
        <div className={`grid ${gapClass}`}>
          {placement === "top" ? (
            <>
              {media}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {media}
            </>
          )}
        </div>
      );
    }
    const media = image(
      "h-[clamp(18rem,58vw,32rem)] xl:h-[min(34rem,65vh)]",
      false,
      false,
      mediaOrder,
    );
    const copy = (
      <div
        className={`[&_[data-section-specialized-content]]:py-12 sm:[&_[data-section-specialized-content]]:py-14 ${copyOrder}`}
      >
        {children}
      </div>
    );
    if (placement === "top" || placement === "bottom")
      return (
        <div className={`grid ${gapClass}`}>
          {placement === "top" ? (
            <>
              {media}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {media}
            </>
          )}
        </div>
      );
    return (
      <div className={`grid ${splitAlignment} ${gapClass} ${splitGrid}`}>
        {media}
        {copy}
      </div>
    );
  }
  if (presentation === "detailsFirst") {
    if (section.type === "venue" && targetViewport === "mobile") {
      const venueMedia = <div className="min-w-0">{image("aspect-[4/3] max-h-[24rem] object-cover", false, false)}</div>;
      const mediaFirst = placement === "top" || placement === "left";
      return <div data-venue-composition="stacked" className={`grid min-w-0 ${effectiveGapClass}`}>{mediaFirst ? <>{venueMedia}{children}</> : <>{children}{venueMedia}</>}</div>;
    }
    if (tabletContainedLayout)
      return tabletVertical(
        <div className={`mx-auto ${tabletContainedLayout.wrapperClass}`}>
          {image(tabletContainedLayout.imageClass, false, false)}
        </div>,
      );
    if (
      targetViewport === "tablet" &&
      (placement === "left" || placement === "right")
    ) {
      const columns = classicTabletSplitColumns(
        placement,
        typeof size === "string" ? size : "balanced",
      );
      const media = (
        <div className="min-w-0 self-center">
          {image("aspect-video", false, false)}
        </div>
      );
      const copy = (
        <div className="min-w-0 [&_[data-section-specialized-content]]:min-h-0 [&_[data-section-specialized-content]]:px-8 [&_[data-section-specialized-content]]:py-10">
          {children}
        </div>
      );
      return (
        <div data-venue-composition={section.type === "venue" ? "split" : undefined} className={`grid min-w-0 ${columns} ${effectiveGapClass}`}>
          {placement === "right" ? (
            <>
              {copy}
              {media}
            </>
          ) : (
            <>
              {media}
              {copy}
            </>
          )}
        </div>
      );
    }
    if (targetViewport === "mobile") {
      const mobileWidth =
        size === "compact"
          ? "w-[78%]"
          : size === "feature"
            ? "w-full"
            : "w-[90%]";
      const media = (
        <div className={`mx-auto ${mobileWidth}`}>
          {image("aspect-video", false, false)}
        </div>
      );
      return (
        <div className={`grid ${gapClass}`}>
          {placement === "top" ? (
            <>
              {media}
              {children}
            </>
          ) : (
            <>
              {children}
              {media}
            </>
          )}
        </div>
      );
    }
    if (
      targetViewport === "desktop" &&
      (placement === "left" || placement === "right")
    ) {
      const media = (
        <div className={`min-w-0 self-center ${mediaOrder}`}>
          {image("aspect-video", false, false)}
        </div>
      );
      const copy = <div className={`min-w-0 ${copyOrder}`}>{children}</div>;
      return (
        <div data-venue-composition={section.type === "venue" ? "split" : undefined} className={`grid min-w-0 ${effectiveGapClass} ${effectiveSplitGrid}`}>
          {media}
          {copy}
        </div>
      );
    }
    const media = image(
      "h-full min-h-[24rem] max-h-[42rem]",
      false,
      false,
      mediaOrder,
    );
    const copy = <div className={copyOrder}>{children}</div>;
    if (placement === "top" || placement === "bottom")
      return (
        <div className={`grid ${effectiveGapClass}`}>
          {placement === "top" ? (
            <>
              {media}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {media}
            </>
          )}
        </div>
      );
    return (
      <div className={`grid items-stretch ${effectiveGapClass} ${effectiveSplitGrid}`}>
        {media}
        {copy}
      </div>
    );
  }
  if (section.type === "story" && presentation === "textFirst") {
    if (tabletContainedLayout)
      return tabletVertical(
        <div className={`mx-auto ${tabletContainedLayout.wrapperClass}`}>
          {image(tabletContainedLayout.imageClass, false, false)}
        </div>,
      );
    const media =
      targetViewport === "mobile" ? (
        <div className="w-full">{image("max-h-[28rem]")}</div>
      ) : (
        <div className="mx-auto max-w-3xl px-7">{image("max-h-[28rem]")}</div>
      );
    return (
      <div
        className={`grid [&_[data-section-specialized-content]]:py-10 sm:[&_[data-section-specialized-content]]:py-12 ${gapClass}`}
      >
        {placement === "top" ? (
          <>
            {media}
            {children}
          </>
        ) : (
          <>
            {children}
            {media}
          </>
        )}
      </div>
    );
  }
  if (
    section.type === "hero" &&
    presentation === "classic" &&
    (placement === "left" || placement === "right")
  ) {
    const tabletLayout =
      targetViewport === "tablet"
        ? resolveClassicHeroTabletLayout(
            placement,
            typeof size === "string" ? size : "balanced",
          )
        : undefined;
    const stackedSizing =
      targetViewport !== "mobile"
        ? "w-full"
        : size === "compact"
          ? "mx-auto w-3/4"
          : size === "balanced"
            ? "mx-auto w-[90%]"
            : "w-full";
    const media = (
      <div className={tabletLayout?.mediaWrapperClass ?? stackedSizing}>
        {image(
          tabletLayout?.imageClass ?? "h-[min(68vh,clamp(18rem,40vw,38rem))]",
          false,
          false,
        )}
      </div>
    );
    return (
      <div
        className={`grid items-center ${gapClass} ${tabletLayout?.compositionClass ?? splitGrid}`}
      >
        {placement === "right" ? (
          <>
            {children}
            {media}
          </>
        ) : (
          <>
            {media}
            {children}
          </>
        )}
      </div>
    );
  }
  if (section.type === "hero" && presentation === "classic") {
    const tabletLayout = tabletContainedLayout;
    const layout =
      tabletLayout ??
      classicHeroVerticalMedia(
        typeof size === "string" ? size : "balanced",
        targetViewport,
      );
    const media = (
      <div className={`mx-auto ${layout.wrapperClass}`}>
        {image(layout.imageClass, false, false)}
      </div>
    );
    if (tabletLayout) return tabletVertical(media);
    const mobileCopyRhythm =
      placement === "bottom"
        ? "[&_[data-section-specialized-content]]:pb-0 [&_[data-section-specialized-content]]:pt-8"
        : "[&_[data-section-specialized-content]]:pb-8 [&_[data-section-specialized-content]]:pt-0";
    const desktopCopyRhythm =
      placement === "bottom"
        ? "[&_[data-section-specialized-content]]:pb-0 [&_[data-section-specialized-content]]:pt-16"
        : "[&_[data-section-specialized-content]]:pb-16 [&_[data-section-specialized-content]]:pt-0";
    const verticalRhythm =
      targetViewport === "mobile" ? mobileCopyRhythm : desktopCopyRhythm;
    return (
      <div
        className={`grid ${verticalRhythm} ${gapClass} [&_[data-section-specialized-content]]:min-h-0`}
      >
        {placement === "bottom" ? (
          <>
            {children}
            {media}
          </>
        ) : (
          <>
            {media}
            {children}
          </>
        )}
      </div>
    );
  }
  const fallbackMedia = (
    <div className="mx-auto mt-8 max-w-4xl px-6">{image("max-h-[34rem]")}</div>
  );
  return (
    <div className={`grid ${gapClass}`}>
      {placement === "bottom" ? (
        <>
          {children}
          {fallbackMedia}
        </>
      ) : (
        <>
          {fallbackMedia}
          {children}
        </>
      )}
    </div>
  );
}

function semanticClass(
  viewport: ResponsiveViewport,
  tablet: string,
  desktop: string,
): string {
  return viewport === "tablet" ? tablet : viewport === "desktop" ? desktop : "";
}

function classicSplitGrid(
  placement: string,
  size: string,
  viewport: ResponsiveViewport,
): string {
  const tablet =
    placement === "right"
      ? size === "compact"
        ? "grid-cols-[1.2fr_0.8fr]"
        : size === "feature"
          ? "grid-cols-[0.9fr_1.1fr]"
          : "grid-cols-2"
      : size === "compact"
        ? "grid-cols-[0.8fr_1.2fr]"
        : size === "feature"
          ? "grid-cols-[1.1fr_0.9fr]"
          : "grid-cols-2";
  const desktop =
    placement === "right"
      ? size === "compact"
        ? "grid-cols-[1.3fr_0.7fr]"
        : size === "feature"
          ? "grid-cols-[0.85fr_1.15fr]"
          : "grid-cols-[1.1fr_0.9fr]"
      : size === "compact"
        ? "grid-cols-[0.7fr_1.3fr]"
        : size === "feature"
          ? "grid-cols-[1.15fr_0.85fr]"
          : "grid-cols-[0.9fr_1.1fr]";
  return viewport === "tablet" ? tablet : viewport === "desktop" ? desktop : "";
}

function classicVenueSplitGrid(placement: string, size: string, viewport: ResponsiveViewport): string {
  if (viewport === "mobile") return "";
  if (placement === "right") {
    if (size === "compact") return viewport === "desktop" ? "grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]" : "grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]";
    if (size === "feature") return viewport === "desktop" ? "grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]";
    return viewport === "desktop" ? "grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";
  }
  if (size === "compact") return viewport === "desktop" ? "grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]" : "grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]";
  if (size === "feature") return viewport === "desktop" ? "grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" : "grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]";
  return viewport === "desktop" ? "grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";
}

function classicTabletSplitColumns(placement: string, size: string): string {
  if (placement === "right") {
    if (size === "compact")
      return "grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]";
    if (size === "feature")
      return "grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]";
    return "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";
  }

  if (size === "compact") return "grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]";
  if (size === "feature")
    return "grid-cols-[minmax(0,0.56fr)_minmax(0,0.44fr)]";
  return "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";
}

function classicHeroVerticalMedia(
  size: string,
  viewport: ResponsiveViewport,
): { wrapperClass: string; imageClass: string } {
  if (viewport === "mobile") {
    if (size === "compact")
      return { wrapperClass: "w-[78%]", imageClass: "aspect-[4/3]" };
    if (size === "feature")
      return { wrapperClass: "w-full", imageClass: "aspect-[4/3]" };
    return { wrapperClass: "w-[90%]", imageClass: "aspect-[4/3]" };
  }
  if (viewport === "tablet") {
    if (size === "compact")
      return { wrapperClass: "w-[82%] max-w-2xl", imageClass: "aspect-[4/3]" };
    if (size === "feature")
      return { wrapperClass: "w-full", imageClass: "aspect-[4/3]" };
    return { wrapperClass: "w-[92%] max-w-3xl", imageClass: "aspect-[4/3]" };
  }
  if (size === "compact")
    return {
      wrapperClass: "w-[64%] max-w-3xl",
      imageClass: "h-[clamp(20rem,28vw,24rem)]",
    };
  if (size === "feature")
    return {
      wrapperClass: "w-full",
      imageClass: "h-[clamp(28rem,38vw,34rem)]",
    };
  return {
    wrapperClass: "w-[80%] max-w-4xl",
    imageClass: "h-[clamp(24rem,34vw,30rem)]",
  };
}

type ClassicHeroTabletLayout = {
  compositionClass: string;
  copyRhythmClass?: string;
  imageClass: string;
  mediaWrapperClass?: string;
  wrapperClass: string;
};

type ClassicTabletContainedLayout = Pick<
  ClassicHeroTabletLayout,
  "imageClass" | "wrapperClass"
>;

function resolveClassicTabletContainedLayout(
  sectionType: string,
  presentation: string | undefined,
  size: string,
): ClassicTabletContainedLayout | undefined {
  if (sectionType === "hero" && presentation === "classic") {
    const layout = resolveClassicHeroTabletLayout("top", size);
    return { imageClass: layout.imageClass, wrapperClass: layout.wrapperClass };
  }

  const widths =
    sectionType === "story" && presentation === "portraitStory"
      ? size === "compact"
        ? "w-[76%] max-w-2xl"
        : size === "feature"
          ? "w-full"
          : "w-[90%] max-w-3xl"
      : sectionType === "story" && presentation === "textFirst"
        ? size === "compact"
          ? "w-[78%] max-w-2xl"
          : size === "feature"
            ? "w-full"
            : "w-[92%] max-w-3xl"
        : sectionType === "venue" && presentation === "detailsFirst"
          ? size === "compact"
            ? "w-[78%] max-w-2xl"
            : size === "feature"
              ? "w-full"
              : "w-[92%] max-w-3xl"
          : undefined;

  if (!widths) return undefined;

  const imageClass =
    sectionType === "story" && presentation === "portraitStory"
      ? "aspect-[8/5]"
      : sectionType === "venue"
        ? "aspect-video"
        : "aspect-[4/3]";

  return { imageClass, wrapperClass: widths };
}

function classicTabletCopyRhythm(placement: "top" | "bottom"): string {
  return placement === "bottom"
    ? "[&_[data-section-specialized-content]]:pb-0 [&_[data-section-specialized-content]]:pt-12"
    : "[&_[data-section-specialized-content]]:pb-12 [&_[data-section-specialized-content]]:pt-0";
}

function resolveClassicHeroTabletLayout(
  placement: string,
  size: string,
): ClassicHeroTabletLayout {
  const imageClass = "aspect-[4/3]";

  if (placement === "left" || placement === "right") {
    const columns =
      placement === "right"
        ? size === "compact"
          ? "grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]"
          : size === "feature"
            ? "grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]"
            : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        : size === "compact"
          ? "grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]"
          : size === "feature"
            ? "grid-cols-[minmax(0,0.56fr)_minmax(0,0.44fr)]"
            : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";

    return {
      compositionClass: `${columns} [&_[data-section-specialized-content]]:min-h-0 [&_[data-section-specialized-content]]:py-12`,
      imageClass,
      mediaWrapperClass: "w-full",
      wrapperClass: "w-full",
    };
  }

  const wrapperClass =
    size === "compact"
      ? "w-[82%] max-w-2xl"
      : size === "feature"
        ? "w-full"
        : "w-[92%] max-w-3xl";

  return {
    compositionClass: "",
    copyRhythmClass:
      placement === "bottom"
        ? "[&_[data-section-specialized-content]]:pb-0 [&_[data-section-specialized-content]]:pt-12"
        : "[&_[data-section-specialized-content]]:pb-12 [&_[data-section-specialized-content]]:pt-0",
    imageClass,
    wrapperClass,
  };
}

function ClassicOuterFrameDecoration({ frame }: { frame?: string }) {
  if (frame === "outset")
    return (
      <span
        className="pointer-events-none absolute inset-0 z-[2] border border-[var(--cf-border)] outline-2 outline-offset-[8px] outline-[var(--cf-accent)] [border-radius:inherit]"
        aria-hidden="true"
      />
    );
  if (frame !== "ornamental") return null;
  return (
    <span
      className="pointer-events-none absolute inset-0 z-[2] outline outline-offset-4 outline-[var(--cf-accent)] [border-radius:inherit]"
      aria-hidden="true"
    >
      <span className="absolute inset-2 border border-[color-mix(in_srgb,var(--cf-accent)_65%,transparent)] [border-radius:inherit]" />
      <ClassicFrameCorners />
    </span>
  );
}
