import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, RsvpContent, ScheduleContent, StoryContent, VenueContent } from '../../../websiteEditor/types'

export function ClassicFilipinianaHero({ eventName, content }: { eventName: string; content: HeroContent }) {
  return <div className="relative flex min-h-[34rem] flex-col items-center justify-center overflow-hidden px-8 py-24 text-center">
    <div className="absolute inset-5 border border-[#a15e47]/25" /><div className="absolute left-1/2 top-14 h-px w-20 -translate-x-1/2 bg-[#a15e47]" />
    <p className="relative text-[10px] font-semibold uppercase tracking-[0.38em] text-[#6f7558]">Together with their families</p>
    <h1 className="relative mt-7 max-w-2xl font-serif text-5xl leading-[1.05] text-[#332b27] sm:text-6xl">{content.headline.trim() || eventName}</h1>
    {content.subheadline.trim() && <p className="relative mt-6 max-w-lg text-sm leading-7 text-[#6d6159]">{content.subheadline}</p>}
    <div className="relative mt-10 text-2xl text-[#a15e47]">✦</div>
  </div>
}

export function ClassicFilipinianaDate({ date, content }: { date: string | null; content: DateContent }) {
  return <ContentSection eyebrow="Save the date" heading={content.heading || 'Our Wedding Day'}><p className="font-serif text-2xl text-[#413732]">{date ?? 'Date to be announced'}</p>{content.description && <p className="mt-4 whitespace-pre-line">{content.description}</p>}</ContentSection>
}

export function ClassicFilipinianaStory({ content }: { content: StoryContent }) {
  return <ContentSection eyebrow="Our journey" heading={content.heading || 'Our Story'}><p className="mx-auto max-w-2xl whitespace-pre-line leading-8">{content.body || 'A story worth celebrating, shared with the people who matter most.'}</p></ContentSection>
}

export function ClassicFilipinianaSchedule({ content }: { content: ScheduleContent }) {
  return <ContentSection eyebrow="The celebration" heading={content.heading || 'Schedule'}>{content.items.length ? <ol className="mx-auto max-w-xl text-left">{content.items.map((item, index) => <li className="grid grid-cols-[6rem_1fr] gap-4 border-t border-[#7a6b5f]/20 py-5" key={`${item.time}-${item.title}-${index}`}><span className="text-xs font-semibold uppercase tracking-wider text-[#9a5b46]">{item.time || 'Time TBA'}</span><div><h3 className="font-serif text-xl text-[#3e342f]">{item.title || 'Celebration detail'}</h3>{item.description && <p className="mt-1 text-sm leading-6">{item.description}</p>}</div></li>)}</ol> : <EmptyCopy>Celebration details will appear here.</EmptyCopy>}</ContentSection>
}

export function ClassicFilipinianaVenue({ content }: { content: VenueContent }) {
  return <ContentSection eyebrow="Where to gather" heading={content.heading || 'Venue'}><p className="font-serif text-2xl text-[#413732]">{content.name || 'Venue details to follow'}</p>{content.address && <p className="mt-2 text-sm uppercase tracking-wider text-[#7a695f]">{content.address}</p>}{content.description && <p className="mx-auto mt-5 max-w-xl whitespace-pre-line">{content.description}</p>}</ContentSection>
}

export function ClassicFilipinianaDressCode({ content }: { content: DressCodeContent }) {
  return <ContentSection eyebrow="What to wear" heading={content.heading || 'Dress Code'}><p className="mx-auto max-w-xl whitespace-pre-line leading-8">{content.description || 'Attire guidance will be shared here.'}</p></ContentSection>
}

export function ClassicFilipinianaGallery({ content, mode }: { content: GalleryContent; mode: 'editor' | 'public' }) {
  return <ContentSection eyebrow="Memories" heading={content.heading || 'Gallery'}>{mode === 'editor' && <div className="mx-auto grid max-w-xl grid-cols-3 gap-3" aria-label="Empty gallery preview"><div className="aspect-[4/5] border border-dashed border-[#9b897c]/45 bg-[#eee2d2]/50" /><div className="flex aspect-[4/5] items-center justify-center border border-dashed border-[#9b897c]/45 bg-[#f3e9dc] px-2 text-xs text-[#77695f]">Photos will appear here</div><div className="aspect-[4/5] border border-dashed border-[#9b897c]/45 bg-[#eee2d2]/50" /></div>}</ContentSection>
}

export function ClassicFilipinianaFaq({ content }: { content: FaqContent }) {
  return <ContentSection eyebrow="Good to know" heading={content.heading || 'Frequently Asked Questions'}>{content.items.length ? <div className="mx-auto max-w-2xl text-left">{content.items.map((item, index) => <div className="border-t border-[#7a6b5f]/20 py-5" key={`${item.question}-${index}`}><h3 className="font-serif text-lg text-[#3e342f]">{item.question || 'Question'}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6">{item.answer}</p></div>)}</div> : <EmptyCopy>Helpful details will appear here.</EmptyCopy>}</ContentSection>
}

export function ClassicFilipinianaRsvp({ content }: { content: RsvpContent }) {
  return <ContentSection eyebrow="Celebrate with us" heading={content.heading || 'Kindly Respond'}><p className="mx-auto max-w-lg whitespace-pre-line">{content.description || 'We would be honored to celebrate this day with you.'}</p><button className="mt-8 border border-[#9d5b45] bg-[#9d5b45] px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" type="button" onClick={(event) => event.preventDefault()}>{content.buttonLabel.trim() || 'RSVP'}</button></ContentSection>
}

function ContentSection({ eyebrow, heading, children }: { eyebrow: string; heading: string; children: React.ReactNode }) {
  return <div className="px-7 py-20 text-center sm:px-12"><p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#78805f]">{eyebrow}</p><h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-[#3b312d] sm:text-4xl">{heading}</h2><div className="mx-auto mt-8 text-sm leading-7 text-[#6c5f57]">{children}</div></div>
}

function EmptyCopy({ children }: { children: React.ReactNode }) { return <p className="italic text-[#887a70]">{children}</p> }
