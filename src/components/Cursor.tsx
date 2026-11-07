import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<'none' | 'link' | 'view'>('none')

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    document.documentElement.classList.add('has-cursor')
    if (!dot.current || !ring.current) return

    gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50 })
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })

    const move = (e: PointerEvent) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }

    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        '[data-cursor], a, button, input, textarea, select, label'
      )
      if (!el) {
        setHover('none')
        return
      }
      const custom = el.getAttribute('data-cursor')
      if (custom === 'view') setHover('view')
      else if (custom === 'none') setHover('none')
      else setHover('link')
    }

    const down = () => gsap.to(ring.current, { scale: 0.86, duration: 0.3 })
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.4 })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)

    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <div className="pointer-events-none hidden md:block" aria-hidden>
      <div ref={dot} className="cursor-dot" />
      <div
        ref={ring}
        className="cursor-ring"
        data-hover={hover === 'none' ? undefined : hover}
      >
        <span className="cursor-label">
          {hover === 'view' ? 'View' : ''}
        </span>
      </div>
    </div>
  )
}
