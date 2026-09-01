import type { ResponsiveViewport } from '../websiteEditor/types'
import type { ElementCapability, TemplateDesignLibrary } from '../websiteCapabilities/types'
import type { ProjectColor } from '../websiteColors/projectColors'
import { DecorativeAssetLayer } from './DecorativeAssetLayer'
import { resolveNarrativeMediaFrame } from './narrativeMediaAppearance'

type MediaCapability = NonNullable<ElementCapability['narrativeBlock']>['appearance']['media']

export function NarrativeMediaFrameLayer(props: { templateKey: string; viewport: ResponsiveViewport; appearance?: { frameStyle?: string; frameColorId?: string; frameSize?: 'small' | 'medium' | 'large' }; frameStyles: MediaCapability['frameStyles']; frameColorIds: readonly string[]; library: TemplateDesignLibrary; projectColors: readonly ProjectColor[]; defaultStyle?: string }) {
  const resolved = resolveNarrativeMediaFrame(props.templateKey, props.viewport, props.appearance?.frameStyle, props.frameStyles, props.defaultStyle, props.appearance, props.frameColorIds, props.library, props.projectColors)
  return resolved ? <DecorativeAssetLayer decoration={resolved.decoration} cornerSizeOverride={resolved.cornerSize} className="z-[2]" /> : null
}
