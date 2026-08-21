import { useEffect, useState } from 'react'
import type { ResponsiveViewport } from './types'

const TABLET_MIN_WIDTH = 768
const DESKTOP_MIN_WIDTH = 1280

export const PREVIEW_WIDTHS: Record<Exclude<ResponsiveViewport, 'desktop'>, number> = {
  tablet: 768,
  mobile: 390,
}

export function editorDeviceCategory(width: number): ResponsiveViewport {
  if (width >= DESKTOP_MIN_WIDTH) return 'desktop'
  if (width >= TABLET_MIN_WIDTH) return 'tablet'
  return 'mobile'
}

export function accessiblePreviewViewports(category: ResponsiveViewport): ResponsiveViewport[] {
  if (category === 'desktop') return ['desktop', 'tablet', 'mobile']
  if (category === 'tablet') return ['tablet', 'mobile']
  return ['mobile']
}

export function useEditorDeviceCategory(): ResponsiveViewport {
  const [category, setCategory] = useState<ResponsiveViewport>(() => editorDeviceCategory(window.innerWidth))

  useEffect(() => {
    const update = () => setCategory(editorDeviceCategory(window.innerWidth))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return category
}
