import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Arrow, Label } from '../components/ui'
import { AMENITIES } from '../data/site'
import { lockScroll, unlockScroll } from '../lib/scroll'

const EASE = [0.22, 1, 0.36, 1] as const
const ROTATE_MS = 4800

export default function Amenities() {
  const [active, setActive] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [paused, setPaused] = useState(false)
  const [open, setOpen] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (paused || open) return
    timer.current = window.setTimeout(() => {
      setActive((i) => (i + 1) % AMENITIES.length)
      setCycle((c) => c + 1)
    }, ROTATE_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [active, paused, open, cycle])

  useEffect(() => {
    if (!open) return
    lockScroll()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') {
        setActive((i) => (i + 1) % AMENITIES.length)
        setCycle((c) => c + 1)
      }
      if (e.key === 'ArrowLeft') {
        setActive((i) => (i - 1 + AMENITIES.length) % AMENITIES.length)
        setCycle((c) => c + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      unlockScroll()
    }
  }, [open])

  const choose = (i: number) => {
    setActive(i)
    setCycle((c) => c + 1)
  }

  const a = AMENITIES[active]

  return (
    <section id="amenities" className="relative overflow-hidden bg-forest-deep text-bone">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_20%,rgba(165,126,86,0.18),transparent_58%)]" />

      <div className="relative px-[var(--gutter)] pb-16 pt-24 md:pb-24 md:pt-32">
        <div className="flex items-start justify-between border-b border-bone/12 pb-5">
          <Label index="04" light>
            The amenities
          </Label>
          <span className="micro hidden text-bone/70 md:block">Twelve rooms · beneath the tower</span>
        </div>

        <div className="mt-9 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2 className="display text-[clamp(3rem,7.2vw,7.4rem)] leading-[0.84] text-bone">
              The hours
              <br />
              <span className="italic text-bone/70">between.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="body-copy max-w-[360px] text-bone/75">
              Between work and home, there is a third life: a swim before breakfast,
              a game after sunset, a long table for no particular reason. Twelve
              rooms, all of them yours.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.24em] text-bone/60">
              <span className="h-1 w-1 rounded-full bg-clay" />
              <span>Changing automatically · tap any name</span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-12 lg:gap-10">
          {/* list */}
          <div className="order-2 lg:order-1 lg:col-span-5">
            <div className="grid grid-cols-1 border-t border-bone/12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1 lg:gap-x-0">
              {AMENITIES.map((item, i) => {
                const on = i === active
                return (
                  <button
                    key={item.name}
                    onClick={() => choose(i)}
                    onMouseEnter={() => {
                      setPaused(true)
                      choose(i)
                    }}
                    onMouseLeave={() => setPaused(false)}
                    aria-pressed={on}
                    className={`group relative flex items-center gap-4 border-b border-bone/12 py-3 pl-3 text-left transition-all duration-500 lg:py-[0.72rem] ${
                      on
                        ? 'bg-[linear-gradient(90deg,rgba(214,200,180,0.09),rgba(214,200,180,0.015)_72%,transparent)] text-bone'
                        : 'text-bone/70 hover:bg-bone/[0.03] hover:text-bone/80'
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 bg-clay transition-opacity duration-500 ${
                        on ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span className={`text-[0.46rem] tabular-nums tracking-[0.2em] ${on ? 'text-clay' : 'text-bone/60'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="relative flex-1 overflow-hidden">
                      <span className={`block truncate text-[0.72rem] tracking-wide transition-all duration-500 ${on ? 'translate-x-1 font-normal' : 'font-light group-hover:translate-x-1'}`}>
                        {item.name}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-[0.42rem] uppercase tracking-[0.18em] text-bone/60 md:block">
                      {item.meta}
                    </span>
                    <span
                      className={`h-px shrink-0 transition-all duration-500 ${on ? 'w-6 bg-clay' : 'w-2 bg-bone/15'}`}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* artwork */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div
              className="group relative"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="relative aspect-[4/3] overflow-hidden border border-bone/12 bg-[#0b130e]">
                <AnimatePresence mode="popLayout">
                  <motion.button
                    key={a.name}
                    onClick={() => setOpen(true)}
                    initial={{ opacity: 0, scale: 1.035 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.9, ease: EASE }}
                    className="absolute inset-0 block h-full w-full cursor-pointer text-left"
                    aria-label={`View ${a.name}`}
                  >
                    <img
                      src={a.image}
                      alt={a.name}
                      loading="lazy"
                      className="h-full w-full object-cover [filter:saturate(0.92)_contrast(1.04)]"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070c09]/85 via-[#070c09]/10 to-transparent" />
                  </motion.button>
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-5 p-5 md:p-7">
                  <div>
                    <div className="flex items-center gap-3 text-[0.46rem] uppercase tracking-[0.26em] text-bone/70">
                      <span>{String(active + 1).padStart(2, '0')} / 12</span>
                      <span className="h-px w-7 bg-bone/25" />
                      <span>{a.meta}</span>
                    </div>
                    <div className="mt-2 font-display text-[clamp(1.7rem,3.2vw,2.7rem)] leading-none text-bone">
                      {a.name}
                    </div>
                    <p className="mt-2 max-w-[360px] text-[0.66rem] font-light leading-relaxed text-bone/75">
                      {a.desc}
                    </p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-2 text-[0.44rem] uppercase tracking-[0.22em] text-bone/70 md:flex">
                    Enlarge <Arrow />
                  </span>
                </div>
              </div>

              {/* progress */}
              <div className="mt-3 flex items-center gap-4">
                <div className="h-px flex-1 bg-bone/12">
                  <motion.div
                    key={`${active}-${cycle}-${paused}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: paused ? 0.35 : 1 }}
                    transition={{ duration: paused ? 0.4 : ROTATE_MS / 1000, ease: 'linear' }}
                    className="h-px origin-left bg-clay"
                  />
                </div>
                <span className="text-[0.44rem] uppercase tracking-[0.22em] text-bone/55">
                  {paused ? 'Paused' : 'Auto'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-5 border-t border-bone/12 pt-6">
          <p className="max-w-[520px] text-[0.68rem] font-light leading-relaxed text-bone/70">
            A private club without the club: every space is shared, none of it is
            crowded. Landscape by Asterion Studio, interiors by the same hand as
            the residences.
          </p>
          <div className="flex items-center gap-3 text-[0.46rem] uppercase tracking-[0.24em] text-bone/60">
            <span>Podium · Ground · Level 01</span>
            <span className="h-px w-8 bg-bone/20" />
            <span>Noida</span>
          </div>
        </div>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[160] overflow-y-auto bg-[#070c09] text-bone"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative flex min-h-full flex-col px-[var(--gutter)] pb-10 pt-24 md:pt-28"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-bone/10 pb-4">
                <div className="flex items-center gap-3 text-[0.48rem] uppercase tracking-[0.26em] text-bone/70">
                  <span className="h-1 w-1 rounded-full bg-clay" />
                  <span>Amenity {String(active + 1).padStart(2, '0')} / 12</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActive((i) => (i - 1 + AMENITIES.length) % AMENITIES.length)
                      setCycle((c) => c + 1)
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full border border-bone/20 text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
                    aria-label="Previous amenity"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setActive((i) => (i + 1) % AMENITIES.length)
                      setCycle((c) => c + 1)
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full border border-bone/20 text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
                    aria-label="Next amenity"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-bone/20 text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
                    aria-label="Close"
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-7 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-8">
                  <img
                    src={a.image}
                    alt={a.name}
                    className="aspect-[4/3] w-full border border-bone/10 object-cover [filter:saturate(0.95)_contrast(1.03)]"
                  />
                </div>
                <div className="lg:col-span-4">
                  <div className="micro text-bone/60">The amenities · Asterion</div>
                  <h3 className="mt-3 font-display text-[clamp(2rem,3.6vw,3.4rem)] leading-[0.94]">{a.name}</h3>
                  <p className="mt-5 text-[0.8rem] font-light leading-[1.9] text-bone/75">{a.desc}</p>
                  <dl className="mt-6 divide-y divide-bone/10 border-y border-bone/10">
                    {[
                      ['Position', a.meta],
                      ['Access', 'All residents'],
                      ['Address', 'Sector 137, Noida'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-[0.46rem] uppercase tracking-[0.2em] text-bone/55">{k}</dt>
                        <dd className="text-right text-[0.66rem] font-light text-bone/80">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
