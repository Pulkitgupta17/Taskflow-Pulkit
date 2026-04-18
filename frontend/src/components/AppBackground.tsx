import { useEffect, useState } from 'react'

export function AppBackground() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      {/* Orb 1 — top-right, purple-blue */}
      <div
        className={`absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.05] ${reduced ? '' : 'animate-float-slow'}`}
        style={{
          background: 'radial-gradient(circle, #7C3AED 0%, #3B82F6 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Orb 2 — bottom-left, pink-orange */}
      <div
        className={`absolute -bottom-[15%] -left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.04] ${reduced ? '' : 'animate-float-slow-reverse'}`}
        style={{
          background: 'radial-gradient(circle, #EC4899 0%, #F97316 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Orb 3 — center, very subtle blue */}
      <div
        className={`absolute top-[40%] left-[50%] -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04] dark:opacity-[0.03] ${reduced ? '' : 'animate-float-drift'}`}
        style={{
          background: 'radial-gradient(circle, #6366F1 0%, #8B5CF6 40%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Grid pattern overlay — very subtle */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}
