import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { authErrorMessage } from '../features/auth/errorMessage'
import { registerSchema, type RegisterFormValues } from '../features/auth/schemas'
import { ApiError } from '../lib/api'

export function RegisterPage() {
  const { register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      await createAccount(values)
      navigate('/events', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of ['name', 'email', 'password', 'passwordConfirmation'] as const) {
          const message = error.validationErrors[field]?.[0]
          if (message) setError(field, { message })
        }
      }
      setFormError(authErrorMessage(error))
    }
  })

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-md space-y-6 rounded-lg border bg-white p-6">
        <div>
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="mt-1 text-sm text-slate-600">Start managing your events.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {formError && <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">{formError}</p>}

          <div>
            <label className="block text-sm font-medium" htmlFor="name">Name</label>
            <input className="mt-1 w-full rounded border px-3 py-2" id="name" type="text" autoComplete="name" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-red-700">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="email">Email</label>
            <input className="mt-1 w-full rounded border px-3 py-2" id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-red-700">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="password">Password</label>
            <input className="mt-1 w-full rounded border px-3 py-2" id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-red-700">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="passwordConfirmation">Confirm password</label>
            <input className="mt-1 w-full rounded border px-3 py-2" id="passwordConfirmation" type="password" autoComplete="new-password" {...register('passwordConfirmation')} />
            {errors.passwordConfirmation && <p className="mt-1 text-sm text-red-700">{errors.passwordConfirmation.message}</p>}
          </div>

          <button className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-slate-600">Already have an account? <Link className="underline" to="/login">Sign in</Link></p>
      </section>
    </main>
  )
}
