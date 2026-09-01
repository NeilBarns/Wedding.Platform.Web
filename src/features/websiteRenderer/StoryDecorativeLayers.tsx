import type { ResponsiveViewport, StoryDecorativeAppearance } from '../websiteEditor/types'
import { resolveDecorativeExecution, resolveDecorativeOverlayStyle } from './templateDecorativeAssets'
import { DecorativeBackgroundLayers } from './DecorativeBackgroundLayers'
import { DecorativeAssetLayer } from './DecorativeAssetLayer'

export function StoryDecorativeLayers({ templateKey, appearance, viewport }: { templateKey: string; appearance?: StoryDecorativeAppearance; viewport: ResponsiveViewport }) {
  const frame = resolveDecorativeExecution(templateKey, 'frame', appearance?.frame?.style, viewport)
  const overlay = resolveDecorativeOverlayStyle(templateKey, appearance?.background?.overlay)
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-story-decoration>
    <DecorativeBackgroundLayers templateKey={templateKey} appearance={appearance?.background} viewport={viewport} />
    {overlay && <span className="absolute inset-0 z-[4]" style={overlay} />}
    {frame && <DecorativeAssetLayer decoration={frame} className="z-[20]" />}
  </div>
}
