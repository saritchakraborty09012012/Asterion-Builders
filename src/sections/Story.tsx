import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Arrow, Label, Parallax, Reveal, Words } from '../components/ui'
import { ROOMS } from '../data/site'
import { scrollToId } from '../lib/scroll'

const ARCHES = [
  { key: 'living', word: 'Living', note: 'The last hour of light' },
  { key: 'dining', word: 'Dining', note: 'A table at the centre' },
  { key: 'bedroom', word: 'Sleeping', note: 'A suite, not a room' },
  { key: 'bath', word: 'Bathing', note: 'Stone, water, quiet' },
]

/* ------------------------------------------------------------------ */
/*  01 — the arches                                                    */
/* ------------------------------------------------------------------ */
export function Arches() {
  return (
    <section id="interiors" className="relative overflow-hidden bg-bone text-ink">
      <div className="px-[var(--gutter)] pb-6 pt-24 md:pt-32">
        <div className="flex items-start justify-between border-b border-ink/10 pb-5">
          <Label index="02">The interiors</Label>
          <span className="micro hidden text-ink/65 md:block">Asterion · Noida</span>
        </div>

        <div className="mt-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="display text-[clamp(3.4rem,8.6vw,9rem)] leading-[0.84]">
            <Words text="Light, held" />
            <br />
            <span className="italic text-ink/70">
              <Words text="in an arch." delay={0.12} />
            </span>
          </h2>
          <div className="max-w-[300px] lg:pb-3">
            <p className="body-copy text-ink/85">
              Four rooms, drawn in the same language: limewash, oak, stone and a
              horizon that moves through the day.
            </p>
            <button
              onClick={() => scrollToId('#rooms')}
              className="mt-5 flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.26em] text-ink/75 transition-colors hover:text-ink"
            >
              <span className="link-underline">Walk through the rooms</span>
              <Arrow />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-[var(--gutter)] pb-24 md:gap-5 lg:grid-cols-4">
        {ARCHES.map((a, i) => {
          const room = ROOMS.find((r) => r.key === a.key)!
          return (
            <motion.article
              key={a.key}
              initial={{ opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' }}
              whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 1.3, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className="arch relative aspect-[3/4.2] w-full">
                <img
                  src={room.image}
                  alt={room.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="arch-veil absolute inset-0" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-bone md:inset-x-5 md:bottom-5">
                  <div>
                    <span className="micro text-bone/75">0{i + 1}</span>
                    <div className="mt-1 font-display text-xl leading-none md:text-2xl">
                      {a.word}
                    </div>
                  </div>
                  <span className="hidden text-[0.45rem] uppercase tracking-[0.2em] text-bone/70 md:inline">
                    {a.note}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[0.48rem] uppercase tracking-[0.22em] text-ink/70">
                <span>{room.materials.split(' · ')[0]}</span>
                <span>{room.aspect.split(' · ')[0]}</span>
              </div>
            </motion.article>
          )
        })}
      </div>

      <div className="border-t border-ink/10 px-[var(--gutter)] py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="micro text-ink/65">The material story</span>
          </div>
          <div className="md:col-span-6">
            <p className="editorial text-[clamp(1.35rem,2.4vw,2.15rem)] leading-[1.35] text-ink/75">
              A palette chosen for how it feels at six in the evening, not how it
              photographs at noon. Limewash. Honed travertine. Solid oak. Brushed
              bronze. Surfaces that will still be beautiful in twenty years.
            </p>
          </div>
          <div className="md:col-span-3 md:text-right">
            <span className="serif-italic text-3xl text-clay">Est. 2026</span>
            <p className="mt-3 text-[0.56rem] uppercase tracking-[0.22em] text-ink/70">
              Sector 137 · Noida
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  02 — a slower kind of everyday                                     */
/* ------------------------------------------------------------------ */
const SLOW = [
  { image: '/images/interior_living.jpg', title: 'Morning', copy: 'Coffee at the window. The city still far away.' },
  { image: '/images/interior_dining.jpg', title: 'Noon', copy: 'The table becomes a desk, then a place to gather.' },
  { image: '/images/interior_bedroom.jpg', title: 'Evening', copy: 'A bath, a book, the last of the light.' },
  { image: '/images/hero_dusk.jpg', title: 'Night', copy: 'The tower settles into its own quiet glow.' },
]

export function SlowLiving() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-58%'])
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section ref={ref} className="relative h-[320vh] bg-paper text-ink">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="flex items-start justify-between border-b border-ink/10 px-[var(--gutter)] pb-5 pt-24 md:pt-28">
          <Label index="05">A slower kind of everyday</Label>
          <span className="micro hidden text-ink/65 md:block">04 rooms · one day</span>
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div className="px-[var(--gutter)] pt-8">
            <h2 className="display text-[clamp(3rem,7.2vw,7.6rem)] leading-[0.84]">
              A slower kind
              <br />
              <span className="italic text-ink/70">of everyday.</span>
            </h2>
          </div>

          <motion.div style={{ x }} className="mt-6 flex w-max items-end gap-4 px-[var(--gutter)] pb-10 md:mt-8 md:gap-7 md:pb-14">
            {SLOW.map((s, i) => (
              <article
                key={s.title}
                className="w-[clamp(230px,32vw,460px)] shrink-0"
              >
                <div className="group relative aspect-[4/3.1] overflow-hidden rounded-t-full border border-ink/10">
                  <img
                    src={s.image}
                    alt={`${s.title} at Asterion`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover transition-transform duration-[1600ms] ease-silk hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/35 via-transparent to-transparent" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3 border-t border-ink/15 pt-3">
                  <div>
                    <div className="micro text-ink/65">0{i + 1} / {s.title}</div>
                    <p className="mt-1 min-h-[3.25em] max-w-[250px] text-[0.72rem] font-light leading-relaxed text-ink/75">
                      {s.copy}
                    </p>
                  </div>
                  <span className="text-[0.44rem] uppercase tracking-[0.22em] text-ink/65">
                    {i === 3 ? 'Residence' : 'Interior'}
                  </span>
                </div>
              </article>
            ))}
            <div className="flex w-[30vw] shrink-0 flex-col justify-end pb-4 md:w-[22vw]">
              <span className="serif-italic text-[clamp(1.8rem,3.2vw,3rem)] leading-tight text-clay">
                The day,
                <br />
                unhurried.
              </span>
              <span className="mt-4 micro text-ink/65">Keep scrolling</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-4 px-[var(--gutter)] pb-7">
            <span className="micro text-ink/65">01</span>
            <div className="h-px flex-1 bg-ink/10">
              <motion.div style={{ scaleX: bar, transformOrigin: 'left' }} className="h-px bg-clay" />
            </div>
            <span className="micro text-ink/65">04</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  03 — gallery + coming soon                                         */
/* ------------------------------------------------------------------ */
const ENTRIES = [
  { src: '/images/interior_dining.jpg', title: 'The table', meta: 'Smoked oak · cream marble' },
  { src: '/images/interior_bedroom.jpg', title: 'The suite', meta: 'Wool · linen · bronze' },
  { src: '/images/interior_bath.jpg', title: 'The bath', meta: 'Travertine · stone' },
  { src: '/images/interior_living.jpg', title: 'The living room', meta: 'Oak · bouclé · light' },
]

export function Gallery() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y1 = useTransform(scrollYProgress, [0, 1], [40, -80])
  const y2 = useTransform(scrollYProgress, [0, 1], [100, -20])
  const y3 = useTransform(scrollYProgress, [0, 1], [150, 30])
  const r1 = useTransform(scrollYProgress, [0, 1], [-6, -10])
  const r2 = useTransform(scrollYProgress, [0, 1], [4, 8])
  const r3 = useTransform(scrollYProgress, [0, 1], [9, 14])

  return (
    <section ref={ref} className="relative overflow-hidden bg-bone text-ink">
      <div className="px-[var(--gutter)] pb-8 pt-24 md:pt-32">
        <div className="flex items-start justify-between border-b border-ink/10 pb-5">
          <Label index="07">An assemblage</Label>
          <span className="micro hidden text-ink/65 md:block">Objects · rooms · light</span>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-12">
          {ENTRIES.map((e, i) => (
            <motion.figure
              key={e.title}
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1.1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={
                i === 0
                  ? 'md:col-span-7'
                  : i === 1
                  ? 'md:col-span-5 md:pt-16'
                  : i === 2
                  ? 'md:col-span-4 md:-mt-10'
                  : 'md:col-span-8 md:-mt-14'
              }
            >
              <div className="overflow-hidden">
                <Parallax
                  src={e.src}
                  alt={e.title}
                  strength={7}
                  className={i === 0 ? 'aspect-[4/3]' : 'aspect-[4/3.4]'}
                />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 border-t border-ink/15 pt-3">
                <span className="font-display text-lg leading-none">{e.title}</span>
                <span className="text-[0.46rem] uppercase tracking-[0.2em] text-ink/65">
                  {e.meta}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden bg-forest px-[var(--gutter)] pb-24 pt-20 text-bone md:pb-32 md:pt-28">
        <div className="flex items-start justify-between border-b border-bone/10 pb-5">
          <Label index="08" light>
            A limited collection
          </Label>
          <span className="micro hidden text-bone/55 md:block">Sixty residences</span>
        </div>

        <div className="relative mt-12 grid min-h-[560px] items-center gap-10 md:min-h-[720px] md:grid-cols-12">
          <div className="relative z-10 md:col-span-6">
            <h2 className="display text-[clamp(3rem,7vw,7.4rem)] leading-[0.84] text-bone">
              The luxury
              <br />
              of homes,
              <br />
              <span className="italic text-bone/70">coming soon.</span>
            </h2>
            <p className="mt-6 max-w-[340px] text-[0.8rem] font-light leading-[1.9] text-bone/75">
              Sixty residences above Noida. Four to a floor. Fifteen levels of
              considered light, and a community below that behaves like a garden.
            </p>
            <button
              onClick={() => scrollToId('#location')}
              className="mt-7 flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.26em] text-bone/80 transition-colors hover:text-bone"
            >
              <span className="link-underline">Discover the address</span>
              <Arrow />
            </button>
          </div>

          <div className="relative h-[400px] md:col-span-6 md:h-[620px]">
            <motion.div
              style={{ y: y1, rotate: r1 }}
              className="absolute left-[2%] top-[6%] w-[58%] overflow-hidden border border-bone/10 shadow-[0_30px_80px_rgba(5,9,6,0.5)]"
            >
              <img src="/images/interior_living.jpg" alt="The living room" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            </motion.div>
            <motion.div
              style={{ y: y2, rotate: r2 }}
              className="absolute right-[1%] top-[18%] w-[50%] overflow-hidden border border-bone/10 shadow-[0_30px_80px_rgba(5,9,6,0.5)]"
            >
              <img src="/images/hero_dusk.jpg" alt="Asterion at dusk" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            </motion.div>
            <motion.div
              style={{ y: y3, rotate: r3 }}
              className="absolute bottom-[0%] left-[24%] w-[46%] overflow-hidden border border-bone/10 shadow-[0_30px_80px_rgba(5,9,6,0.55)]"
            >
              <img src="/images/interior_bedroom.jpg" alt="The principal suite" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            </motion.div>
            <div className="absolute right-0 top-0 font-display text-[8rem] leading-none text-bone/5 md:text-[12rem]">
              60
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  04 — side wipe                                                     */
/* ------------------------------------------------------------------ */
export function SideWipe() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const clip = useTransform(scrollYProgress, [0.1, 0.86], [100, 0])
  const line = useTransform(scrollYProgress, [0.1, 0.86], ['0%', '100%'])
  const clipPath = useTransform(clip, (v) => `inset(0 ${v}% 0 0)`)

  return (
    <section ref={ref} className="relative h-[260vh] bg-forest-deep text-bone">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="flex items-start justify-between border-b border-bone/10 px-[var(--gutter)] pb-5 pt-24 md:pt-28">
          <Label index="09" light>
            A question of light
          </Label>
          <span className="micro hidden text-bone/55 md:block">Dawn · Dusk</span>
        </div>

        <div className="flex flex-1 flex-col justify-center px-[var(--gutter)] pb-8 pt-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="display max-w-[760px] text-[clamp(2.6rem,5.4vw,5.6rem)] leading-[0.86]">
              The same tower,
              <br />
              <span className="italic text-bone/70">two different lives.</span>
            </h2>
            <span className="hidden text-[0.5rem] uppercase tracking-[0.24em] text-bone/60 md:block">
              Scroll to move the light
            </span>
          </div>

          <div className="relative mx-auto aspect-[16/10] w-full max-w-[1200px] overflow-hidden border border-bone/10">
            <img
              src="/images/hero_dusk.jpg"
              alt="Asterion at dawn"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'saturate(0.55) brightness(1.06) hue-rotate(-8deg)' }}
            />
            <motion.img
              src="/images/hero_dusk.jpg"
              alt="Asterion at dusk"
              style={{ clipPath }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a110c]/45 via-transparent to-transparent" />
            <motion.div
              style={{ left: line }}
              className="absolute inset-y-0 z-10 w-px bg-bone/70"
            >
              <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone/40 bg-forest-deep/40 backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M9 6 4 12l5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="0.9" />
                </svg>
              </span>
            </motion.div>
            <span className="absolute bottom-4 left-4 text-[0.5rem] uppercase tracking-[0.24em] text-bone/75">
              Dawn
            </span>
            <span className="absolute bottom-4 right-4 text-[0.5rem] uppercase tracking-[0.24em] text-bone/75">
              Dusk
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  05 — upward fade manifesto                                         */
/* ------------------------------------------------------------------ */
const MANIFESTO = [
  ['A home should hold the light.', 'North light, west light, the last of it falling across the bath.'],
  ['A building should hold the street.', 'A podium that gives something back: gardens, shade, a place to pause.'],
  ['A city should hold its breath.', 'Sixty homes, and a quiet that belongs to all of them.'],
]

export function UpwardFade() {
  return (
    <section className="relative overflow-hidden bg-bone text-ink">
      <div className="px-[var(--gutter)] pb-24 pt-24 md:pb-32 md:pt-28">
        <div className="flex items-start justify-between border-b border-ink/15 pb-5">
          <Label index="10">A quiet manifesto</Label>
          <span className="hidden text-[0.58rem] uppercase tracking-[0.24em] text-ink/75 md:block">
            Asterion · Noida
          </span>
        </div>

        <div className="mt-12 md:mt-20">
          {MANIFESTO.map(([line, note], i) => (
            <motion.div
              key={line}
              initial={{ opacity: 0, y: 54 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
              transition={{ duration: 0.9, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-5 border-b border-t border-ink/15 py-10 first:border-t-0 md:grid-cols-12 md:gap-10 md:py-16"
            >
              <div className="flex items-start gap-3 md:col-span-2">
                <span className="pt-2 text-[0.62rem] tracking-[0.22em] text-ink/75">0{i + 1}</span>
                <span className="mt-3 hidden h-px w-10 bg-ink/30 md:block" />
              </div>
              <p className="font-display text-[clamp(2.4rem,5.6vw,5.8rem)] leading-[0.94] tracking-[-0.02em] text-ink md:col-span-7">
                {line}
              </p>
              <p className="text-[0.92rem] font-light leading-[1.8] text-ink/70 md:col-span-3 md:pt-3 md:text-[1rem]">
                {note}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[440px] text-[0.9rem] font-light leading-[1.8] text-ink/65">
            Written into the brief before a single wall was drawn.
          </p>
          <span className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/75">
            Keep scrolling · The address
          </span>
        </div>
      </div>
    </section>
  )
}
