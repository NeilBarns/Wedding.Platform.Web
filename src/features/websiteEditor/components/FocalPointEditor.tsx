import { useRef } from 'react'
import { Button } from '../../../components/ui/Button'

export function FocalPointEditor({ url, point, onChange }: { url: string; point: { x: number; y: number }; onChange: (point: { x: number; y: number }) => void }) {
  const draggingPointer = useRef<number | null>(null)
  const choose = (element: HTMLElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect()
    onChange({ x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) })
  }
  return <div>
    <p className="mb-2 text-xs text-foreground-muted">Click or tap to position the focal point, or drag the marker to fine-tune it.</p>
    <button className="relative block w-full overflow-hidden rounded-lg bg-surface-muted" type="button" onPointerDown={(event) => {
      const marker = (event.target as HTMLElement).closest('[data-focal-marker]')
      if (marker) {
        event.preventDefault()
        event.stopPropagation()
        draggingPointer.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
      } else {
        choose(event.currentTarget, event.clientX, event.clientY)
      }
    }} onPointerMove={(event) => {
      if (draggingPointer.current !== event.pointerId) return
      event.preventDefault()
      event.stopPropagation()
      choose(event.currentTarget, event.clientX, event.clientY)
    }} onPointerUp={(event) => {
      if (draggingPointer.current !== event.pointerId) return
      event.preventDefault()
      event.stopPropagation()
      draggingPointer.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }} onPointerCancel={(event) => {
      if (draggingPointer.current !== event.pointerId) return
      draggingPointer.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }} onKeyDown={(event) => {
      const delta = event.shiftKey ? 0.1 : 0.025
      const next = { ...point }
      if (event.key === 'ArrowLeft') next.x -= delta; else if (event.key === 'ArrowRight') next.x += delta; else if (event.key === 'ArrowUp') next.y -= delta; else if (event.key === 'ArrowDown') next.y += delta; else return
      event.preventDefault(); onChange({ x: Math.max(0, Math.min(1, next.x)), y: Math.max(0, Math.min(1, next.y)) })
    }} aria-label="Choose image focal point with pointer or arrow keys">
      <img className="w-full object-contain" src={url} alt="" />
      <span className="absolute grid size-11 touch-none -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center active:cursor-grabbing" data-focal-marker style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}>
        <span className="size-5 rounded-full border-2 border-white bg-accent shadow" />
      </span>
    </button>
    <Button className="mt-2" type="button" size="sm" variant="ghost" onClick={() => onChange({ x: 0.5, y: 0.5 })}>Reset to center</Button>
  </div>
}
