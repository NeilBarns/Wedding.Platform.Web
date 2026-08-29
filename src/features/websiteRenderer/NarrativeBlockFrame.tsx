import { useNarrativeSlotFocus } from './NarrativeSlotFocusContext'
import type { NarrativeSlotKey } from '../websiteEditor/narrativeSlotFocus'

export function NarrativeBlockFrame({ mode, blockId, selected, className = '', preservePublicWrapper = false, children, onSelect }: { mode: 'editor' | 'public'; blockId: string; selected: boolean; className?: string; preservePublicWrapper?: boolean; children: React.ReactNode; onSelect?: (blockId: string) => void }) {
  const slotFocus = useNarrativeSlotFocus()
  if (mode === 'public') return preservePublicWrapper ? <div className={className}>{children}</div> : <>{children}</>

  return <div
    className={`${className} editor-selection-target relative rounded-sm`}
    data-editor-narrative-block={blockId}
    data-editor-selected={selected ? 'true' : undefined}
    data-editor-active-slot={slotFocus?.active?.blockId === blockId ? slotFocus.active.slot : undefined}
    onPointerDown={(event) => {
      event.stopPropagation()
      onSelect?.(blockId)
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-editor-narrative-slot]')
      if (target && target.dataset.editorNarrativeBlock === blockId) slotFocus?.onSelect(blockId, target.dataset.editorNarrativeSlot as NarrativeSlotKey)
    }}
    onClickCapture={(event) => {
      if (event.detail === 0) onSelect?.(blockId)
    }}
    onClick={(event) => event.stopPropagation()}
  >
    {children}
    <EditorSelectionFrame selected={selected} />
  </div>
}
import { EditorSelectionFrame } from './EditorSelectionFrame'
