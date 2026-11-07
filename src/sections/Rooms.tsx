import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Arrow, Label } from '../components/ui'
import { ROOMS } from '../data/site'
import { lockScroll, unlockScroll } from '../lib/scroll'

export default function Rooms() {
  const ref = useRef<HTMLElement>(null)
  const [stage, setStage] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const s = Math.min(ROOMS.length - 1, Math.max(0, Math.floor(v * ROOMS.length)))
    setStage((prev) => (prev === s ? prev : s))
  })

  useEffect(() => {
    if (open === null) return
    lockScroll()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => ((i ?? 0) + 1) % ROOMS.length)
      if (e.key === 'ArrowLeft') setOpen((i) => ((i ?? 0) - 1 + ROOMS.length) % ROOMS.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      unlockScroll()
    }
  }, [open])

  const room = ROOMS[stage]
  const opened = open !== null ? ROOMS[open] : null

  return (
    <section
      id="rooms"
      ref={ref}
      className="relative h-[420vh] bg-[#070c09] text-bone"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {/* ambient light */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_44%,#22302a_0%,#0a110c_58%,#050806_100%)]" />

        <div className="relative z-10 flex items-start justify-between border-b border-bone/10 px-[var(--gutter)] pb-5 pt-24 md:pt-28">
          <Label index="03" light>
            The rooms
          </Label>
          <span className="micro hidden text-bone/55 md:block">Immersive views · click to enter</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-[var(--gutter)]">
          {/* counter + title */}
          <div className="pointer-events-none absolute left-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 md:block">
            <div className="level-rail">
              {ROOMS.map((r, i) => (
                <div
                  key={r.key}
                  className={`flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.24em] transition-colors duration-500 ${
                    i === stage ? 'text-bone' : 'text-bone/55'
                  }`}
                >
                  <span className="tabular-nums">{r.index}</span>
                  <span className={`h-px transition-all duration-700 ${i === stage ? 'w-7 bg-clay' : 'w-2 bg-bone/20'}`} />
                  <span className={i === stage ? 'opacity-100' : 'opacity-0'}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 rotate-180 text-[0.46rem] uppercase tracking-[0.32em] text-bone/60 [writing-mode:vertical-rl] md:block">
            Scroll to move through the residence
          </div>

          {/* the arch */}
          <AnimatePresence mode="popLayout">
            <motion.button
              key={room.key}
              onClick={() => setOpen(stage)}
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: -16 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative mt-4 w-[min(90vw,1120px)] overflow-hidden rounded-t-full border border-bone/12"
              style={{ height: 'min(62vh, 660px)' }}
              aria-label={`Open ${room.name}`}
            >
              <img
                src={room.image}
                alt={room.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2200ms] ease-silk group-hover:scale-[1.035]"
                style={{ filter: 'saturate(0.9) contrast(1.02) brightness(0.94)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070c09] via-[#070c09]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 px-6 pb-4 text-left md:flex-row md:items-end md:justify-between md:px-12 md:pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.5rem] uppercase tracking-[0.24em] text-bone/70">
                      {room.index} / 04
                    </span>
                    <span className="h-px w-8 bg-bone/25" />
                    <span className="micro text-bone/70">{room.label}</span>
                  </div>
                  <div className="mt-2 font-display text-[clamp(2rem,4.6vw,4.4rem)] leading-none text-bone">
                    {room.name}
                  </div>
                </div>
                <div className="max-w-[320px] text-left md:text-right">
                  <p className="text-[0.7rem] font-light leading-[1.8] text-bone/75 md:hidden">
                    {room.description.slice(0, 150)}…
                  </p>
                  <span className="mt-2 inline-flex items-center gap-2 text-[0.48rem] uppercase tracking-[0.24em] text-bone/75">
                    Click to enter <Arrow />
                  </span>
                </div>
              </div>
            </motion.button>
          </AnimatePresence>

          <div className="relative z-10 mt-5 flex w-full max-w-[1120px] items-start justify-between gap-6">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.p
                  key={room.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-[560px] text-[0.74rem] font-light leading-[1.85] text-bone/75"
                >
                  {room.description}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="hidden shrink-0 text-right md:block">
              <div className="micro text-bone/70">{room.materials}</div>
              <div className="mt-1 text-[0.56rem] uppercase tracking-[0.2em] text-bone/70">
                {room.aspect}
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="pointer-events-none relative z-10 flex items-center justify-center gap-3 pb-7">
          <span className="micro text-bone/60">Scroll</span>
          <span className="scroll-rail h-9" />
          <span className="micro text-bone/60">04 views</span>
        </div>
      </div>

      {/* full room view */}
      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[160] overflow-y-auto bg-[#060a07] text-bone"
          >
            <div className="relative min-h-full px-[var(--gutter)] pb-10 pt-24 md:pt-28">
              <div className="flex items-center justify-between border-b border-bone/10 pb-4">
                <button
                  onClick={() => setOpen(null)}
                  className="group flex items-center gap-3 text-[0.54rem] uppercase tracking-[0.26em] text-bone/75 transition-colors hover:text-bone"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-bone/20 transition-colors group-hover:border-bone/60">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                  </span>
                  Back to the rooms
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOpen((i) => ((i ?? 0) - 1 + ROOMS.length) % ROOMS.length)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-bone/20 text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
                    aria-label="Previous room"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                  <span className="text-[0.5rem] uppercase tracking-[0.24em] text-bone/70">
                    {opened.index} / 04
                  </span>
                  <button
                    onClick={() => setOpen((i) => ((i ?? 0) + 1) % ROOMS.length)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-bone/20 text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
                    aria-label="Next room"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-8">
                  <motion.img
                    key={opened.key}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    src={opened.image}
                    alt={opened.name}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
                <div className="lg:col-span-4">
                  <div className="micro text-bone/60">{opened.label} · Asterion</div>
                  <h3 className="mt-3 font-display text-[clamp(2rem,3.6vw,3.4rem)] leading-[0.92]">
                    {opened.name}
                  </h3>
                  <p className="mt-5 text-[0.8rem] font-light leading-[1.9] text-bone/75">
                    {opened.description}
                  </p>
                  <dl className="mt-6 divide-y divide-bone/10 border-y border-bone/10">
                    {[
                      ['Materials', opened.materials],
                      ['Aspect', opened.aspect],
                      ['Residence', 'Every level, every plan'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-[0.46rem] uppercase tracking-[0.2em] text-bone/55">{k}</dt>
                        <dd className="max-w-[220px] text-right text-[0.66rem] font-light leading-relaxed text-bone/80">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => setOpen((i) => ((i ?? 0) + 1) % ROOMS.length)}
                    className="mt-6 flex items-center gap-3 text-[0.54rem] uppercase tracking-[0.24em] text-bone/75 transition-colors hover:text-bone"
                  >
                    <span className="link-underline">Next room</span>
                    <Arrow />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
