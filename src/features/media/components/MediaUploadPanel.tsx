import { useRef, useState } from 'react'
import { CheckCircle2, Clock3, LoaderCircle, Upload, XCircle } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { formatFileSize } from '../../../lib/formatFileSize'

type QueueStatus = 'queued' | 'uploading' | 'success' | 'failed'
type QueueItem = { id: string; file: File; status: QueueStatus; error?: string }
type PendingItem = Pick<QueueItem, 'id' | 'file'>

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxBytes = 20 * 1024 * 1024
let fallbackIdSequence = 0

function createQueueId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  fallbackIdSequence += 1
  return `media-upload-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}-${Math.random().toString(36).slice(2)}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to upload this image.'
}

export function MediaUploadPanel({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null)
  const pending = useRef<PendingItem[]>([])
  const processing = useRef(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [dragging, setDragging] = useState(false)

  const update = (id: string, change: Partial<QueueItem>) => setQueue((current) => current.map((item) => item.id === id ? { ...item, ...change } : item))

  const processQueue = async () => {
    if (processing.current) return
    processing.current = true
    while (pending.current.length > 0) {
      const item = pending.current.shift()
      if (!item) continue
      update(item.id, { status: 'uploading' })
      try {
        await onUpload(item.file)
        update(item.id, { status: 'success' })
      } catch (error) {
        update(item.id, { status: 'failed', error: errorMessage(error) })
      }
    }
    processing.current = false
  }

  const enqueue = (files: File[]) => {
    const items = files.map((file): QueueItem => {
      const item = { id: createQueueId(), file, status: 'queued' as const }
      if (!acceptedTypes.has(file.type)) return { ...item, status: 'failed', error: 'Only JPEG, PNG, and WebP images are supported.' }
      if (file.size > maxBytes) return { ...item, status: 'failed', error: 'Image exceeds the 20 MB upload limit.' }
      pending.current.push(item)
      return item
    })
    setQueue((current) => [...items, ...current])
    void processQueue()
  }

  const counts = queue.reduce((result, item) => ({ ...result, [item.status]: result[item.status] + 1 }), { queued: 0, uploading: 0, success: 0, failed: 0 })
  const active = counts.queued + counts.uploading

  return <section className="rounded-xl border border-border bg-surface p-4">
    <div
      className={`rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${dragging ? 'border-accent bg-surface-muted' : 'border-border'}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); enqueue(Array.from(event.dataTransfer.files)) }}
    >
      <Upload className="mx-auto text-foreground-muted" aria-hidden="true" size={20} />
      <p className="mt-2 text-sm font-medium">{dragging ? 'Drop images to upload' : 'Drag & drop images here'}</p>
      <p className="my-2 text-xs text-foreground-muted">or</p>
      <input ref={input} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { enqueue(Array.from(event.target.files ?? [])); event.target.value = '' }} />
      <Button type="button" variant="secondary" onClick={() => input.current?.click()}>Choose images</Button>
      <p className="mt-2 text-xs text-foreground-muted">JPEG, PNG, WebP · up to 20 MB each</p>
    </div>

    {queue.length > 0 && <div className="mt-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{active > 0 ? `Uploading ${active} ${active === 1 ? 'image' : 'images'}` : 'Uploads complete'}</p>
        <Button size="sm" variant="ghost" onClick={() => setQueue((current) => current.filter(({ status }) => status === 'queued' || status === 'uploading'))}>Clear completed</Button>
      </div>
      <p className="mt-1 text-xs text-foreground-muted">{counts.success} uploaded · {counts.failed} failed{active > 0 ? ` · ${active} remaining` : ''}</p>
      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {queue.map((item) => <QueueRow key={item.id} item={item} />)}
      </ul>
    </div>}
  </section>
}

function QueueRow({ item }: { item: QueueItem }) {
  const status = {
    queued: { icon: <Clock3 aria-hidden="true" size={16} />, label: 'Queued' },
    uploading: { icon: <LoaderCircle className="animate-spin" aria-hidden="true" size={16} />, label: 'Uploading…' },
    success: { icon: <CheckCircle2 className="text-accent" aria-hidden="true" size={16} />, label: 'Uploaded' },
    failed: { icon: <XCircle className="text-danger" aria-hidden="true" size={16} />, label: item.error ?? 'Upload failed' },
  }[item.status]
  return <li className="flex items-start gap-2 rounded-md bg-surface-muted px-3 py-2 text-sm">
    <span className="mt-0.5 shrink-0">{status.icon}</span>
    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.file.name}</span><span className="block text-xs text-foreground-muted">{formatFileSize(item.file.size)} · {status.label}</span></span>
  </li>
}
