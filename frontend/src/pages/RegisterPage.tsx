import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { register as registerApi } from '@/api/auth'
import { AuthLayout } from '@/components/AuthLayout'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'
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
      const data = await registerApi({ name: name.trim(), email, password })
      login(data.token, data.user)
      navigate('/projects')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Registration failed. Please try again.'
      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClassName = (error?: string) => `
    w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900
    placeholder:text-slate-400 outline-none transition-all duration-200
    ${error
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200'
    }
  `

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Get started with TaskFlow in seconds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Name field */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="John Doe"
            autoComplete="name"
            autoFocus
            className={inputClassName(errors.name)}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1 pl-0.5">{errors.name}</p>
          )}
        </div>

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
            className={inputClassName(errors.email)}
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            className={inputClassName(errors.password)}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1 pl-0.5">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
            }}
            placeholder="Repeat your password"
            autoComplete="new-password"
            className={inputClassName(errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1 pl-0.5">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-1">
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
                Create Account
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
