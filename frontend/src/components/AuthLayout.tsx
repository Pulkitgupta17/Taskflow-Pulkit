import { type ReactNode, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from './AnimatedBackground'
import { CheckSquare } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    // Max tilt of 2 degrees — subtle
    setRotateY(((x - centerX) / centerX) * 2)
    setRotateX((-(y - centerY) / centerY) * 2)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

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

      {/* Card container with 3D perspective */}
      <motion.div
        ref={cardRef}
        className="relative z-10 w-full max-w-[440px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow effect behind card */}
        <div
          className="absolute -inset-4 rounded-3xl opacity-30 blur-3xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2), rgba(249,115,22,0.2))',
          }}
          aria-hidden="true"
        />

        {/* Card with 3D tilt */}
        <motion.div
          className="relative rounded-2xl border border-white/50 shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateX,
            rotateY,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Subtle top border */}
          <div
            className="h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(236,72,153,0.3), rgba(249,115,22,0.3), transparent)',
            }}
            aria-hidden="true"
          />

          <div className="px-8 py-10 sm:px-10">{children}</div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <div className="fixed bottom-4 text-center z-10 text-xs text-slate-400">
        TaskFlow &middot; Task Management
      </div>
    </div>
  )
}
