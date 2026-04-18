import { useEffect, useState } from 'react'

const ribbons = [
  {
    // Large purple ribbon — top-left, sweeps right
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 40%, #EC4899 100%)',
    size: '150vh',
    top: '-40%',
    left: '-20%',
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    animation: 'ribbonDrift1 25s ease-in-out infinite',
    opacity: 0.6,
    blur: 0,
  },
  {
    // Hot pink ribbon — bottom-right, sweeps left
    gradient: 'linear-gradient(220deg, #EC4899 0%, #F472B6 50%, #F97316 100%)',
    size: '130vh',
    top: '20%',
    left: '40%',
    borderRadius: '70% 30% 30% 70% / 60% 40% 60% 40%',
    animation: 'ribbonDrift2 28s ease-in-out infinite',
    opacity: 0.5,
    blur: 0,
  },
  {
    // Orange ribbon — bottom-left
    gradient: 'linear-gradient(45deg, #F97316 0%, #FB923C 50%, #F472B6 100%)',
    size: '120vh',
    top: '30%',
    left: '-30%',
    borderRadius: '50% 50% 30% 70% / 40% 60% 40% 60%',
    animation: 'ribbonDrift3 22s ease-in-out infinite',
    opacity: 0.45,
    blur: 30,
  },
  {
    // Blue ribbon — top-right, for depth
    gradient: 'linear-gradient(300deg, #3B82F6 0%, #8B5CF6 60%, #7C3AED 100%)',
    size: '110vh',
    top: '-30%',
    left: '50%',
    borderRadius: '40% 60% 50% 50% / 50% 50% 60% 40%',
    animation: 'ribbonDrift4 30s ease-in-out infinite',
    opacity: 0.4,
    blur: 20,
  },
  {
    // Small vivid accent — center-ish, sharp
    gradient: 'linear-gradient(180deg, #8B5CF6 0%, #EC4899 100%)',
    size: '80vh',
    top: '10%',
    left: '20%',
    borderRadius: '60% 40% 60% 40% / 40% 60% 40% 60%',
    animation: 'ribbonDrift5 26s ease-in-out infinite',
    opacity: 0.35,
    blur: 0,
  },
]

const keyframes = `
@keyframes ribbonDrift1 {
  0%, 100% {
    transform: rotate(0deg) translate(0, 0) scale(1);
  }
  33% {
    transform: rotate(8deg) translate(5%, 3%) scale(1.05);
  }
  66% {
    transform: rotate(-5deg) translate(-3%, 5%) scale(0.97);
  }
}

@keyframes ribbonDrift2 {
  0%, 100% {
    transform: rotate(0deg) translate(0, 0) scale(1);
  }
  33% {
    transform: rotate(-10deg) translate(-4%, -3%) scale(1.03);
  }
  66% {
    transform: rotate(6deg) translate(3%, -5%) scale(0.95);
  }
}

@keyframes ribbonDrift3 {
  0%, 100% {
    transform: rotate(0deg) translate(0, 0) scale(1);
  }
  25% {
    transform: rotate(12deg) translate(6%, 2%) scale(1.04);
  }
  50% {
    transform: rotate(-3deg) translate(2%, 6%) scale(1.02);
  }
  75% {
    transform: rotate(-8deg) translate(-4%, 3%) scale(0.96);
  }
}

@keyframes ribbonDrift4 {
  0%, 100% {
    transform: rotate(0deg) translate(0, 0) scale(1);
  }
  50% {
    transform: rotate(-12deg) translate(-5%, 4%) scale(1.06);
  }
}

@keyframes ribbonDrift5 {
  0%, 100% {
    transform: rotate(0deg) translate(0, 0) scale(1);
  }
  33% {
    transform: rotate(15deg) translate(4%, -4%) scale(1.08);
  }
  66% {
    transform: rotate(-7deg) translate(-6%, 2%) scale(0.94);
  }
}
`

export function AnimatedBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div
        className="fixed inset-0 w-full h-full overflow-hidden"
        style={{ zIndex: 0, background: '#fafafa' }}
        aria-hidden="true"
      >
        {ribbons.map((ribbon, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: ribbon.size,
              height: ribbon.size,
              top: ribbon.top,
              left: ribbon.left,
              borderRadius: ribbon.borderRadius,
              background: ribbon.gradient,
              opacity: ribbon.opacity,
              filter: ribbon.blur > 0 ? `blur(${ribbon.blur}px)` : undefined,
              animation: reducedMotion ? 'none' : ribbon.animation,
              willChange: 'transform',
            }}
          />
        ))}
      </div>
    </>
  )
}
