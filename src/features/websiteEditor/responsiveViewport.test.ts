import { describe, expect, it } from 'vitest'
import { editorDeviceCategory } from './responsiveViewport'

describe('Section semantic viewport boundaries', () => {
  it.each([[767, 'mobile'], [768, 'tablet'], [1279, 'tablet'], [1280, 'desktop']] as const)('%i resolves to %s', (width, viewport) => {
    expect(editorDeviceCategory(width)).toBe(viewport)
  })
})
