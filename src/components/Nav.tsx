import { useEffect, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion'
import { scrollToId } from '../lib/scroll'

const LINKS = [
  { label: 'The arrival', href: '#top' },
  { label: 'Residences', href: '#residences' },
  { label: 'Interiors', href: '#interiors' },
  { label: 'Amenities', href: '#amenities' },
  { label: 'The address', href: '#location' },
]

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 text-left"
      aria-label="Asterion — back to top"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 md:h-7 md:w-7" aria-hidden>
        <g stroke="currentColor" strokeWidth="0.8" fill="none">
          <path d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M25.9 6.1L6.1 25.9" />
          <circle cx="16" cy="16" r="5.2" opacity="0.65" />
          <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" />
        </g>
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[0.8rem] font-normal tracking-[0.34em] md:text-[0.92rem]">
          ASTERION
        </span>
        <span className="mt-1 text-[0.42rem] tracking-[0.42em] opacity-55">
          RESIDENCE
        </span>
      </span>
    </button>
  )
}

export default function Nav() {
  const { scrollY, scrollYProgress } = useScroll()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [curtain, setCurtain] = useState(false)

  useEffect(() => {
    const target = document.getElementById('door-exit')
    if (!target) return
    // hysteresis: hide only well inside the door section, show only well
    // outside it — a single 0.01 threshold made the header flicker at the
    // boundary every time scroll paused there.
    let inside = false
    const io = new IntersectionObserver(
      ([entry]) => {
        const r = entry.intersectionRatio
        if (!inside && r > 0.18) {
          inside = true
          setCurtain(true)
        } else if (inside && r < 0.06) {
          inside = false
          setCurtain(false)
        }
      },
      { threshold: [0, 0.06, 0.18, 0.4] }
    )
    io.observe(target)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (curtain) setOpen(false)
  }, [curtain])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useMotionValueEvent(scrollY, 'change', (v) => {
    setSolid(v > 80)
  })

  const go = (href: string) => {
    setOpen(false)
    scrollToId(href)
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-[opacity,transform] duration-700 ease-out ${
          curtain ? 'pointer-events-none -translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div
          className="nav-shell"
          data-solid={solid || open ? 'true' : 'false'}
        >
          <div className="mx-auto flex h-[72px] max-w-[1800px] items-center justify-between px-[var(--gutter)] md:h-[84px]">
            <Logo onClick={() => go('#top')} />

            <nav className="hidden items-center gap-9 lg:flex">
              {LINKS.map((l) => (
                <button
                  key={l.href}
                  onClick={() => go(l.href)}
                  className="nav-link text-[0.6rem] uppercase tracking-[0.26em]"
                >
                  <span>{l.label}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-6">
              <button
                onClick={() => go('#contact')}
                className="hidden items-center gap-3 text-[0.58rem] uppercase tracking-[0.3em] sm:flex"
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="link-underline">Register interest</span>
              </button>

              <button
                onClick={() => setOpen((v) => !v)}
                className="group flex items-center gap-2.5 lg:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
              >
                <span className="flex h-3 w-5 flex-col justify-between">
                  <span
                    className={`h-px w-full bg-current transition-transform duration-500 ${
                      open ? 'translate-y-[5.5px] rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`h-px w-full bg-current transition-opacity duration-300 ${
                      open ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`h-px w-full bg-current transition-transform duration-500 ${
                      open ? '-translate-y-[5.5px] -rotate-45' : ''
                    }`}
                  />
                </span>
                <span className="text-[0.5rem] uppercase tracking-[0.3em]">
                  {open ? 'Close' : 'Menu'}
                </span>
              </button>
            </div>
          </div>

          <motion.div
            className="h-px origin-left bg-clay"
            style={{ scaleX: scrollYProgress, opacity: solid ? 0.9 : 0.4 }}
          />
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] flex flex-col justify-between bg-forest-deep px-[var(--gutter)] pb-10 pt-28 text-bone"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="flex flex-col">
              {LINKS.map((l, i) => (
                <motion.button
                  key={l.href}
                  onClick={() => go(l.href)}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.25 + i * 0.07,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-baseline gap-5 border-b border-bone/10 py-4 text-left"
                >
                  <span className="text-[0.5rem] tracking-[0.2em] text-bone/65">
                    0{i + 1}
                  </span>
                  <span className="font-display text-[clamp(2rem,7vw,3.6rem)] uppercase leading-none">
                    {l.label}
                  </span>
                </motion.button>
              ))}
            </nav>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="eyebrow text-bone/65">Sales gallery · Noida</span>
                <a href="tel:+911200000000" className="text-lg font-light tracking-wide">
                  +91 120 000 0000
                </a>
                <a
                  href="mailto:living@asterion.in"
                  className="text-sm font-light tracking-wide text-bone/65"
                >
                  living@asterion.in
                </a>
              </div>
              <button
                onClick={() => go('#contact')}
                className="btn-line self-start border-bone/40 text-bone"
              >
                Register interest
                <span aria-hidden>→</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
