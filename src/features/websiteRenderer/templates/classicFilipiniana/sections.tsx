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
import {
  ClassicBotanicalSprig,
  ClassicFoundationOrnament,
} from "./decorations";
import type { ResponsiveViewport } from "../../../websiteEditor/types";
import type {
  ResolvedDesignContext,
  TemplateDesignLibrary,
} from "../../../websiteCapabilities/types";
import {
  narrativeSlotCss,
  resolveNarrativeSlotAppearance,
  type NarrativeTextSlotKey,
} from "../../narrativeAppearance";
import { classicNarrativeTokens } from "../narrativeTokens";

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
      className="relative flex min-h-[34rem] flex-col items-center justify-center overflow-hidden px-8 py-20 text-center sm:py-24"
    >
      <ClassicBotanicalSprig className="absolute -bottom-4 -left-8 h-36 w-72 -rotate-6 sm:h-44 sm:w-80" />
      <ClassicBotanicalSprig className="absolute -right-8 -top-4 h-36 w-72 rotate-[174deg] sm:h-44 sm:w-80" />
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

export function ClassicFilipinianaDate({
  sectionId,
  date,
  content,
}: {
  sectionId: string;
  date: string | null;
  content: DateContent;
}) {
  return (
    <ContentSection
      eyebrow="Save the date"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Our Wedding Day"
          placeholder="Add heading"
          label="Date heading"
        />
      }
    >
      <p className="font-[family-name:var(--cf-heading-font)] text-2xl text-[var(--cf-text)]">
        {date ?? "Date to be announced"}
      </p>
      <p className="mt-4">
        <EditableText
          sectionId={sectionId}
          path={["description"]}
          value={content.description}
          placeholder="Add description"
          label="Date description"
          multiline
        />
      </p>
    </ContentSection>
  );
}

export function ClassicFilipinianaStoryHeader({
  sectionId,
  content,
  mode,
}: {
  sectionId: string;
  content: StoryContent;
  mode: "editor" | "public";
}) {
  return (
    <ContentSection
      botanical
      eyebrow="Our journey"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Our Story"
          placeholder="Add heading"
          label="Story heading"
        />
      }
    >
      {content.intro?.trim() || mode === "editor" ? (
        <p className="mx-auto max-w-2xl whitespace-pre-line leading-8 text-[var(--cf-section-body)]">
          <EditableText
            sectionId={sectionId}
            path={["intro"]}
            value={content.intro ?? ""}
            placeholder="Add introduction"
            label="Story introduction"
            multiline
          />
        </p>
      ) : null}
      {content.elements.length === 0 && mode === "editor" ? (
        <EmptyCopy>Add narrative blocks from the Content panel.</EmptyCopy>
      ) : null}
    </ContentSection>
  );
}

export function ClassicFilipinianaStoryBlock({
  sectionId,
  block,
  index,
  library,
  viewport,
  context = emptyContext,
}: {
  sectionId: string;
  block: StoryBlock;
  index: number;
  library: TemplateDesignLibrary;
  viewport: ResponsiveViewport;
  context?: ResolvedDesignContext;
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
    );
  return (
    <div
      data-section-content
      className="relative px-7 py-14 text-center sm:px-12 sm:py-20"
    >
      <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.3em] text-[var(--cf-secondary)]">
        Chapter {String(index + 1).padStart(2, "0")}
      </p>
      {!slots.eyebrow.isHidden && (
        <p
          style={style("eyebrow")}
          className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--cf-muted)]"
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
      <ClassicFilipinianaStoryBlockHeading
        sectionId={sectionId}
        block={block}
        index={index}
        style={style("heading")}
      />
      {!slots.divider.isHidden && (
        <ClassicFoundationOrnament className="mx-auto my-5 h-4 w-28 opacity-55" />
      )}
      <div
        className={
          !slots.heading.isHidden && slots.heading.text.trim() ? "mt-6" : ""
        }
      >
        <ClassicFilipinianaStoryBlockBody
          sectionId={sectionId}
          block={block}
          index={index}
          style={style("body")}
        />
      </div>
      {!slots.quote.isHidden && (
        <blockquote
          style={style("quote")}
          className="mx-auto mt-7 max-w-xl font-[family-name:var(--cf-heading-font)] text-xl italic"
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
              — {slots.quote.attribution}
            </footer>
          )}
        </blockquote>
      )}
      {!slots.caption.isHidden && (
        <p
          style={style("caption")}
          className="mx-auto mt-4 max-w-xl text-xs text-[var(--cf-muted)]"
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
      {!slots.cta.isHidden && (
        <span
          style={style("cta")}
          className="mx-auto mt-7 inline-block border border-[var(--cf-theme-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
        >
          {slots.cta.label}
        </span>
      )}
      {!slots.media.isHidden &&
        slots.media.content &&
        slots.media.content.type !== "image" && (
          <p className="mt-5 text-xs text-[var(--cf-muted)]">
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
      data-section-heading
      style={effectiveStyle}
      className="mx-auto max-w-2xl font-[family-name:var(--cf-heading-font)] text-3xl text-[var(--cf-text)]"
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

export function ClassicFilipinianaStoryBlockBody({
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
      data-section-body
      style={effectiveStyle}
      className="mx-auto max-w-2xl whitespace-pre-line text-sm leading-8 text-[var(--cf-section-body)]"
    >
      <EditableText
        sectionId={sectionId}
        narrativeSlot={{ blockId: block.id, slot: "body" }}
        path={["elements", index, "slots", "body", "text"]}
        value={slot.text}
        placeholder="Add story"
        label={`Story block ${index + 1} body`}
        multiline
      />
    </p>
  ) : null;
}

export function ClassicFilipinianaSchedule({
  sectionId,
  content,
}: {
  sectionId: string;
  content: ScheduleContent;
}) {
  return (
    <ContentSection
      eyebrow="The celebration"
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
        <ol className="mx-auto max-w-xl text-left">
          {content.items.map((item, index) => (
            <li
              className="grid grid-cols-[6rem_1fr] gap-4 border-t border-[color-mix(in_srgb,var(--cf-border)_25%,transparent)] py-5"
              key={index}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--cf-section-accent)]">
                <EditableText
                  sectionId={sectionId}
                  path={["items", index, "time"]}
                  value={item.time}
                  fallback="Time TBA"
                  placeholder="Add time"
                  label={`Schedule item ${index + 1} time`}
                />
              </span>
              <div>
                <h3 className="font-[family-name:var(--cf-heading-font)] text-xl text-[var(--cf-text)]">
                  <EditableText
                    sectionId={sectionId}
                    path={["items", index, "title"]}
                    value={item.title}
                    fallback="Celebration detail"
                    placeholder="Add title"
                    label={`Schedule item ${index + 1} title`}
                  />
                </h3>
                <p className="mt-1 text-sm leading-6">
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
    </ContentSection>
  );
}

export function ClassicFilipinianaVenue({
  sectionId,
  content,
}: {
  sectionId: string;
  content: VenueContent;
}) {
  return (
    <ContentSection
      eyebrow="Where to gather"
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
      <p className="font-[family-name:var(--cf-heading-font)] text-2xl text-[var(--cf-text)] sm:text-3xl">
        <EditableText
          sectionId={sectionId}
          path={["name"]}
          value={content.name}
          fallback="Venue details to follow"
          placeholder="Add venue name"
          label="Venue name"
        />
      </p>
      <ClassicFoundationOrnament className="mx-auto my-5 h-4 w-28 opacity-55" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cf-muted)]">
        <EditableText
          sectionId={sectionId}
          path={["address"]}
          value={content.address}
          placeholder="Add address"
          label="Venue address"
          multiline
        />
      </p>
      <p className="mx-auto mt-6 max-w-xl whitespace-pre-line">
        <EditableText
          sectionId={sectionId}
          path={["description"]}
          value={content.description}
          placeholder="Add description"
          label="Venue description"
          multiline
        />
      </p>
    </ContentSection>
  );
}

export function ClassicFilipinianaDressCode({
  sectionId,
  content,
}: {
  sectionId: string;
  content: DressCodeContent;
}) {
  return (
    <ContentSection
      eyebrow="What to wear"
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
    >
      <p className="mx-auto max-w-xl whitespace-pre-line leading-8">
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
    </ContentSection>
  );
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
      ? "mx-auto mb-3 aspect-[4/5] w-full max-w-36 rounded-sm object-cover"
      : "mx-auto mb-3 aspect-square w-full max-w-28 rounded-full object-cover";
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
    >
      {groups.length > 0 ? (
        <div className="mx-auto grid max-w-4xl gap-x-10 gap-y-10 sm:grid-cols-2">
          {groups.map((group) => (
            <section
              className="bg-[color-mix(in_srgb,var(--cf-surface)_52%,transparent)] px-5 py-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--cf-border)_20%,transparent)]"
              key={group.id}
            >
              <h3 className="font-[family-name:var(--cf-heading-font)] text-xl text-[var(--cf-text)]">
                {group.name}
              </h3>
              <ul
                className={`mt-4 ${imagesVisible && group.people.some((person) => person.media && media[person.media.assetId]) ? "grid grid-cols-2 gap-5" : "space-y-3"}`}
              >
                {group.people.map((person) => {
                  const asset =
                    imagesVisible && person.media
                      ? media[person.media.assetId]
                      : undefined;
                  return (
                    <li key={person.id}>
                      {asset && person.media && (
                        <ZoomedMediaImage
                          className={imageClass}
                          height={asset.web.height}
                          reference={person.media}
                          src={asset.web.url}
                          width={asset.web.width}
                        />
                      )}
                      <span className="text-base text-[var(--cf-text)]">
                        {person.name}
                      </span>
                      {person.role && (
                        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--cf-section-accent)]">
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
      botanical
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

export function ClassicFilipinianaFaq({
  sectionId,
  content,
}: {
  sectionId: string;
  content: FaqContent;
}) {
  return (
    <ContentSection
      eyebrow="Good to know"
      heading={
        <EditableText
          sectionId={sectionId}
          path={["heading"]}
          value={content.heading}
          fallback="Frequently Asked Questions"
          placeholder="Add heading"
          label="FAQ heading"
        />
      }
    >
      {content.items.length ? (
        <div className="mx-auto max-w-2xl text-left">
          {content.items.map((item, index) => (
            <div
              className="border-t border-[color-mix(in_srgb,var(--cf-border)_25%,transparent)] py-5"
              key={index}
            >
              <h3 className="font-[family-name:var(--cf-heading-font)] text-lg text-[var(--cf-text)]">
                <EditableText
                  sectionId={sectionId}
                  path={["items", index, "question"]}
                  value={item.question}
                  fallback="Question"
                  placeholder="Add question"
                  label={`FAQ ${index + 1} question`}
                />
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6">
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
      botanical
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
  botanical = false,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  children: React.ReactNode;
  botanical?: boolean;
}) {
  return (
    <div
      data-section-content
      className="relative overflow-hidden px-7 py-20 text-center sm:px-12 sm:py-24"
    >
      {botanical && (
        <>
          <ClassicBotanicalSprig className="absolute -left-16 bottom-0 h-32 w-64 -rotate-6" />
          <ClassicBotanicalSprig className="absolute -right-16 top-0 h-32 w-64 rotate-[174deg]" />
        </>
      )}
      <div className="relative mx-auto max-w-5xl">
        <ClassicFoundationOrnament className="mx-auto mb-5 h-5 w-32 opacity-75" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--cf-secondary)]">
          {eyebrow}
        </p>
        <h2
          data-section-heading
          className="mx-auto mt-3 w-full max-w-2xl font-[family-name:var(--cf-heading-font)] text-3xl leading-tight text-[var(--cf-text)] sm:text-4xl"
        >
          {heading}
        </h2>
        <div
          data-section-body
          className="mx-auto mt-8 text-sm leading-7 text-[var(--cf-muted)]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="italic text-[var(--cf-muted)]">{children}</p>;
}
