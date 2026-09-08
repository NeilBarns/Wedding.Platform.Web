import { useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { ZoomedMediaImage } from '../../websiteRenderer/ZoomedMediaImage'
import { clampMediaPoint, clampMediaZoom, resolveMediaAspectRatio, type MediaAspectRatio } from '../../websiteElements/mediaCrop'

type ImageFraming = { point: { x: number; y: number }; zoom: number }

export function FocalPointEditor({ url, point, zoom = 1, controlId = "image-framing", aspectRatio = "natural", fit = "cover", sourceWidth = 1, sourceHeight = 1, onChange }: { url: string; point: { x: number; y: number }; zoom?: number; controlId?: string; aspectRatio?: MediaAspectRatio; fit?: "cover" | "contain"; sourceWidth?: number; sourceHeight?: number; onChange: (framing: ImageFraming) => void }) {
  const draggingPointer = useRef<number | null>(null)
  const disabled = fit === "contain"
  const choose = (element: HTMLElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect()
    onChange({ point: clampMediaPoint({ x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height }), zoom: clampMediaZoom(zoom) })
  }
  return <div>
    <p className="mb-2 text-xs text-foreground-muted">{disabled ? "Crop controls apply to Cover. Your focal point and zoom are preserved." : "Click or tap to position the focal point, or drag the marker to fine-tune it."}</p>
    <button className="relative block w-full overflow-hidden rounded-lg bg-surface-muted" style={{ aspectRatio: resolveMediaAspectRatio(aspectRatio, { width: sourceWidth, height: sourceHeight }) }} type="button" disabled={disabled} onPointerDown={(event) => {
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
      event.preventDefault(); onChange({ point: clampMediaPoint(next), zoom: clampMediaZoom(zoom) })
    }} aria-label="Choose image focal point with pointer or arrow keys">
      {fit === "contain" ? <img className="block h-full w-full object-contain" src={url} alt="" /> : <ZoomedMediaImage className="h-full w-full" src={url} width={sourceWidth} height={sourceHeight} reference={{ focalPoint: point, zoom }} alt="" />}
      <span className="absolute grid size-11 touch-none -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center active:cursor-grabbing" data-focal-marker style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}>
        <span className="size-5 rounded-full border-2 border-white bg-accent shadow" />
      </span>
    </button>
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3"><label className="text-sm font-medium" htmlFor={`${controlId}-zoom`}>Zoom</label><span className="text-xs tabular-nums text-foreground-muted">{zoom.toFixed(1)}×</span></div>
      <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <IconButton type="button" size="sm" aria-label="Zoom out" disabled={disabled || zoom <= 1} onClick={() => onChange({ point, zoom: clampMediaZoom(zoom - 0.1) })}><Minus size={16} /></IconButton>
        <input id={`${controlId}-zoom`} className="w-full cursor-pointer accent-accent" type="range" min="1" max="3" step="0.1" value={zoom} disabled={disabled} onChange={(event) => onChange({ point, zoom: clampMediaZoom(Number(event.target.value)) })} />
        <IconButton type="button" size="sm" aria-label="Zoom in" disabled={disabled || zoom >= 3} onClick={() => onChange({ point, zoom: clampMediaZoom(zoom + 0.1) })}><Plus size={16} /></IconButton>
      </div>
    </div>
    <Button className="mt-2" type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange({ point: { x: 0.5, y: 0.5 }, zoom: 1 })}>Reset image</Button>
  </div>
}
