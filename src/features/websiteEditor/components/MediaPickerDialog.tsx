import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dialog, DialogHeader } from '../../../components/ui/Dialog'
import { Input } from '../../../components/ui/Input'
import { getMediaAssets, uploadMediaAsset } from '../../media/api'
import type { MediaAsset } from '../../media/types'
import { MediaUploadPanel } from '../../media/components/MediaUploadPanel'

export function MediaPickerDialog({ open, eventId, selectedAssetId, onClose, onSelect }: { open: boolean; eventId: string; selectedAssetId?: string; onClose: () => void; onSelect: (asset: MediaAsset) => void }) {
  const [search, setSearch] = useState('')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setLoading(true); setFailed(false)
      getMediaAssets(eventId, { search }, controller.signal).then(({ assets: result }) => setAssets(result)).catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true)
      }).finally(() => setLoading(false))
    }, 300)
    return () => { window.clearTimeout(timeout); controller.abort() }
  }, [eventId, open, refresh, search])

  return <Dialog open={open} onClose={onClose} titleId="media-picker-title" size="xl">
    <DialogHeader className="border-b border-border p-4 sm:px-5" title="Choose from Media" titleId="media-picker-title" description="Select an image from this Event Media Library." onClose={onClose} />
    <div className="p-4 sm:p-5"><Input value={search} aria-label="Search Media" placeholder="Search media..." onChange={(event) => setSearch(event.target.value)} />
      <div className="mt-3"><MediaUploadPanel compact onUpload={(file) => uploadMediaAsset(eventId, file)} onBatchComplete={({ fileCount, assets: uploaded }) => {
        if (uploaded.length > 0) setRefresh((value) => value + 1)
        if (fileCount === 1 && uploaded.length === 1) onSelect(uploaded[0])
      }} /></div>
      {loading ? <p className="py-10 text-center text-sm text-foreground-muted">Loading images…</p> : failed ? <p className="py-10 text-center text-sm text-danger">Unable to load Media.</p> : assets.length === 0 ? <div className="py-10 text-center"><ImageOff className="mx-auto text-foreground-muted" /><p className="mt-3 font-medium">No images yet</p><p className="mt-1 text-sm text-foreground-muted">Upload your first image here or open Media Library.</p><Link className="mt-4 inline-flex rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-foreground" to={`/events/${eventId}/media`}>Open Media</Link></div> :
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{assets.map((asset) => <button className={`overflow-hidden rounded-lg border text-left ${selectedAssetId === asset.id ? 'border-2 border-accent bg-surface-muted' : 'border-border'}`} type="button" key={asset.id} onClick={() => onSelect(asset)} aria-pressed={selectedAssetId === asset.id}><img className="aspect-[4/3] w-full object-cover" src={asset.variants.thumbnail.url} alt="" /><span className="block truncate p-2 text-xs font-medium">{asset.originalFilename}</span></button>)}</div>}
    </div>
  </Dialog>
}
