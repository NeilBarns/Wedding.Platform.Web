import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, PeopleContent, ResolvedWebsiteMedia, RsvpContent, ScheduleContent, SectionMedia, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { ZoomedMediaImage } from '../ZoomedMediaImage'
import { ClassicFilipinianaDate, ClassicFilipinianaDressCode, ClassicFilipinianaFaq, ClassicFilipinianaGallery, ClassicFilipinianaHero, ClassicFilipinianaPeople, ClassicFilipinianaRsvp, ClassicFilipinianaSchedule, ClassicFilipinianaStory, ClassicFilipinianaVenue } from './classicFilipiniana/sections'
import { resolveClassicFilipinianaSectionAppearance } from './classicFilipiniana/appearance'
import { resolveClassicFilipinianaDesign } from './classicFilipiniana/design'

export function ClassicFilipinianaRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)

  return <article className="min-h-full bg-[var(--cf-page)] font-[family-name:var(--cf-body-font)] text-[var(--cf-text)]" style={resolveClassicFilipinianaDesign(website.designSettings)}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm italic text-[var(--cf-muted)]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => {
      const appearance = resolveClassicFilipinianaSectionAppearance(section.type, website.designSettings, section.appearance, index)
      return (
      <section
        className={`${appearance.sectionClass} relative cursor-default border-b border-[color-mix(in_srgb,var(--cf-border)_18%,transparent)] transition-shadow ${mode === 'editor' && selectedSectionId === section.id ? 'z-10 outline-2 outline-offset-[-3px] outline-[var(--editor-chrome-focus)]' : ''}`}
        style={appearance.sectionStyle}
        data-preview-section={section.id}
        key={section.id}
        onClick={mode === 'editor' ? () => onSectionSelect?.(section.id) : undefined}
        onKeyDown={mode === 'editor' ? (event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSectionSelect?.(section.id) }
        } : undefined}
        role={mode === 'editor' ? 'group' : undefined}
        aria-label={mode === 'editor' ? `${section.displayName} section` : undefined}
        tabIndex={mode === 'editor' ? 0 : undefined}
      >
        {mode === 'editor' && selectedSectionId === section.id && <span className="absolute right-3 top-3 z-20 rounded-full bg-[var(--editor-chrome-strong)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-chrome-on-strong)] shadow-[var(--editor-chrome-shadow)]">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} media={website.media} />
      </section>
      )
    })}
  </article>
}

function Section({ section, eventName, eventDate, mode, media }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public'; media: Record<string, ResolvedWebsiteMedia> }) {
  const presentation = section.appearance.presentation ?? section.presentationCapability?.default
  const present = (content: React.ReactNode) => <ClassicMediaPresentation section={section} media={media} presentation={presentation}>{content}</ClassicMediaPresentation>
  switch (section.type) {
    case 'hero': return present(<ClassicFilipinianaHero sectionId={section.id} eventName={eventName} content={section.content as HeroContent} compact={presentation === 'framed'} />)
    case 'date': return <ClassicFilipinianaDate sectionId={section.id} date={formatDateOnly(eventDate)} content={section.content as DateContent} />
    case 'story': return present(<ClassicFilipinianaStory sectionId={section.id} content={section.content as StoryContent} />)
    case 'schedule': return <ClassicFilipinianaSchedule sectionId={section.id} content={section.content as ScheduleContent} />
    case 'venue': return present(<ClassicFilipinianaVenue sectionId={section.id} content={section.content as VenueContent} />)
    case 'dressCode': return <ClassicFilipinianaDressCode sectionId={section.id} content={section.content as DressCodeContent} />
    case 'people': return <ClassicFilipinianaPeople sectionId={section.id} content={section.content as PeopleContent} mode={mode} media={media} showMedia={section.itemMediaCapability?.itemType === 'person'} presentation={presentation ?? 'medallions'} />
    case 'gallery': return <ClassicFilipinianaGallery sectionId={section.id} content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ClassicFilipinianaFaq sectionId={section.id} content={section.content as FaqContent} />
    case 'rsvp': return <ClassicFilipinianaRsvp sectionId={section.id} content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[var(--cf-muted)]">This section is not supported by this Template renderer.</div> : null
  }
}

function ClassicMediaPresentation({ section, media, presentation, children }: { section: WebsiteSection; media: Record<string, ResolvedWebsiteMedia>; presentation?: string; children: React.ReactNode }) {
  const reference = (section.content as { media?: SectionMedia }).media
  const asset = reference ? media[reference.assetId] : undefined
  if (!section.mediaCapability || !asset) return <>{children}</>
  const mediaReference = reference as NonNullable<SectionMedia>
  const image = (className: string, fill = false) => <ZoomedMediaImage className={className} fill={fill} height={asset.web.height} reference={mediaReference} src={asset.web.url} width={asset.web.width} />

  if (presentation === 'immersive' || presentation === 'scenic') return <div className="relative isolate min-h-[32rem] overflow-hidden">{image('h-full', true)}<div className="relative min-h-[32rem] bg-[color-mix(in_srgb,var(--cf-page)_76%,transparent)] backdrop-blur-[1px]">{children}</div></div>
  if (section.type === 'story' && presentation === 'portraitStory') return <div className="grid lg:grid-cols-[minmax(17rem,0.85fr)_1.15fr] lg:items-center">{image('h-[clamp(18rem,58vw,32rem)] lg:h-[min(34rem,65vh)]')}<div className="[&_[data-section-content]]:py-12 sm:[&_[data-section-content]]:py-14">{children}</div></div>
  if (presentation === 'detailsFirst') return <div className="grid items-stretch lg:grid-cols-[1.1fr_0.9fr]"><div>{children}</div>{image('h-full min-h-[24rem] max-h-[42rem]')}</div>
  if (section.type === 'story' && presentation === 'textFirst') return <div className="[&_[data-section-content]]:pb-8 [&_[data-section-content]]:pt-14 sm:[&_[data-section-content]]:pt-16">{children}<div className="mx-auto max-w-3xl px-7 pb-14">{image('max-h-[28rem] rounded-sm')}</div></div>
  if (section.type === 'story' && presentation === 'framed') return <div className="mx-auto max-w-5xl px-5 py-6 sm:px-10 sm:py-10"><div className="border border-[color-mix(in_srgb,var(--cf-border)_45%,transparent)] bg-[var(--cf-surface)] p-2 sm:p-3">{image('h-[clamp(16rem,38vw,24rem)]')}</div><div className="[&_[data-section-content]]:px-2 [&_[data-section-content]]:pb-8 [&_[data-section-content]]:pt-10 sm:[&_[data-section-content]]:px-8 sm:[&_[data-section-content]]:pt-12">{children}</div></div>
  if (section.type === 'venue' && presentation === 'framed') return <div className="mx-auto max-w-5xl px-5 pb-6 pt-5 sm:px-10 sm:pb-10 sm:pt-8"><div className="border border-[color-mix(in_srgb,var(--cf-border)_45%,transparent)] bg-[var(--cf-surface)] p-2 sm:p-3">{image('h-[clamp(15rem,34vw,22rem)]')}</div><div className="[&_[data-section-content]]:px-2 [&_[data-section-content]]:pb-8 [&_[data-section-content]]:pt-8 sm:[&_[data-section-content]]:px-8 sm:[&_[data-section-content]]:pb-10 sm:[&_[data-section-content]]:pt-10">{children}</div></div>
  if (section.type === 'hero' && presentation === 'framed') return <div className="mx-auto max-w-5xl px-5 pb-8 pt-5 sm:px-10 sm:pb-12 sm:pt-8"><div className="border border-[color-mix(in_srgb,var(--cf-border)_42%,transparent)] bg-[var(--cf-surface)] p-2 sm:p-3">{image('h-[clamp(17rem,40vw,26rem)]')}</div><div>{children}</div></div>

  return <><div className={`mx-auto overflow-hidden ${section.type === 'hero' && presentation === 'classic' ? 'max-h-[68vh] w-full' : 'mt-8 max-w-4xl rounded-sm px-6'}`}>{image(section.type === 'hero' && presentation === 'classic' ? 'h-[clamp(18rem,55vw,46rem)]' : 'max-h-[34rem]')}</div>{children}</>
}
