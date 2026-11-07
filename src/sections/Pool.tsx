import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Label } from '../components/ui'

export default function Pool() {
  const ref = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1])
  const y = useTransform(scrollYProgress, [0, 1], ['-3%', '3%'])

  return (
    <section ref={ref} id="pool" className="relative overflow-hidden bg-[#0a110c] text-bone">
      <div className="relative h-[100svh] min-h-[620px] overflow-hidden">
        <motion.div style={{ scale, y }} className="absolute inset-[-2%]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#3d6a63_0%,#16312c_58%,#08100c_100%)]" />
          <div className="absolute inset-0 translate-x-[1%] scale-[1.16]">
            <img
              src="/video/pool-poster-new.jpg"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover [filter:brightness(1.12)_contrast(1.06)_saturate(0.9)]"
            />
            <video
              ref={video}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              poster="/video/pool-poster-new.jpg"
              onCanPlay={() => {
                setReady(true)
                video.current?.play().catch(() => {})
              }}
              className={`h-full w-full object-cover [filter:brightness(1.12)_contrast(1.06)_saturate(0.9)] transition-opacity duration-1000 ${
                ready ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src="/video/pool-new.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>

        {/* grades */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_62%_52%,rgba(214,232,220,0.1)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(4,9,6,0.72)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#050906]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#06100b] via-[#06100b]/50 to-transparent" />

        {/* top rail */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-[var(--gutter)] pb-4 pt-24 md:pt-28">
          <Label index="06" light>
            The water
          </Label>
          <div className="hidden items-center gap-3 text-bone/70 md:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-clay' : 'bg-bone/30'}`} />
            <span className="text-[0.46rem] uppercase tracking-[0.26em]">
              {ready ? 'Playing continuously' : 'Loading the water'}
            </span>
          </div>
        </div>

        {/* copy */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-[var(--gutter)] pb-8 md:pb-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[900px]">
              <div className="mb-5 flex items-center gap-4">
                <span className="h-px w-10 bg-bone/35 md:w-14" />
                <span className="eyebrow text-bone/75">Podium roof · 25 metres</span>
              </div>
              <h2 className="display text-[clamp(3rem,7vw,8.4rem)] leading-[0.82] text-bone [text-shadow:0_3px_34px_rgba(4,9,6,0.42)]">
                A little
                <br />
                <span className="italic text-bone/80">nothing to do.</span>
              </h2>
              <p className="mt-6 max-w-[360px] text-[0.74rem] font-light leading-[1.9] text-bone/75">
                A 25-metre lap pool with an infinity edge, six cabanas and the
                kind of water that makes an hour disappear. Swimmers are always
                welcome; so is doing nothing at all.
              </p>
            </div>

            <div className="grid w-full max-w-[440px] grid-cols-3 border-t border-bone/15 lg:w-auto lg:min-w-[420px]">
              {[
                ['25 m', 'Lap pool'],
                ['1.2 m', 'Depth'],
                ['06', 'Cabanas'],
              ].map(([v, l], i) => (
                <div
                  key={l}
                  className={`py-4 ${i > 0 ? 'border-l border-bone/15 pl-4' : ''} ${i < 2 ? 'pr-3' : ''}`}
                >
                  <div className="font-display text-[clamp(1.5rem,2.4vw,2.2rem)] leading-none text-bone/90">
                    {v}
                  </div>
                  <div className="mt-1.5 text-[0.42rem] uppercase tracking-[0.22em] text-bone/70">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 rotate-180 text-[0.44rem] uppercase tracking-[0.34em] text-bone/55 [writing-mode:vertical-rl] xl:block">
          The water · plays continuously
        </div>
      </div>

      <div className="px-[var(--gutter)] pb-20 pt-12 md:pb-28 md:pt-16">
        <div className="grid gap-8 border-t border-bone/12 pt-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <span className="micro text-bone/55">A note on the water</span>
          </div>
          <div className="md:col-span-6">
            <p className="editorial text-[clamp(1.35rem,2.4vw,2.1rem)] leading-[1.4] text-bone/75">
              “The pool was placed where the last light lands. In the evening the
              water holds the sky, and the whole podium turns the colour of the
              horizon.”
            </p>
          </div>
          <div className="md:col-span-3 md:text-right">
            <span className="serif-italic text-2xl text-clay">Asterion Studio</span>
            <p className="mt-2 text-[0.5rem] uppercase tracking-[0.22em] text-bone/60">
              Landscape & water
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
