export function NarrativeBlockFrame({ mode, blockId, selected, className = '', preservePublicWrapper = false, children, onSelect }: { mode: 'editor' | 'public'; blockId: string; selected: boolean; className?: string; preservePublicWrapper?: boolean; children: React.ReactNode; onSelect?: (blockId: string) => void }) {
  if (mode === 'public') return preservePublicWrapper ? <div className={className}>{children}</div> : <>{children}</>

  return <div
    className={`${className} relative rounded-sm`}
    data-editor-narrative-block={blockId}
    data-editor-selected={selected ? 'true' : undefined}
    onPointerDown={(event) => {
      event.stopPropagation()
      onSelect?.(blockId)
    }}
    onClickCapture={(event) => {
      if (event.detail === 0) onSelect?.(blockId)
    }}
    onClick={(event) => event.stopPropagation()}
  >
    {children}
    {selected && <span className="pointer-events-none absolute inset-0 z-40 rounded-sm ring-2 ring-inset ring-[var(--editor-chrome-focus)]" aria-hidden="true" />}
  </div>
}
