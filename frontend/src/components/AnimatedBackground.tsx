import { useEffect, useRef } from 'react'

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number = 0
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    // Gradient orbs configuration — Stripe-style flowing colors
    const orbs = [
      { x: 0.3, y: 0.2, radius: 0.45, color: [124, 58, 237], speed: 0.0008, phase: 0 },        // Purple
      { x: 0.7, y: 0.8, radius: 0.5, color: [249, 115, 22], speed: 0.0006, phase: 2 },           // Orange
      { x: 0.8, y: 0.3, radius: 0.4, color: [236, 72, 153], speed: 0.001, phase: 4 },            // Pink
      { x: 0.2, y: 0.7, radius: 0.35, color: [59, 130, 246], speed: 0.0007, phase: 1 },          // Blue
      { x: 0.5, y: 0.5, radius: 0.55, color: [167, 139, 250], speed: 0.0005, phase: 3 },         // Light purple
      { x: 0.9, y: 0.6, radius: 0.3, color: [251, 146, 60], speed: 0.0009, phase: 5 },           // Light orange
    ]

    const draw = () => {
      time++
      const w = canvas.width
      const h = canvas.height

      // Clear with white base
      ctx.fillStyle = '#fafafa'
      ctx.fillRect(0, 0, w, h)

      // Draw each orb with smooth motion
      for (const orb of orbs) {
        const cx = w * (orb.x + 0.15 * Math.sin(time * orb.speed + orb.phase))
        const cy = h * (orb.y + 0.12 * Math.cos(time * orb.speed * 1.3 + orb.phase))
        const r = Math.max(w, h) * orb.radius

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        gradient.addColorStop(0, `rgba(${orb.color[0]}, ${orb.color[1]}, ${orb.color[2]}, 0.3)`)
        gradient.addColorStop(0.5, `rgba(${orb.color[0]}, ${orb.color[1]}, ${orb.color[2]}, 0.1)`)
        gradient.addColorStop(1, `rgba(${orb.color[0]}, ${orb.color[1]}, ${orb.color[2]}, 0)`)

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      }

      animationId = requestAnimationFrame(draw)
    }

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReduced.matches) {
      // Draw a single static frame
      draw()
      cancelAnimationFrame(animationId)
    } else {
      draw()
    }

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
