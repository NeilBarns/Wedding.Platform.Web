import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { useAuth } from '../features/auth/AuthContext'
import { authErrorMessage } from '../features/auth/errorMessage'
import { loginSchema, type LoginFormValues } from '../features/auth/schemas'

function intendedPath(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/events'
  const from = state.from
  if (!from || typeof from !== 'object' || !('pathname' in from)) return '/events'

  const pathname = typeof from.pathname === 'string' ? from.pathname : '/events'
  const search = 'search' in from && typeof from.search === 'string' ? from.search : ''
  return pathname.startsWith('/') && !pathname.startsWith('//') ? `${pathname}${search}` : '/events'
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      await login(values)
      navigate(intendedPath(location.state), { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of ['email', 'password'] as const) {
          const message = error.validationErrors[field]?.[0]
          if (message) setError(field, { message })
        }
      }
      setFormError(authErrorMessage(error))
    }
  })

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface p-6">
        <div>
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-1 text-sm text-foreground-muted">Sign in to manage your events.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {formError && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{formError}</p>}

          <div>
            <label className="block text-sm font-medium" htmlFor="email">Email</label>
            <input className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2" id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="password">Password</label>
            <input className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2" id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>

          <button className="w-full rounded-[10px] bg-accent px-4 py-2 text-accent-foreground hover:bg-accent-hover disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-foreground-muted">New here? <Link className="font-medium text-accent underline" to="/register">Create an account</Link></p>
      </section>
    </main>
  )
}
