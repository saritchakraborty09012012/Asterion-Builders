import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Community, WorldLighting } from '../three/World'
import SitePlan from '../components/SitePlan'
import { Arrow, Label } from '../components/ui'
import { DISTANCES, SITE, STATS } from '../data/site'

/* ------------------------------------------------------------------ */
/*  slow aerial orbit                                                  */
/* ------------------------------------------------------------------ */
function TopRig() {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0, 24, 0))

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const narrow = size.width < 760
    const radius = narrow ? 620 : 560
    const height = narrow ? 660 : 540
    const angle = t * 0.026 + state.pointer.x * 0.08
    const tx = Math.sin(angle) * radius
    const tz = Math.cos(angle) * radius
    const ty = height + state.pointer.y * 18

    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 1.6, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 1.6, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 1.6, dt)
    camera.lookAt(look.current)

    if ('fov' in camera) {
      const cam = camera as THREE.PerspectiveCamera
      cam.fov = THREE.MathUtils.damp(cam.fov, narrow ? 52 : 40, 2, dt)
      cam.updateProjectionMatrix()
    }
  })
  return null
}

/* ------------------------------------------------------------------ */
/*  section                                                            */
/* ------------------------------------------------------------------ */
export default function TopView() {
  const ref = useRef<HTMLElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '500px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="location" ref={ref} className="relative overflow-hidden bg-paper text-ink">
      <div className="px-[var(--gutter)] pb-8 pt-24 md:pt-32">
        <div className="flex items-start justify-between border-b border-ink/12 pb-5">
          <Label index="08">The address</Label>
          <span className="micro hidden text-ink/65 md:block">
            {SITE.city} · {SITE.region}
          </span>
        </div>

        <div className="mt-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="display text-[clamp(3.2rem,8.4vw,8.8rem)] leading-[0.84]">
            Everything,
            <br />
            <span className="italic text-ink/70">close.</span>
          </h2>
          <div className="max-w-[330px] lg:pb-2">
            <p className="body-copy text-ink/75">
              Sector 137, on the Noida Expressway. The metro is eight minutes
              away; Delhi is twenty-five. The city is close enough to be useful,
              and far enough to be quiet.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[0.56rem] uppercase tracking-[0.22em] text-ink/70">
              <span className="h-1 w-1 rounded-full bg-clay" />
              <span>Live community · drag the city</span>
            </div>
          </div>
        </div>
      </div>

      {/* aerial view */}
      <div className="relative mx-[var(--gutter)]">
        <div className="relative aspect-[16/11] overflow-hidden border border-ink/12 bg-[#d9cbb6] md:aspect-[16/8.2]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,#eee3d1_0%,#d8c8b1_55%,#b9a68c_100%)]" />
          {mounted && (
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 560, 560], fov: 40, near: 4, far: 2600 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              onCreated={({ gl }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping
                gl.toneMappingExposure = 1.04
                gl.setClearColor(0x000000, 0)
              }}
            >
              <Suspense fallback={null}>
                <color attach="background" args={['#ddcfba']} />
                <fog attach="fog" args={['#ddcfba', 780, 1750]} />
                <WorldLighting />
                <Community showTower towerScale={1.95} />
                <TopRig />
              </Suspense>
            </Canvas>
          )}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(26,27,24,0.18)_100%)]" />

          {/* map annotations */}
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-3 md:left-7 md:top-7">
            <svg viewBox="0 0 40 46" className="h-9 w-9 text-ink/75" fill="none">
              <circle cx="20" cy="21" r="13" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
              <path d="M20 5 L25 22 L20 19 L15 22 Z" fill="currentColor" opacity="0.85" />
              <path d="M20 37 L15 24 L20 27 L25 24 Z" fill="currentColor" opacity="0.25" />
              <text x="20" y="2.5" textAnchor="middle" fill="currentColor" style={{ fontFamily: 'Jost, sans-serif', fontSize: 6, letterSpacing: '0.2em' }}>
                N
              </text>
            </svg>
            <div>
              <div className="text-[0.56rem] uppercase tracking-[0.24em] text-ink/75">Sector 137</div>
              <div className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-ink/75">Noida · India</div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-5 left-5 md:bottom-7 md:left-7">
            <div className="flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.24em] text-ink/75">
              <span className="h-px w-7 bg-ink/30" />
              <span>Noida Expressway</span>
            </div>
          </div>

          <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rotate-180 text-[0.5rem] uppercase tracking-[0.32em] text-ink/75 [writing-mode:vertical-rl] md:block">
            The circular community · 12 acres
          </div>

          <div className="pointer-events-none absolute bottom-5 right-5 text-right md:bottom-7 md:right-7">
            <div className="font-display text-xl leading-none text-ink/80 md:text-2xl">Asterion</div>
            <div className="mt-1 text-[0.5rem] uppercase tracking-[0.22em] text-ink/75">Sector 137 · Noida</div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-clay/55" />
              <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-clay/25 [animation-duration:3.6s]" />
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay shadow-[0_0_14px_2px_rgba(165,126,86,0.45)]" />
              <div className="absolute left-11 top-1/2 hidden -translate-y-1/2 items-center gap-2.5 md:flex">
                <span className="h-px w-8 bg-clay/55 md:w-12" />
                <div className="whitespace-nowrap border border-ink/10 bg-paper/90 px-2.5 py-1.5 backdrop-blur">
                  <div className="text-[0.48rem] uppercase tracking-[0.2em] text-ink/65">Asterion</div>
                  <div className="mt-0.5 text-[0.4rem] uppercase tracking-[0.16em] text-ink/75">
                    Sector 137 · Noida
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* distances */}
      <div className="px-[var(--gutter)] pb-16 pt-10 md:pb-24 md:pt-14">
        <div className="grid gap-8 border-t border-ink/12 pt-7 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="micro text-ink/70">From the gates</div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6">
              {DISTANCES.map((d) => (
                <div key={d.label} className="border-t border-ink/15 pt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[clamp(1.7rem,2.6vw,2.4rem)] leading-none">{d.time}</span>
                    <span className="text-[0.54rem] uppercase tracking-[0.18em] text-ink/70">min</span>
                  </div>
                  <div className="mt-2 text-[0.72rem] uppercase leading-relaxed tracking-[0.14em] text-ink/70">
                    {d.label}
                  </div>
                  <div className="mt-1 text-[0.64rem] font-light leading-relaxed text-ink/75">{d.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="border border-ink/12 bg-bone p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[0.54rem] uppercase tracking-[0.24em] text-ink/70">The address</div>
                  <div className="mt-2 font-display text-2xl leading-none">{SITE.name}</div>
                </div>
                <span className="text-[0.52rem] uppercase tracking-[0.18em] text-ink/70">{SITE.lat}</span>
              </div>
              <p className="mt-3 text-[0.8rem] font-light leading-relaxed text-ink/65">{SITE.address}</p>
              <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                {[
                  ['Sales gallery', SITE.phone],
                  ['Email', SITE.email],
                  ['Coordinates', `${SITE.lat} · ${SITE.lng}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="text-[0.52rem] uppercase tracking-[0.16em] text-ink/70">{k}</dt>
                    <dd className="text-right text-[0.72rem] font-light text-ink/75">{v}</dd>
                  </div>
                ))}
              </dl>
              <a
                href="https://maps.google.com/?q=Sector+137+Noida+Expressway+Noida"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-ink/65 transition-colors hover:text-ink"
              >
                <span className="link-underline">Open in maps</span>
                <Arrow />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="relative border border-ink/12 bg-bone/70 p-3 text-forest">
              <SitePlan className="h-full w-full" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {STATS.slice(0, 2).map((s) => (
                <div key={s.label} className="border-t border-ink/15 pt-2">
                  <div className="font-display text-xl leading-none">
                    {s.value}
                    {s.suffix}
                  </div>
                  <div className="mt-1 text-[0.52rem] uppercase tracking-[0.16em] text-ink/75">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
