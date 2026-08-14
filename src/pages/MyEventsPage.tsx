import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { authErrorMessage } from '../features/auth/errorMessage'

export function MyEventsPage() {
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
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">My Events</h1>
        <p className="mt-2">Signed in as {user?.name}</p>
        <p className="text-sm text-slate-600">{user?.email}</p>
      </div>

      {logoutError && <p className="text-sm text-red-700" role="alert">{logoutError}</p>}

      <button className="rounded border px-4 py-2 disabled:opacity-60" type="button" disabled={isLoggingOut} onClick={() => void handleLogout()}>
        {isLoggingOut ? 'Logging out…' : 'Logout'}
      </button>
    </main>
  )
}
