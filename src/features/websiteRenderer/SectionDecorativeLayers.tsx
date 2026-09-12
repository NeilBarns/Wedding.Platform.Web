import type { ResponsiveViewport, SectionDecorativeAppearance } from '../websiteEditor/types'
import { resolveDecorativeExecution, resolveDecorativeOverlayStyle } from './templateDecorativeAssets'
import { DecorativeBackgroundLayers } from './DecorativeBackgroundLayers'
import { DecorativeAssetLayer } from './DecorativeAssetLayer'

/** Layout-neutral decorative execution for a Section surface. */
export function SectionDecorativeLayers({ templateKey, appearance, viewport, phase = 'all' }: { templateKey: string; appearance?: SectionDecorativeAppearance; viewport: ResponsiveViewport; phase?: 'all' | 'background' | 'frame' }) {
  const frame = resolveDecorativeExecution(templateKey, 'frame', appearance?.frame?.style, viewport)
  const overlay = resolveDecorativeOverlayStyle(templateKey, appearance?.background?.overlay)

  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-section-decoration data-section-decoration-phase={phase}>
    {phase !== 'frame' && <DecorativeBackgroundLayers templateKey={templateKey} appearance={appearance?.background} viewport={viewport} />}
    {phase !== 'frame' && overlay && <span className="absolute inset-0 z-[4]" style={overlay} />}
    {phase !== 'background' && frame && <DecorativeAssetLayer decoration={frame} className="z-[20]" />}
  </div>
}
