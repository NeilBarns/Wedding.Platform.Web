import { useEffect, useRef } from 'react'

export function DiscardChangesDialog({ open, onCancel, onDiscard }: {
  open: boolean
  onCancel: () => void
  onDiscard: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal()
    if (!open && ref.current?.open) ref.current.close()
  }, [open])

  return (
    <dialog ref={ref} className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-5 text-foreground shadow-[var(--shadow-dialog)]" onCancel={(event) => { event.preventDefault(); onCancel() }}>
      <h2 className="text-lg font-semibold">Discard unsaved changes?</h2>
      <p className="mt-2 text-sm text-foreground-muted">Your edits to this section have not been saved.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted" type="button" onClick={onCancel}>Cancel</button>
        <button className="rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white" type="button" onClick={onDiscard}>Discard</button>
      </div>
    </dialog>
  )
}
