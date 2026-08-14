import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, RsvpContent, ScheduleContent, StoryContent, VenueContent } from '../../../websiteEditor/types'

export function ClassicFilipinianaHero({ eventName, content }: { eventName: string; content: HeroContent }) {
  return <div className="relative flex min-h-[34rem] flex-col items-center justify-center overflow-hidden px-8 py-24 text-center">
    <div className="absolute inset-5 border border-[color-mix(in_srgb,var(--cf-accent)_30%,transparent)]" /><div className="absolute left-1/2 top-14 h-px w-20 -translate-x-1/2 bg-[var(--cf-accent)]" />
    <p className="relative text-[10px] font-semibold uppercase tracking-[0.38em] text-[var(--cf-secondary)]">Together with their families</p>
    <h1 className="relative mt-7 max-w-2xl font-[family-name:var(--cf-heading-font)] text-5xl leading-[1.05] text-[var(--cf-text)] sm:text-6xl">{content.headline.trim() || eventName}</h1>
    {content.subheadline.trim() && <p className="relative mt-6 max-w-lg text-sm leading-7 text-[var(--cf-muted)]">{content.subheadline}</p>}
    <div className="relative mt-10 text-2xl text-[var(--cf-accent)]">✦</div>
  </div>
}

export function ClassicFilipinianaDate({ date, content }: { date: string | null; content: DateContent }) {
  return <ContentSection eyebrow="Save the date" heading={content.heading || 'Our Wedding Day'}><p className="font-[family-name:var(--cf-heading-font)] text-2xl text-[var(--cf-text)]">{date ?? 'Date to be announced'}</p>{content.description && <p className="mt-4 whitespace-pre-line">{content.description}</p>}</ContentSection>
}

export function ClassicFilipinianaStory({ content }: { content: StoryContent }) {
  return <ContentSection eyebrow="Our journey" heading={content.heading || 'Our Story'}><p className="mx-auto max-w-2xl whitespace-pre-line leading-8">{content.body || 'A story worth celebrating, shared with the people who matter most.'}</p></ContentSection>
}

export function ClassicFilipinianaSchedule({ content }: { content: ScheduleContent }) {
  return <ContentSection eyebrow="The celebration" heading={content.heading || 'Schedule'}>{content.items.length ? <ol className="mx-auto max-w-xl text-left">{content.items.map((item, index) => <li className="grid grid-cols-[6rem_1fr] gap-4 border-t border-[color-mix(in_srgb,var(--cf-border)_25%,transparent)] py-5" key={`${item.time}-${item.title}-${index}`}><span className="text-xs font-semibold uppercase tracking-wider text-[var(--cf-accent)]">{item.time || 'Time TBA'}</span><div><h3 className="font-[family-name:var(--cf-heading-font)] text-xl text-[var(--cf-text)]">{item.title || 'Celebration detail'}</h3>{item.description && <p className="mt-1 text-sm leading-6">{item.description}</p>}</div></li>)}</ol> : <EmptyCopy>Celebration details will appear here.</EmptyCopy>}</ContentSection>
}

export function ClassicFilipinianaVenue({ content }: { content: VenueContent }) {
  return <ContentSection eyebrow="Where to gather" heading={content.heading || 'Venue'}><p className="font-[family-name:var(--cf-heading-font)] text-2xl text-[var(--cf-text)]">{content.name || 'Venue details to follow'}</p>{content.address && <p className="mt-2 text-sm uppercase tracking-wider text-[var(--cf-muted)]">{content.address}</p>}{content.description && <p className="mx-auto mt-5 max-w-xl whitespace-pre-line">{content.description}</p>}</ContentSection>
}

export function ClassicFilipinianaDressCode({ content }: { content: DressCodeContent }) {
  return <ContentSection eyebrow="What to wear" heading={content.heading || 'Dress Code'}><p className="mx-auto max-w-xl whitespace-pre-line leading-8">{content.description || 'Attire guidance will be shared here.'}</p></ContentSection>
}

export function ClassicFilipinianaGallery({ content, mode }: { content: GalleryContent; mode: 'editor' | 'public' }) {
  return <ContentSection eyebrow="Memories" heading={content.heading || 'Gallery'}>{mode === 'editor' && <div className="mx-auto grid max-w-xl grid-cols-3 gap-3" aria-label="Empty gallery preview"><div className="aspect-[4/5] border border-dashed border-[var(--cf-border)] bg-[color-mix(in_srgb,var(--cf-surface)_65%,transparent)]" /><div className="flex aspect-[4/5] items-center justify-center border border-dashed border-[var(--cf-border)] bg-[var(--cf-surface)] px-2 text-xs text-[var(--cf-muted)]">Photos will appear here</div><div className="aspect-[4/5] border border-dashed border-[var(--cf-border)] bg-[color-mix(in_srgb,var(--cf-surface)_65%,transparent)]" /></div>}</ContentSection>
}

export function ClassicFilipinianaFaq({ content }: { content: FaqContent }) {
  return <ContentSection eyebrow="Good to know" heading={content.heading || 'Frequently Asked Questions'}>{content.items.length ? <div className="mx-auto max-w-2xl text-left">{content.items.map((item, index) => <div className="border-t border-[color-mix(in_srgb,var(--cf-border)_25%,transparent)] py-5" key={`${item.question}-${index}`}><h3 className="font-[family-name:var(--cf-heading-font)] text-lg text-[var(--cf-text)]">{item.question || 'Question'}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6">{item.answer}</p></div>)}</div> : <EmptyCopy>Helpful details will appear here.</EmptyCopy>}</ContentSection>
}

export function ClassicFilipinianaRsvp({ content }: { content: RsvpContent }) {
  return <ContentSection eyebrow="Celebrate with us" heading={content.heading || 'Kindly Respond'}><p className="mx-auto max-w-lg whitespace-pre-line">{content.description || 'We would be honored to celebrate this day with you.'}</p><button className="mt-8 border border-[var(--cf-accent)] bg-[var(--cf-accent)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" type="button" onClick={(event) => event.preventDefault()}>{content.buttonLabel.trim() || 'RSVP'}</button></ContentSection>
}

function ContentSection({ eyebrow, heading, children }: { eyebrow: string; heading: string; children: React.ReactNode }) {
  return <div className="px-7 py-20 text-center sm:px-12"><p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--cf-secondary)]">{eyebrow}</p><h2 className="mx-auto mt-3 max-w-2xl font-[family-name:var(--cf-heading-font)] text-3xl text-[var(--cf-text)] sm:text-4xl">{heading}</h2><div className="mx-auto mt-8 text-sm leading-7 text-[var(--cf-muted)]">{children}</div></div>
}

function EmptyCopy({ children }: { children: React.ReactNode }) { return <p className="italic text-[var(--cf-muted)]">{children}</p> }
