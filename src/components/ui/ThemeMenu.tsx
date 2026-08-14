import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTheme, type ThemePreference } from '../../app/theme/ThemeContext'

const options = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export function ThemeMenu() {
  const { preference, setPreference } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = options.find((option) => option.value === preference) ?? options[0]
  const CurrentIcon = current.icon

  useEffect(() => {
    if (!open) return
    itemRefs.current[options.findIndex((option) => option.value === preference)]?.focus()

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, preference])

  function closeAndFocus() {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      closeAndFocus()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      itemRefs.current[(index + 1) % options.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      itemRefs.current[(index - 1 + options.length) % options.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      itemRefs.current[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      itemRefs.current[options.length - 1]?.focus()
    }
  }

  function select(value: ThemePreference) {
    setPreference(value)
    closeAndFocus()
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        <CurrentIcon aria-hidden="true" size={15} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown aria-hidden="true" className="text-foreground-muted" size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-36 rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-dialog)]"
          role="menu"
          aria-label="Theme preference"
          onKeyDown={onMenuKeyDown}
        >
          {options.map((option, index) => {
            const Icon = option.icon
            const selected = option.value === preference
            return (
              <button
                ref={(element) => { itemRefs.current[index] = element }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-muted"
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                key={option.value}
                onClick={() => select(option.value)}
              >
                <Icon aria-hidden="true" size={15} />
                <span className="flex-1">{option.label}</span>
                {selected && <Check aria-hidden="true" className="text-accent" size={15} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
