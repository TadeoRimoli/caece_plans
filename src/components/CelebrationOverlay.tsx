import { useEffect, useMemo, useRef } from "react"
import { Sparkles, Star, Trophy } from "lucide-react"
import { cn } from "../lib/utils"
import { STATUS_META, type SubjectStatus } from "../types"

export interface CelebrationPayload {
  subjectName: string
  status: Extract<SubjectStatus, "promoted" | "approved_with_final">
}

interface CelebrationOverlayProps {
  payload: CelebrationPayload | null
  onComplete: () => void
}

const CELEBRATION_DURATION_MS = 3800
const MAX_PARTICLES = 90

const CONFETTI_COLORS = [
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#eab308",
  "#06b6d4",
]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rotation: number
  vr: number
  life: number
  decay: number
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function createBurst(x: number, y: number, count: number, power: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomBetween(-0.15, 0.15)
    const speed = randomBetween(power * 0.5, power)
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: randomBetween(4, 7),
      h: randomBetween(3, 5),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: randomBetween(0, Math.PI * 2),
      vr: randomBetween(-0.12, 0.12),
      life: 1,
      decay: randomBetween(0.012, 0.018),
    })
  }
  return particles
}

function CssConfetti({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${randomBetween(0, 100)}%`,
        delay: `${randomBetween(0, 1.2)}s`,
        duration: `${randomBetween(2.2, 3.4)}s`,
        drift: `${randomBetween(-80, 80)}px`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: randomBetween(6, 10),
        height: randomBetween(10, 16),
        rotate: randomBetween(0, 360),
      })),
    []
  )

  if (!active) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-streamer absolute top-0 rounded-sm opacity-90"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDelay: p.delay,
            ["--duration" as string]: p.duration,
            ["--confetti-drift" as string]: p.drift,
            ["--confetti-rotate" as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}

function CelebrationCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const burstsFiredRef = useRef(false)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) return

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    particlesRef.current = []
    burstsFiredRef.current = false

    const w = window.innerWidth
    const h = window.innerHeight

    const scheduleBursts = () => {
      if (burstsFiredRef.current) return
      burstsFiredRef.current = true

      const points = [
        { x: w * 0.5, y: h * 0.42 },
        { x: w * 0.28, y: h * 0.32 },
        { x: w * 0.72, y: h * 0.35 },
        { x: w * 0.5, y: h * 0.28 },
      ]

      points.forEach((pt, i) => {
        window.setTimeout(() => {
          if (particlesRef.current.length < MAX_PARTICLES) {
            particlesRef.current.push(...createBurst(pt.x, pt.y, 18, 5.5))
          }
        }, i * 280)
      })
    }

    scheduleBursts()

    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, w, h)

      const particles = particlesRef.current
      let write = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.07
        p.vx *= 0.985
        p.rotation += p.vr
        p.life -= p.decay

        if (p.life <= 0) continue

        ctx.globalAlpha = Math.min(1, p.life * 1.2)
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()

        particles[write++] = p
      }

      particles.length = write

      if (elapsed < CELEBRATION_DURATION_MS) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      particlesRef.current = []
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}

export function CelebrationOverlay({ payload, onComplete }: CelebrationOverlayProps) {
  useEffect(() => {
    if (!payload) return
    const timer = window.setTimeout(onComplete, CELEBRATION_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [payload, onComplete])

  if (!payload) return null

  const meta = STATUS_META[payload.status]
  const isPromoted = payload.status === "promoted"

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
      aria-label={`Felicitaciones, ${payload.subjectName} ${meta.label}`}
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fadeIn"
        aria-hidden
      />

      <CssConfetti active />
      <CelebrationCanvas active />

      <div className="relative z-10 w-full max-w-md animate-celebrationPop pointer-events-none">
        <div
          className={cn(
            "relative rounded-3xl border overflow-hidden shadow-2xl",
            "bg-slate-950/95 border-white/10"
          )}
          style={{
            boxShadow: `0 0 60px ${meta.color}35, 0 24px 48px rgba(0,0,0,0.5)`,
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${meta.color}, #eab308, transparent)`,
            }}
          />

          <div className="px-6 py-8 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${meta.color}20`,
                color: meta.color,
                boxShadow: `0 0 32px ${meta.color}30`,
              }}
            >
              {isPromoted ? (
                <Star className="h-7 w-7 fill-current" />
              ) : (
                <Trophy className="h-7 w-7" />
              )}
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-300/90 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              ¡Felicitaciones!
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
              {payload.subjectName}
            </h2>

            <p
              className="text-sm font-semibold"
              style={{ color: meta.color }}
            >
              {meta.label}
            </p>

            <p className="mt-3 text-sm text-slate-400">
              {isPromoted
                ? "¡Un paso más cerca del título!"
                : "¡Excelente! Otra materia en el bolsillo."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CELEBRATION_STATUSES = new Set<SubjectStatus>([
  "promoted",
  "approved_with_final",
])

export function shouldCelebrateStatusChange(
  previous: SubjectStatus,
  next: SubjectStatus
): next is CelebrationPayload["status"] {
  return (
    previous !== next &&
    CELEBRATION_STATUSES.has(next) &&
    (next === "promoted" || next === "approved_with_final")
  )
}
