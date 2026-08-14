import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemePreference } from './ThemeContext'

const STORAGE_KEY = 'event-platform-theme'

function savedPreference(): ThemePreference {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

function applyTheme(preference: ThemePreference) {
  const isDark = preference === 'dark'
    || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(savedPreference)

  useEffect(() => {
    applyTheme(preference)
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (preference === 'system') applyTheme('system') }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const value = useMemo(() => ({
    preference,
    setPreference(next: ThemePreference) {
      setPreferenceState(next)
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
    },
  }), [preference])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
