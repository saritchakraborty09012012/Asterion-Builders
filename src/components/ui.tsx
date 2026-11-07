import React, {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import gsap from 'gsap'

export const EASE = [0.16, 1, 0.3, 1] as const
export const EASE_SILK = [0.22, 1, 0.36, 1] as const

/* ------------------------------------------------------------------ */
/*  word-by-word masked reveal                                         */
/* ------------------------------------------------------------------ */
export function Words({
  text,
  className = '',
  delay = 0,
  stagger = 0.055,
  once = true,
  as = 'span',
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  once?: boolean
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p'
}) {
  const Tag = motion[as] as typeof motion.span
  const words = text.split(' ')
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-8% 0px -8% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: '0.09em', marginBottom: '-0.09em' }}
          aria-hidden
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hidden: { y: '112%', rotate: 2 },
              show: { y: 0, rotate: 0 },
            }}
            transition={{ duration: 1.15, ease: EASE }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/* ------------------------------------------------------------------ */
/*  simple fade / rise                                                 */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 34,
  className = '',
  once = true,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-10% 0px' }}
      transition={{ duration: 1.15, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  parallax image                                                     */
/* ------------------------------------------------------------------ */
export function Parallax({
  src,
  alt,
  className = '',
  imgClassName = '',
  strength = 10,
  scale = 1.15,
  priority = false,
  style,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  strength?: number
  scale?: number
  priority?: boolean
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`])
  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={style}>
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{ y, scale }}
        className={`h-full w-full object-cover will-change-transform ${imgClassName}`}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  magnetic wrapper                                                   */
/* ------------------------------------------------------------------ */
export function Magnetic({
  children,
  strength = 0.22,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={(e) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left - r.width / 2) * strength
        const y = (e.clientY - r.top - r.height / 2) * strength
        gsap.to(el, { x, y, duration: 0.7, ease: 'power3.out' })
      }}
      onPointerLeave={() => {
        if (ref.current)
          gsap.to(ref.current, {
            x: 0,
            y: 0,
            duration: 0.9,
            ease: 'elastic.out(1, 0.35)',
          })
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  counters                                                           */
/* ------------------------------------------------------------------ */
export function Counter({
  value,
  suffix = '',
  pad = 0,
  className = '',
}: {
  value: number
  suffix?: string
  pad?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf = 0
    const t0 = performance.now()
    const dur = 1700
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const ease = 1 - Math.pow(1 - p, 4)
      setN(Math.round(value * ease))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])
  return (
    <span ref={ref} className={className}>
      {String(n).padStart(pad, '0')}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  section label with rule                                            */
/* ------------------------------------------------------------------ */
export function Label({
  index,
  children,
  className = '',
  light = false,
}: {
  index?: string
  children: ReactNode
  className?: string
  light?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 eyebrow ${
        light ? 'text-bone/75' : 'text-ink/75'
      } ${className}`}
    >
      {index && <span className="tabular-nums">{index}</span>}
      <span className="h-px w-10 bg-current opacity-40" />
      <span>{children}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  arrow                                                              */
/* ------------------------------------------------------------------ */
export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-3.5 w-3.5 ${className}`}
      aria-hidden
    >
      <path
        d="M4 12h15M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  scroll progress readout for pinned sections                        */
/* ------------------------------------------------------------------ */
export function useSectionProgress(ref: React.RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const smooth = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.35,
  })
  return { raw: scrollYProgress, smooth }
}

/* ------------------------------------------------------------------ */
/*  hover state outside R3F                                            */
/* ------------------------------------------------------------------ */
export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}
