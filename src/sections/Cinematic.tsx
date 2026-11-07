import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, useScroll, useTransform } from 'framer-motion'
import * as THREE from 'three'
import {
  CinematicRig,
  CloudField,
  CloudsPass,
  Community,
  ConstructionSite,
  DawnSky,
  WorldLighting,
} from '../three/World'
import { scrollToId } from '../lib/scroll'

const STAGES = [
  { key: 'clouds', label: 'Above the clouds' },
  { key: 'address', label: 'The address' },
  { key: 'rise', label: 'Ready to rise' },
  { key: 'build', label: 'The build' },
  { key: 'done', label: 'The residence' },
]

function stageFor(p: number) {
  if (p < 0.15) return 0
  if (p < 0.34) return 1
  if (p < 0.49) return 2
  if (p < 0.84) return 3
  return 4
}

export default function Cinematic() {
  const ref = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      setActive(stageFor(v))
    })
    return unsub
  }, [scrollYProgress])

  const heroOpacity = useTransform(scrollYProgress, [0, 0.03, 0.072], [1, 1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.16], ['0%', '-14%'])
  // soft veil, NOT a white flash — keep the photo's texture visible so
  // the pass reads as clouds streaming past, not a plain white screen
  const cloudWash = useTransform(
    scrollYProgress,
    [0.055, 0.09, 0.128, 0.165],
    [0, 0.52, 0.32, 0]
  )
  const cloudBlur = useTransform(
    scrollYProgress,
    [0.055, 0.09, 0.128, 0.165],
    [0, 0.45, 0.28, 0]
  )
  const cloudPhoto = useTransform(
    scrollYProgress,
    [0.055, 0.092, 0.13, 0.17],
    [0, 0.94, 0.54, 0]
  )
  const cloudPhotoScale = useTransform(scrollYProgress, [0.05, 0.18], [1.04, 1.9])
  const cloudPhotoPos = useTransform(
    scrollYProgress,
    [0.05, 0.18],
    ['center 68%', 'center 30%']
  )
  const cloudCover = useTransform(scrollYProgress, [0, 0.052, 0.092], [1, 1, 0])
  const cloudCoverScale = useTransform(scrollYProgress, [0, 0.1], [1.02, 1.12])
  const readyOpacity = useTransform(
    scrollYProgress,
    [0.38, 0.42, 0.465, 0.49],
    [0, 1, 1, 0]
  )
  const readyScale = useTransform(scrollYProgress, [0.38, 0.49], [0.96, 1.04])
  const readyY = useTransform(scrollYProgress, [0.38, 0.49], ['4%', '-3%'])
  const whyOpacity = useTransform(
    scrollYProgress,
    [0.888, 0.92, 0.955, 0.985],
    [0, 1, 1, 0]
  )
  const whyY = useTransform(scrollYProgress, [0.888, 0.985], [26, -10])
  const finalOpacity = useTransform(scrollYProgress, [0.958, 0.992], [0, 1])
  const introCue = useTransform(scrollYProgress, [0, 0.06], [1, 0])
  const vignette = useTransform(
    scrollYProgress,
    [0, 0.15, 0.45, 0.84, 1],
    [0.3, 0.18, 0.22, 0.18, 0.3]
  )

  return (
    <section ref={ref} id="top" className="relative h-[720vh] bg-[#cbb8a2] text-bone">
      <div ref={canvasRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {mounted && (
          <Canvas
            shadows
            dpr={[1, 1.65]}
            camera={{ position: [0, 312, 610], fov: 43, near: 4, far: 2600 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping
              gl.toneMappingExposure = 0.9
            }}
          >
            <Suspense fallback={null}>
              <fog attach="fog" args={['#d9cdbb', 420, 1800]} />
              <DawnSky />
              <WorldLighting />
              <Community />
              <ConstructionSite progress={scrollYProgress} />
              <CloudField progress={scrollYProgress} />
              <CloudsPass progress={scrollYProgress} />
              <CinematicRig progress={scrollYProgress} />
            </Suspense>
          </Canvas>
        )}

        {/* cinematic grade */}
        <motion.div
          style={{ opacity: vignette }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(9,14,11,0.85)_100%)]"
        />
        {/* photographic cloud veil — hides the township until we break through */}
        <motion.div
          style={{
            opacity: cloudCover,
            scale: cloudCoverScale,
            backgroundImage: 'url(/images/cloud_backdrop.jpg)',
          }}
          className="pointer-events-none absolute inset-0 z-[8] bg-cover bg-[center_76%] bg-no-repeat"
        />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(8,13,10,0.72)_0%,rgba(8,13,10,0.5)_36%,rgba(8,13,10,0.16)_64%,transparent_82%)]"
        />
        <motion.div
          style={{ opacity: heroOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[58%] bg-[linear-gradient(0deg,rgba(8,13,10,0.46)_0%,rgba(8,13,10,0.16)_52%,transparent_100%)]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0a0f0c]/45 to-transparent" />

        {/* cloud pass — photo zooms and dives toward the deck while the
            3D billboards stream past, so it feels like breaking through */}
        <motion.div
          style={{
            opacity: cloudPhoto,
            scale: cloudPhotoScale,
            backgroundPosition: cloudPhotoPos,
            backgroundImage: 'url(/images/cloud_backdrop.jpg)',
          }}
          className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat"
        />
        <motion.div
          style={{ opacity: cloudWash }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(248,244,237,0.85)_0%,rgba(243,238,229,0.7)_44%,rgba(231,222,208,0.75)_100%)]"
        />
        <motion.div
          style={{ opacity: cloudBlur }}
          className="pointer-events-none absolute inset-0 backdrop-blur-[1.5px]"
        />

        {/* hero */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-[var(--gutter)] pb-8 pt-24 md:pb-10 md:pt-28"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 text-bone/55">
              <span className="h-1 w-1 rounded-full bg-bone/60" />
              <span className="micro">Asterion Properties</span>
            </div>
            <span className="micro hidden text-bone/45 md:block">
              28.53° N · 77.39° E
            </span>
          </div>

          <div className="-mt-8 md:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 flex items-center gap-4 md:mb-7"
            >
              <span className="h-px w-10 bg-bone/40 md:w-14" />
              <span className="eyebrow text-bone/65">
                Noida · near Delhi · India
              </span>
            </motion.div>

            <h1 className="display max-w-[1080px] text-[clamp(4rem,12.2vw,12.4rem)] leading-[0.78] text-[#f7f1e5] [text-shadow:0_2px_34px_rgba(8,13,10,0.48),0_1px_2px_rgba(8,13,10,0.2)]">
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={{ y: '112%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  Asterion
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={{ y: '112%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  Residence
                </motion.span>
              </span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 flex max-w-md items-start gap-4 md:mt-8"
            >
              <span className="mt-2 h-px w-8 shrink-0 bg-bone/35" />
              <p className="text-[0.58rem] uppercase leading-[2.1] tracking-[0.34em] text-bone/70">
                A luxurious lifestyle
                <br />
                awaits you
              </p>
            </motion.div>
          </div>

          <div className="flex items-end justify-between gap-6">
            <motion.div style={{ opacity: introCue }} className="flex items-center gap-4">
              <span className="scroll-rail hidden sm:block" />
              <div className="flex flex-col gap-1.5">
                <span className="micro text-bone/55">Scroll to descend</span>
                <span className="text-[0.52rem] uppercase tracking-[0.24em] text-bone/30">
                  Drone descent · 01
                </span>
              </div>
            </motion.div>

            <div className="flex flex-col items-end gap-2">
              <span className="font-display text-lg font-light tracking-[0.2em] text-bone/90 md:text-xl">
                ASTERION
              </span>
              <span className="micro text-bone/40">Properties · Noida</span>
            </div>
          </div>
        </motion.div>

        {/* ready to rise */}
        <motion.div
          style={{ opacity: readyOpacity, scale: readyScale, y: readyY }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-[var(--gutter)] text-center"
        >
          <span className="eyebrow mb-5 text-bone/55 md:mb-7">
            A new landmark above Noida
          </span>
          <h2 className="display text-[clamp(3.6rem,13.5vw,14rem)] leading-[0.8] text-bone drop-shadow-[0_4px_40px_rgba(10,14,11,0.35)]">
            Ready
            <br />
            to Rise.
          </h2>
          <div className="mt-7 flex items-center gap-5 md:mt-10">
            <span className="h-px w-10 bg-bone/30" />
            <span className="micro text-bone/50">Fifteen levels · Sixty homes</span>
            <span className="h-px w-10 bg-bone/30" />
          </div>
        </motion.div>

        {/* why builders */}
        <motion.div
          style={{ opacity: whyOpacity }}
          className="pointer-events-none absolute inset-0 z-10"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,10,0.62)_0%,rgba(8,13,10,0.38)_48%,rgba(8,13,10,0.6)_100%)] md:hidden" />
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(8,13,10,0.82)_0%,rgba(8,13,10,0.62)_34%,rgba(8,13,10,0.24)_58%,transparent_78%)] md:block" />
        </motion.div>
        <motion.div
          style={{ opacity: whyOpacity, y: whyY }}
          className="pointer-events-none absolute inset-x-0 top-[19%] z-20 px-[var(--gutter)] md:top-[17%]"
        >
          <div className="max-w-[800px]">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-bone/45" />
              <span className="eyebrow text-bone/70">The hand behind the home</span>
            </div>
            <h2 className="mt-4 display text-[clamp(3.2rem,8.8vw,9rem)] leading-[0.82] text-bone drop-shadow-[0_3px_28px_rgba(10,14,11,0.38)]">
              Why Asterion
              <br />
              Builders?
            </h2>
            <div className="mt-7 flex max-w-[560px] flex-col gap-5 md:flex-row md:gap-9">
              <p className="shrink-0 text-[0.58rem] uppercase leading-[2.2] tracking-[0.3em] text-bone/80">
                Built for ambition.
                <br />
                Designed for possibility.
              </p>
              <p className="max-w-[280px] border-l border-bone/20 pl-5 text-[0.76rem] font-light leading-[1.9] text-bone/70">
                Three decades of building in the NCR, and one idea held throughout:
                a home should be made slowly enough to be made properly.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-bone/15 pt-5">
              {[
                ['30', 'years in the NCR'],
                ['60', 'homes, one address'],
                ['15', 'levels above the garden'],
              ].map(([n, label]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <span className="font-display text-2xl leading-none text-bone/90 md:text-3xl">{n}</span>
                  <span className="text-[0.46rem] uppercase tracking-[0.24em] text-bone/45">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* completion cue */}
        <motion.div
          style={{ opacity: finalOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-[var(--gutter)] pb-8"
        >
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-bone/35" />
            <span className="micro text-bone/50">The residence, complete</span>
          </div>
          <button
            onClick={() => scrollToId('#residences')}
            className="pointer-events-auto flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.28em] text-bone/65 transition-colors hover:text-bone"
          >
            <span className="link-underline">Explore the residences</span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-bone/25">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <path d="M12 4v15M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1" />
              </svg>
            </span>
          </button>
        </motion.div>

        {/* stage rail */}
        <div className="absolute right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center justify-end gap-3">
              <span
                className={`text-[0.46rem] uppercase tracking-[0.24em] transition-all duration-700 ${
                  active === i ? 'text-bone/80' : 'text-bone/0'
                }`}
              >
                {s.label}
              </span>
              <span
                className={`h-px transition-all duration-700 ${
                  active === i ? 'w-8 bg-bone/70' : 'w-3 bg-bone/30'
                }`}
              />
            </div>
          ))}
        </div>

        {/* bottom scrub */}
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 md:flex">
          <span className="micro text-bone/40">01</span>
          <div className="h-px w-24 bg-bone/20">
            <motion.div
              className="h-px origin-left bg-bone/75"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
          <span className="micro text-bone/40">05</span>
        </div>
      </div>
    </section>
  )
}
