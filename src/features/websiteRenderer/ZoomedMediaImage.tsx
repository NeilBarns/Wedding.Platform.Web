import { useEffect, useRef, useState } from 'react'
import type { SectionMedia } from '../websiteEditor/types'

type Size = { width: number; height: number }

export function ZoomedMediaImage({ className = '', fill = false, height, reference, src, width }: { className?: string; fill?: boolean; height: number; reference: NonNullable<SectionMedia>; src: string; width: number }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const [container, setContainer] = useState<Size>({ width: 0, height: 0 })
  const point = reference.focalPoint ?? { x: 0.5, y: 0.5 }
  const zoom = reference.zoom ?? 1

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const measure = () => setContainer({ width: element.clientWidth, height: element.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const baseScale = container.width && container.height ? Math.max(container.width / width, container.height / height) : 0
  const renderedWidth = width * baseScale * zoom
  const renderedHeight = height * baseScale * zoom
  const left = Math.max(container.width - renderedWidth, Math.min(0, container.width / 2 - point.x * renderedWidth))
  const top = Math.max(container.height - renderedHeight, Math.min(0, container.height / 2 - point.y * renderedHeight))

  return <span ref={containerRef} className={`${fill ? 'absolute inset-0' : 'relative'} block overflow-hidden ${className}`}>
    <img className="invisible block h-full w-full object-cover" src={src} alt="" aria-hidden="true" />
    <img
      className={baseScale ? 'absolute max-w-none' : 'absolute inset-0 h-full w-full object-cover object-center'}
      style={baseScale ? { height: renderedHeight, left, top, width: renderedWidth } : undefined}
      src={src}
      alt=""
    />
  </span>
}
