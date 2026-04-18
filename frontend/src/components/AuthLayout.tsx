import { type ReactNode } from 'react'
import { AnimatedBackground } from './AnimatedBackground'
import { CheckSquare } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      <AnimatedBackground />

      {/* Floating logo */}
      <div className="fixed top-6 left-8 z-20 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-800">
          TaskFlow
        </span>
      </div>

      {/* Glassmorphism card container */}
      <div
        className="relative z-10 w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {/* Glow effect behind card */}
        <div
          className="absolute -inset-4 rounded-3xl opacity-40 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2), rgba(249,115,22,0.2))',
          }}
          aria-hidden="true"
        />

        {/* Card */}
        <div
          className="relative rounded-2xl border border-white/40 shadow-2xl shadow-black/5 overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Subtle top gradient line */}
          <div
            className="h-[2px] w-full"
            style={{
              background: 'linear-gradient(90deg, #7C3AED, #EC4899, #F97316, #3B82F6)',
            }}
            aria-hidden="true"
          />

          <div className="px-8 py-10 sm:px-10">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 text-center z-10 text-xs text-slate-400">
        TaskFlow &middot; Task Management
      </div>
    </div>
  )
}
