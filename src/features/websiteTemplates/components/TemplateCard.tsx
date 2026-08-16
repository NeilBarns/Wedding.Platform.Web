import { Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Heading } from '../../../components/ui/Heading'
import { Text } from '../../../components/ui/Text'
import type { WebsiteTemplateOption } from '../types'
import { TemplateThumbnail } from './TemplateThumbnail'

export function TemplateCard({ template, disabled, onSelect }: { template: WebsiteTemplateOption; disabled?: boolean; onSelect: () => void }) {
  return <article className={`overflow-hidden rounded-xl border bg-surface ${template.isSelected ? 'border-accent' : 'border-border'}`}>
    <TemplateThumbnail templateKey={template.key} />
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <Heading level={3} variant="section">{template.displayName}</Heading>
        {template.isSelected && <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-accent"><Check size={13} aria-hidden="true" /> Selected</span>}
      </div>
      <Text className="mt-2" variant="muted">{template.description}</Text>
      <div className="mt-3 flex flex-wrap gap-1.5">{template.styleTags.map((tag) => <span className="rounded-full border border-border px-2 py-1 text-[11px] text-foreground-muted" key={tag}>{tag}</span>)}</div>
      <Button className="mt-4 w-full" size="sm" variant={template.isSelected ? 'secondary' : 'primary'} type="button" disabled={disabled || template.isSelected} onClick={onSelect}>{template.isSelected ? 'Selected' : 'Select Template'}</Button>
    </div>
  </article>
}
