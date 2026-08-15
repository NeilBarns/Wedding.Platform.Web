import { useEffect, useRef } from 'react'
import { ClassicFilipinianaRenderer } from './templates/ClassicFilipinianaRenderer'
import { ModernEditorialRenderer } from './templates/ModernEditorialRenderer'
import type { WebsiteRendererProps } from './types'

const templateRenderers = {
  'classic-filipiniana-v1': ClassicFilipinianaRenderer,
  'modern-editorial-v1': ModernEditorialRenderer,
} as const

export function WebsiteRenderer(props: WebsiteRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const Renderer = templateRenderers[props.website.templateKey as keyof typeof templateRenderers]

  useEffect(() => {
    if (props.mode !== 'editor' || !props.selectedSectionId) return
    const element = rootRef.current?.querySelector(`[data-preview-section="${CSS.escape(props.selectedSectionId)}"]`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [props.mode, props.selectedSectionId])

  if (!Renderer) {
    return <div className="flex min-h-80 items-center justify-center bg-[#f7f0e6] p-8 text-center text-sm text-[#665d54]">This Template is not supported by this version of the renderer.</div>
  }

  return <div ref={rootRef}><Renderer {...props} /></div>
}
