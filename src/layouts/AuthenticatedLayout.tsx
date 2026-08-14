import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ThemeMenu } from '../components/ui/ThemeMenu'
import { useAuth } from '../features/auth/AuthContext'
import { authErrorMessage } from '../features/auth/errorMessage'

export function AuthenticatedLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(authErrorMessage(error))
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center gap-2.5 px-4 sm:px-5 lg:px-6">
          <NavLink className="mr-auto flex items-center gap-2 text-sm font-semibold tracking-tight" to="/events">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-xs text-accent-foreground">E</span>
            <span className="hidden sm:inline">Event Platform</span>
          </NavLink>

          <NavLink className={({ isActive }) => `hidden rounded-lg px-2.5 py-1.5 text-sm font-medium sm:block ${isActive ? 'bg-surface-muted text-foreground' : 'text-foreground-muted hover:text-foreground'}`} to="/events">My Events</NavLink>

          <ThemeMenu />

          <div className="hidden min-w-0 text-right md:block">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="max-w-40 truncate text-[11px] text-foreground-muted">{user?.email}</p>
          </div>

          <button className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-foreground-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-60" type="button" disabled={isLoggingOut} onClick={() => void handleLogout()} aria-label={isLoggingOut ? 'Logging out' : 'Logout'}>
            <LogOut aria-hidden="true" size={16} />
          </button>
        </div>
        {logoutError && <p className="border-t border-border bg-danger-muted px-4 py-2 text-center text-sm text-danger" role="alert">{logoutError}</p>}
      </header>
      <Outlet />
    </div>
  )
}
