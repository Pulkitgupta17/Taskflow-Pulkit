import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { login as loginApi } from '@/api/auth'
import { AuthLayout } from '@/components/AuthLayout'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address'
    if (!password) newErrors.password = 'Password is required'
    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setIsLoading(true)

    try {
      const data = await loginApi({ email, password })
      login(data.token, data.user)
      navigate('/projects')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Login failed. Please try again.'
      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {apiError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Email field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            className={`
              w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900
              placeholder:text-slate-400 outline-none transition-all duration-200
              ${errors.email
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200'
              }
            `}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 pl-0.5">{errors.email}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            className={`
              w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900
              placeholder:text-slate-400 outline-none transition-all duration-200
              ${errors.password
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200'
              }
            `}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1 pl-0.5">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            group relative w-full flex items-center justify-center gap-2
            rounded-lg px-4 py-2.5 text-sm font-semibold text-white
            bg-gradient-to-r from-violet-600 to-indigo-600
            shadow-sm
            hover:from-violet-700 hover:to-indigo-700
            active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200
            cursor-pointer
          "
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
