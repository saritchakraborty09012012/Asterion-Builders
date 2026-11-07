import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Arrow, Label } from '../components/ui'
import { FLAT_TYPES, SITE } from '../data/site'
import { scrollToId, scrollToTop } from '../lib/scroll'

const EASE = [0.22, 1, 0.36, 1] as const

/* ------------------------------------------------------------------ */
/*  01 — the front arch                                                */
/* ------------------------------------------------------------------ */
function FrontArch() {
  return (
    <section className="relative overflow-hidden bg-paper px-[var(--gutter)] pb-14 pt-24 text-ink md:pb-20 md:pt-32">
      <div className="flex items-start justify-between border-b border-ink/12 pb-5">
        <Label index="09">The residence</Label>
        <span className="micro hidden text-ink/65 md:block">Sector 137 · Noida</span>
      </div>

      <div className="relative mt-8">
        <div className="relative overflow-hidden rounded-t-full border border-ink/15 bg-forest">
          <div className="relative aspect-[16/10] md:aspect-[16/7.4]">
            <img
              src="/images/hero_dusk.jpg"
              alt="Asterion Residence at dusk"
              className="h-full w-full object-cover"
              style={{ filter: 'saturate(0.92) contrast(1.02)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06100a]/82 via-[#06100a]/18 to-[#06100a]/10" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 text-bone md:flex-row md:items-end md:justify-between md:p-10">
              <div>
                <div className="flex items-center gap-3 text-[0.54rem] uppercase tracking-[0.28em] text-bone/70">
                  <span className="h-1 w-1 rounded-full bg-clay" />
                  <span>Completed · 2028</span>
                </div>
                <h2 className="mt-3 display text-[clamp(2.6rem,7.4vw,7.8rem)] leading-[0.82]">
                  Asterion
                  <br />
                  <span className="italic text-bone/75">Residence.</span>
                </h2>
              </div>
              <div className="max-w-[300px] md:pb-2 md:text-right">
                <p className="text-[0.82rem] font-light leading-[1.85] text-bone/70">
                  Sixty homes above a circular garden. Fifteen levels, four
                  residences each, and one address that holds them all.
                </p>
                <button
                  onClick={() => scrollToId('#contact')}
                  className="mt-4 inline-flex items-center gap-3 text-[0.58rem] uppercase tracking-[0.24em] text-bone/75 transition-colors hover:text-bone"
                >
                  <span className="link-underline">Register your interest</span>
                  <Arrow />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/12 pt-4">
          <span className="text-[0.56rem] uppercase tracking-[0.22em] text-ink/75">
            Sector 137 · Noida Expressway
          </span>
          <span className="text-[0.56rem] uppercase tracking-[0.22em] text-ink/75">
            {SITE.lat} · {SITE.lng}
          </span>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  02 — register                                                      */
/* ------------------------------------------------------------------ */
type Status = 'idle' | 'sending' | 'sent' | 'error'

const INTERESTS = [
  ...FLAT_TYPES.map((t) => `${t.code} · ${t.name} · ${t.area} sq ft`),
  'The Asterion Penthouse',
  'General enquiry',
]

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interest: INTERESTS[0],
    message: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [ref, setRef] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setRef(data.id || '')
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-forest-deep px-[var(--gutter)] pb-20 pt-24 text-bone md:pb-28 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(165,126,86,0.16),transparent_55%)]" />

      {/* sample watermark — sits behind the whole register-interest block */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <span className="select-none whitespace-nowrap font-display text-[clamp(4rem,17vw,15rem)] font-light uppercase leading-none tracking-[0.08em] text-bone/[0.13] [transform:rotate(-8deg)]">
          Sample
        </span>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between border-b border-bone/12 pb-5">
          <Label index="10" light>
            Register interest
          </Label>
          <span className="micro hidden text-bone/60 md:block">Private appointments · Noida</span>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <h2 className="display text-[clamp(3.2rem,7.2vw,7.4rem)] leading-[0.82] text-bone">
              Come
              <br />
              <span className="italic text-bone/70">home.</span>
            </h2>
            <p className="mt-6 max-w-[400px] text-[0.86rem] font-light leading-[1.85] text-bone/65">
              Sixty residences. Four plans. One address on the Noida Expressway.
              Leave your details and the sales gallery will arrange a private
              walk-through — in person or in 3D.
            </p>

            <dl className="mt-9 grid max-w-[430px] gap-4 sm:grid-cols-2">
              {[
                ['Sales gallery', SITE.address],
                ['Telephone', SITE.phone],
                ['Email', SITE.email],
                ['Hours', 'Mon–Sun · 10 am – 7 pm'],
              ].map(([k, v]) => (
                <div key={k} className="border-t border-bone/12 pt-3">
                  <dt className="text-[0.52rem] uppercase tracking-[0.22em] text-bone/75">{k}</dt>
                  <dd className="mt-1.5 text-[0.78rem] font-light leading-relaxed text-bone/75">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-[0.58rem] uppercase tracking-[0.22em] text-bone/65 transition-colors hover:text-bone"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-bone/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                    <path d="M6 3h3l2 5-2.2 1.4a12 12 0 0 0 5.8 5.8L16 13l5 2v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.2 2 2 0 0 1 6 3Z" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </span>
                Call the gallery
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="text-[0.58rem] uppercase tracking-[0.22em] text-bone/75 transition-colors hover:text-bone"
              >
                {SITE.email}
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="border border-bone/12 bg-bone/[0.035] p-5 md:p-8">
              <AnimatePresence mode="wait">
                {status === 'sent' ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="flex min-h-[420px] flex-col justify-center"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-clay/50 text-clay">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                        <path d="m5 12 5 5 9-11" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                    <h3 className="mt-6 font-display text-3xl leading-none md:text-4xl">
                      Thank you, {form.name.split(' ')[0] || 'and welcome'}.
                    </h3>
                    <p className="mt-4 max-w-[340px] text-[0.82rem] font-light leading-[1.85] text-bone/65">
                      Your enquiry has reached the sales gallery. A member of the
                      team will write to you within one working day.
                    </p>
                    {ref ? (
                      <div className="mt-6 inline-flex w-fit items-center gap-3 border border-bone/15 px-3 py-2 text-[0.54rem] uppercase tracking-[0.18em] text-bone/80">
                        <span className="h-1 w-1 rounded-full bg-clay" />
                        Reference {ref}
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        setStatus('idle')
                        setForm((f) => ({ ...f, message: '' }))
                      }}
                      className="mt-8 inline-flex w-fit items-center gap-3 text-[0.58rem] uppercase tracking-[0.22em] text-bone/65 transition-colors hover:text-bone"
                    >
                      <span className="link-underline">Send another enquiry</span>
                      <Arrow />
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-1"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-[0.54rem] uppercase tracking-[0.24em] text-bone/75">
                        Private enquiry
                      </span>
                      <span className="text-[0.54rem] uppercase tracking-[0.18em] text-bone/70">
                        01 / 01
                      </span>
                    </div>

                    <div className="grid gap-x-5 sm:grid-cols-2">
                      <div className="field">
                        <label htmlFor="name">Name</label>
                        <input
                          id="name"
                          required
                          value={form.name}
                          onChange={set('name')}
                          placeholder="Your full name"
                          autoComplete="name"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={set('email')}
                          placeholder="you@email.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="grid gap-x-5 sm:grid-cols-2">
                      <div className="field">
                        <label htmlFor="phone">Telephone</label>
                        <input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={set('phone')}
                          placeholder="+91"
                          autoComplete="tel"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="interest">Residence</label>
                        <select id="interest" value={form.interest} onChange={set('interest')}>
                          {INTERESTS.map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="message">A note (optional)</label>
                      <textarea
                        id="message"
                        rows={3}
                        value={form.message}
                        onChange={set('message')}
                        placeholder="Tell us when you would like to visit."
                      />
                    </div>

                    {status === 'error' ? (
                      <p className="pt-3 text-[0.66rem] font-light text-[#e6b09a]" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <span className="max-w-[250px] text-[0.62rem] font-light leading-relaxed text-bone/75">
                        By sending this you agree to be contacted about Asterion
                        Residence. No third parties.
                      </span>
                      <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="group flex items-center gap-3 bg-bone px-5 py-3.5 text-[0.58rem] uppercase tracking-[0.22em] text-ink transition-colors hover:bg-clay hover:text-bone disabled:opacity-50"
                      >
                        {status === 'sending' ? 'Sending…' : 'Request a viewing'}
                        <span className="grid h-7 w-7 place-items-center rounded-full border border-current/30">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.1" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  03 — footer                                                         */
/* ------------------------------------------------------------------ */
function FooterBlock() {
  return (
    <footer className="relative overflow-hidden bg-[#0a120d] px-[var(--gutter)] pb-10 pt-16 text-bone md:pt-20">
      {/* sample watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <span className="select-none whitespace-nowrap font-display text-[clamp(5rem,22vw,20rem)] font-light uppercase leading-none tracking-[0.06em] text-bone/[0.045]">
          Sample
        </span>
      </div>
      <div className="relative z-10 flex flex-col gap-10 border-b border-bone/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3 text-[0.46rem] uppercase tracking-[0.3em] text-bone/60">
            <span className="h-1 w-1 rounded-full bg-clay" />
            <span>Asterion Properties · Est. 2026</span>
          </div>
          <div className="mt-4 font-display text-[clamp(4rem,13vw,13rem)] font-light uppercase leading-[0.72] tracking-[0.01em] text-bone/90">
            Asterion
          </div>
        </div>
        <div className="max-w-[300px] lg:pb-4 lg:text-right">
          <p className="text-[0.72rem] font-light leading-[1.9] text-bone/70">
            Sixty residences above a circular garden. Sector 137, Noida, near
            Delhi, India.
          </p>
          <button
            onClick={() => scrollToId('#top')}
            className="mt-4 inline-flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.24em] text-bone/75 transition-colors hover:text-bone"
          >
            <span className="link-underline">Back to the beginning</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M12 20V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 grid gap-8 py-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="micro text-bone/55">Visit</span>
          <p className="mt-3 max-w-[240px] text-[0.7rem] font-light leading-[1.9] text-bone/75">
            {SITE.address}
          </p>
          <div className="mt-4 flex flex-col gap-1">
            <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="text-[0.72rem] font-light text-bone/70">
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="text-[0.72rem] font-light text-bone/75">
              {SITE.email}
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <span className="micro text-bone/55">Explore</span>
          <div className="mt-3 flex flex-col gap-1.5">
            {[
              ['The arrival', '#top'],
              ['Residences', '#residences'],
              ['Interiors', '#interiors'],
              ['Amenities', '#amenities'],
              ['The address', '#location'],
            ].map(([label, href]) => (
              <button
                key={href}
                onClick={() => scrollToId(href)}
                className="w-fit text-[0.68rem] font-light text-bone/75 transition-colors hover:text-bone"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <span className="micro text-bone/55">The build</span>
          <p className="mt-3 text-[0.66rem] font-light leading-[1.9] text-bone/70">
            Built by Asterion Builders.
            <br />
            Interiors by Asterion Studio.
            <br />
            Landscape by Asterion Studio.
          </p>
        </div>

        <div className="md:col-span-2">
          <span className="micro text-bone/55">Legal</span>
          <div className="mt-3 flex flex-col gap-1.5 text-[0.62rem] font-light text-bone/70">
            <span>RERA · UP/2026/0137</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3 border-t border-bone/10 pt-5 text-[0.44rem] uppercase tracking-[0.22em] text-bone/60 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Asterion Properties. All rights reserved.</span>
        <span>Noida · near Delhi · India</span>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/*  04 — door exit, flash, seamless return                              */
/* ------------------------------------------------------------------ */
function DoorExit() {
  const ref = useRef<HTMLElement>(null)
  const armed = useRef(0)
  const [atEnd, setAtEnd] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const busy = useRef(false)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  const leftX = useTransform(scrollYProgress, [0.12, 0.58], ['-102%', '0%'])
  const rightX = useTransform(scrollYProgress, [0.12, 0.58], ['102%', '0%'])
  const seam = useTransform(scrollYProgress, [0.52, 0.6, 0.82, 0.9], [0, 0.9, 0.9, 0])
  const wordOpacity = useTransform(scrollYProgress, [0, 0.24, 0.46], [1, 0.6, 0])
  const wordY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-12%'])
  const flash = useTransform(
    scrollYProgress,
    [0.6, 0.66, 0.79, 0.84],
    [0, 1, 1, 0]
  )
  const flashScale = useTransform(scrollYProgress, [0.6, 0.86], [0.96, 1.03])
  const endOpacity = useTransform(scrollYProgress, [0.83, 0.9], [0, 1])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const end = v > 0.965
    setAtEnd(end)
    if (end && armed.current === 0) armed.current = Date.now() + 1100
    if (!end) armed.current = 0
  })

  const replay = () => {
    if (busy.current) return
    busy.current = true
    setReplaying(true)
    window.setTimeout(() => {
      scrollToTop(true)
    }, 780)
    window.setTimeout(() => {
      setReplaying(false)
      busy.current = false
    }, 1650)
  }

  useEffect(() => {
    if (!atEnd) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return
      if (Date.now() < armed.current) return
      replay()
    }
    let startY = 0
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0
      if (startY - y > 36 && Date.now() > armed.current) replay()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atEnd])

  return (
    <section
      ref={ref}
      id="door-exit"
      className="relative h-[250vh] bg-[#050806] text-bone"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* underlay */}
        <motion.div
          style={{ opacity: wordOpacity, y: wordY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[var(--gutter)] text-center"
        >
          <span className="eyebrow text-bone/60">The last door</span>
          <div className="mt-4 font-display text-[clamp(3.4rem,12vw,12rem)] font-light uppercase leading-[0.78]">
            Asterion
          </div>
          <div className="mt-5 flex items-center gap-4 text-[0.48rem] uppercase tracking-[0.28em] text-bone/70">
            <span className="h-px w-10 bg-bone/25" />
            <span>Sixty homes · one address</span>
            <span className="h-px w-10 bg-bone/25" />
          </div>
          <div className="mt-16 flex items-center gap-3 text-[0.44rem] uppercase tracking-[0.3em] text-bone/60">
            <span className="scroll-rail h-8" />
            <span>Scroll to close the door</span>
          </div>
        </motion.div>

        {/* doors */}
        <motion.div
          style={{ x: leftX }}
          className="door-panel absolute inset-y-0 left-0 z-20 w-1/2 border-r border-[#84643f]/30"
        >
          <div className="absolute inset-y-0 right-0 w-px bg-[#b88a55]/40" />
          <div className="absolute left-8 top-1/2 -translate-y-1/2 rotate-180 text-[0.44rem] uppercase tracking-[0.4em] text-bone/60 [writing-mode:vertical-rl] md:left-12">
            Asterion · Sector 137
          </div>
          <div className="absolute bottom-8 left-8 text-[0.4rem] uppercase tracking-[0.3em] text-bone/55 md:left-12">
            Noida · India
          </div>
        </motion.div>
        <motion.div
          style={{ x: rightX }}
          className="door-panel door-panel--right absolute inset-y-0 right-0 z-20 w-1/2 border-l border-[#84643f]/30"
        >
          <div className="absolute inset-y-0 left-0 w-px bg-[#b88a55]/40" />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[0.44rem] uppercase tracking-[0.4em] text-bone/60 [writing-mode:vertical-rl] md:right-12">
            A private arrival · 2028
          </div>
          <div className="absolute bottom-8 right-8 text-[0.4rem] uppercase tracking-[0.3em] text-bone/55 md:right-12">
            Sixty residences
          </div>
        </motion.div>

        {/* seam glow */}
        <motion.div
          style={{ opacity: seam }}
          className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f2c48a] to-transparent shadow-[0_0_40px_8px_rgba(242,196,138,0.35)]"
        />

        {/* builders flash */}
        <motion.div
          style={{ opacity: flash, scale: flashScale }}
          className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#050806] px-[var(--gutter)] text-center"
        >
          <span className="eyebrow text-bone/60">The hand behind the home</span>
          <div className="mt-5 flex items-center gap-5 md:gap-8">
            <span className="hidden h-px w-16 bg-bone/20 md:block" />
            <div className="font-display text-[clamp(1.8rem,6.6vw,7rem)] font-light uppercase leading-none tracking-[0.02em] text-bone">
              Asterion
              <span className="ml-3 italic text-bone/70 md:ml-4">Builders</span>
            </div>
            <span className="hidden h-px w-16 bg-bone/20 md:block" />
          </div>
          <div className="mt-6 text-[0.5rem] uppercase tracking-[0.34em] text-bone/60">
            Thirty years · one idea · built properly
          </div>
        </motion.div>

        {/* return cue */}
        <motion.div
          style={{ opacity: endOpacity }}
          className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050806] px-[var(--gutter)] text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-bone/15">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-bone/75" fill="none">
              <path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
          <h3 className="mt-7 font-display text-[clamp(2rem,5vw,4.4rem)] leading-none">
            The end is the beginning.
          </h3>
          <p className="mt-3 max-w-[300px] text-[0.66rem] font-light leading-relaxed text-bone/70">
            Scroll once more, or select the mark, to return to the arrival.
          </p>
          <button
            onClick={replay}
            className="pointer-events-auto mt-8 flex items-center gap-3 border border-bone/20 px-5 py-3 text-[0.5rem] uppercase tracking-[0.26em] text-bone/80 transition-colors hover:border-bone/60 hover:text-bone"
          >
            Return to the beginning
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M12 20V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <div className="mt-8 flex items-center gap-3 text-[0.42rem] uppercase tracking-[0.3em] text-bone/55">
            <span className={`h-1 w-1 rounded-full ${atEnd ? 'bg-clay' : 'bg-bone/55'}`} />
            <span>{atEnd ? 'Scroll to return' : 'Closing the door'}</span>
          </div>
        </motion.div>

        {/* replay flash */}
        <AnimatePresence>
          {replaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: replaying ? 0.7 : 0.9, ease: EASE }}
              className="pointer-events-none fixed inset-0 z-[190] bg-[#f2eee6]"
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  closing flow                                                       */
/* ------------------------------------------------------------------ */
export default function Closing() {
  return (
    <>
      <FrontArch />
      <Register />
      <FooterBlock />
      <DoorExit />
    </>
  )
}
