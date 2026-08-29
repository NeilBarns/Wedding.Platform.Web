import { Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useInlineEdit } from './InlineEditContext'
import { inlineTargetKey, type InlineEditingTarget, type InlineFieldPath } from './types'

type Props = {
  sectionId: string
  path: InlineFieldPath
  value: string
  fallback?: string
  showFallbackInEditor?: boolean
  placeholder: string
  label: string
  multiline?: boolean
  className?: string
  narrativeSlot?: { blockId: string; slot: 'eyebrow' | 'heading' | 'body' | 'quote' | 'caption' }
}

export function EditableText(props: Props) {
  const editor = useInlineEdit()
  const target: InlineEditingTarget = props.narrativeSlot
    ? { sectionId: props.sectionId, narrativeBlockId: props.narrativeSlot.blockId, slot: props.narrativeSlot.slot, path: props.path, label: props.label, multiline: props.multiline }
    : { sectionId: props.sectionId, path: props.path, label: props.label, multiline: props.multiline }
  const active = editor?.activeTarget && inlineTargetKey(editor.activeTarget) === inlineTargetKey(target)
  const [entryValue, setEntryValue] = useState(props.value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (active) requestAnimationFrame(() => inputRef.current?.focus())
  }, [active])

  if (!editor) {
    const display = props.value.trim() || props.fallback || null
    if (props.className) return <span className={`${props.multiline ? 'whitespace-pre-line ' : ''}${props.className}`}>{display}</span>
    return props.multiline ? <span className="whitespace-pre-line">{display}</span> : <>{display}</>
  }

  function cancel() {
    editor?.updateValue(target, entryValue)
    editor?.finishEdit()
  }
  function done() { editor?.finishEdit() }
  function change(value: string) { editor?.updateValue(target, value) }

  if (active) {
    const controlClass = `w-full min-w-0 resize-y overflow-hidden border-0 border-b border-[var(--editor-chrome-focus)] bg-[var(--editor-chrome-surface)] px-1 py-0.5 text-[var(--editor-chrome-on-surface)] outline-none ring-2 ring-[color-mix(in_srgb,var(--editor-chrome-focus)_38%,transparent)] ${props.className ?? ''}`
    return <span className="relative z-30 inline-flex w-full max-w-full flex-col items-stretch gap-1" onClick={(event) => event.stopPropagation()}>
      {props.multiline
        ? <textarea ref={(node) => { inputRef.current = node }} rows={3} aria-label={props.label} className={controlClass} value={props.value} onChange={(event) => change(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); cancel() } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); done() } }} />
        : <input ref={(node) => { inputRef.current = node }} aria-label={props.label} className={controlClass} value={props.value} onChange={(event) => change(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); done() } else if (event.key === 'Escape') { event.preventDefault(); cancel() } }} />}
      <span className="flex justify-end gap-1 text-[10px] font-sans font-normal leading-none">
        <button type="button" className="rounded-full bg-[var(--editor-chrome-strong)] p-1.5 text-[var(--editor-chrome-on-strong)] shadow-[var(--editor-chrome-shadow)]" onClick={done} aria-label={`Done editing ${props.label}`} title="Done"><Check size={12} /></button>
        <button type="button" className="rounded-full border border-[color-mix(in_srgb,var(--editor-chrome-focus)_30%,transparent)] bg-[var(--editor-chrome-surface)] p-1.5 text-[var(--editor-chrome-on-surface)] shadow-[var(--editor-chrome-shadow)]" onClick={cancel} aria-label={`Cancel editing ${props.label}`} title="Cancel"><X size={12} /></button>
      </span>
    </span>
  }

  const display = props.value.trim() ? props.value : props.showFallbackInEditor ? props.fallback : null
  return <button
    type="button"
    className={`inline-edit-target max-w-full cursor-text rounded-sm border-0 bg-transparent p-0 text-inherit outline-none ${props.multiline ? 'whitespace-pre-line' : ''} ${props.className ?? ''}`}
    aria-label={`Edit ${props.label}`}
    onClick={(event) => { event.stopPropagation(); setEntryValue(props.value); editor.requestEdit(target) }}
  >{display || <span className="inline-edit-placeholder">{props.placeholder}</span>}</button>
}
