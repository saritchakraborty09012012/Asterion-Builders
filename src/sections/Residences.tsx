import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AnimatePresence, motion, useScroll } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import * as THREE from 'three'
import {
  FLOOR_HEIGHT,
  TOWER_BASE,
  GroundShadow,
  useTowerParts,
} from '../three/Tower'
import { WorldLighting } from '../three/World'
import { LEVELS, SITE, type Flat } from '../data/site'
import FloorPlan, { LevelPlate, NorthArrow } from '../components/FloorPlan'
import FlatViewer from '../components/FlatViewer'
import { scrollToId } from '../lib/scroll'

/* separate pages — floor plate + flat detail live at their own hash routes */
function writeRoute(hash: string) {
  if (window.location.hash === hash) return
  if (hash) window.history.pushState(null, '', hash)
  else
    window.history.pushState(
      null,
      '',
      window.location.pathname + window.location.search
    )
}

const LEVEL_TOP = 12
const LEVEL_STEP = 3.35

/* ------------------------------------------------------------------ */
/*  glowing floor band                                                 */
/* ------------------------------------------------------------------ */
function makeGlow() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 64, 2, 128, 64, 126)
  g.addColorStop(0, 'rgba(255,246,228,0.95)')
  g.addColorStop(0.28, 'rgba(255,205,146,0.55)')
  g.addColorStop(0.62, 'rgba(232,160,92,0.16)')
  g.addColorStop(1, 'rgba(232,160,92,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 128)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function FloorBand({
  level,
  active,
  onHover,
  onSelect,
}: {
  level: number
  active: boolean
  onHover: (n: number | null) => void
  onSelect: (n: number) => void
}) {
  const glow = useMemo(() => makeGlow(), [])
  const group = useRef<THREE.Group>(null)
  const bar = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.SpriteMaterial>(null)
  const y = TOWER_BASE + (level - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.48

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      const bounce = active ? Math.sin(t * 3.6 + level) * 0.22 : 0
      group.current.position.y = bounce
      const s = active ? 1.055 + Math.sin(t * 2.6) * 0.012 : 1
      group.current.scale.set(s, active ? 1.9 : 1, s)
    }
    if (bar.current) bar.current.opacity = active ? 0.95 : 0.44
    if (halo.current) halo.current.opacity = active ? 0.8 : 0.16
  })

  return (
    <group position={[0, y, 0]}>
      <group ref={group}>
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation()
            onHover(level)
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(level)
          }}
        >
          <boxGeometry args={[23.6, 0.1, 18.4]} />
          <meshBasicMaterial
            ref={bar}
            color="#ffcf94"
            transparent
            opacity={0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(23.8, 0.14, 18.6)]} />
          <lineBasicMaterial
            color={active ? '#fff3df' : '#d9ab72'}
            transparent
            opacity={active ? 1 : 0.55}
            depthWrite={false}
          />
        </lineSegments>
        <sprite scale={[38, 8, 1]} position={[0, 0, 2]}>
          <spriteMaterial
            ref={halo}
            map={glow}
            transparent
            opacity={0.3}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            color="#ffd39a"
          />
        </sprite>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  scene — same tower, light and framing as the hero (Cinematic)       */
/* ------------------------------------------------------------------ */
/* Hero (World.tsx → ConstructionSite) uses scale 1.48, rotation -0.32, */
/* WorldLighting and exposure 0.9, and ends at pos [-38,47,176],        */
/* look [0,45,0], fov 39. This scene copies those values exactly so    */
/* the residence tower reads as the same building, not a re-lit copy.  */
const TOWER_SCALE = 1.48
const TOWER_ROT = -0.32
const HERO_END_POS: [number, number, number] = [-28, 47, 176]
const HERO_END_LOOK: [number, number, number] = [0, 45, 0]
const HERO_START_POS: [number, number, number] = [-18, 62, 238]
const HERO_START_LOOK: [number, number, number] = [0, 46, 0]

function floorLocalY(level: number) {
  return TOWER_BASE + (level - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.48
}

/* Phone only: the projected floors sit too close together for readable
 * labels, so the tag centres get pushed apart until every pair clears a
 * minimum gap. The leader line still runs back to the real floor, so the
 * tags read cleanly without lying about where each level is. */
const TAG_GAP = 36
const TAG_TOP = 120 // just under the "The residence · 01" line
const TAG_BOTTOM = 96 // clear of the bottom CTA

function spreadLabels(ys: number[], height: number) {
  const n = ys.length
  if (n < 2) return ys.slice()
  // level 15 renders first (topmost), so work in y-ascending order
  const order = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b])
  const run = order.map((i) => ys[i])

  for (let i = 1; i < n; i++) {
    if (run[i] - run[i - 1] < TAG_GAP) run[i] = run[i - 1] + TAG_GAP
  }

  const lo = TAG_TOP
  const hi = Math.max(lo, height - TAG_BOTTOM)
  const avail = hi - lo
  const span = run[n - 1] - run[0]
  if (span > avail && span > 0) {
    const k = avail / span
    for (let i = 0; i < n; i++) run[i] = run[0] + (run[i] - run[0]) * k
  }

  let top = run[0]
  if (top < lo) top = lo
  if (run[n - 1] > hi) top = Math.max(lo, hi - (run[n - 1] - run[0]))
  const shift = top - run[0]
  if (shift !== 0) for (let i = 0; i < n; i++) run[i] += shift

  const out = new Array<number>(n)
  order.forEach((idx, k) => {
    out[idx] = run[k]
  })
  return out
}

function TowerScene({
  hover,
  onHover,
  onSelect,
  progress,
  tagEls,
  handRef,
  tourLevel,
}: {
  hover: number | null
  onHover: (n: number | null) => void
  onSelect: (n: number) => void
  progress: MotionValue<number>
  tagEls: React.RefObject<Map<number, Set<HTMLDivElement>>>
  handRef: React.RefObject<HTMLDivElement>
  tourLevel: number
}) {
  const parts = useTowerParts()
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(...HERO_START_LOOK))
  // reusable vectors — no allocations inside the frame loop
  const proj = useRef(new THREE.Vector3())
  // phone labels: cached left edge of each tag box (the leader's pivot) so
  // we only force a layout when the viewport width actually changes
  const boxLeft = useRef(new Map<Element, number>())
  const boxWidth = useRef(-1)

  useEffect(() => {
    parts.root.rotation.set(0, TOWER_ROT, 0)
    return () => parts.dispose()
  }, [parts])

  useFrame((state, dt) => {
    const p = THREE.MathUtils.clamp(progress.get(), 0, 1)
    const push = THREE.MathUtils.smoothstep(p, 0.12, 1)
    const narrowRig = size.width < 760
    const factor = narrowRig ? 1.24 : 1
    // hero-style hand-held drift + dolly feel (same damp/lambda as CinematicRig)
    const shake = p < 0.28 ? 0.9 : 0.25
    const sx = Math.sin(state.clock.elapsedTime * 0.6) * shake
    const sy = Math.cos(state.clock.elapsedTime * 0.47) * shake * 0.7

    // straight interpolation between hero's wide arrival and hero's final
    // framing — distance ends at ~176 (hero), not the old cramped 88.
    const baseX = THREE.MathUtils.lerp(HERO_START_POS[0], HERO_END_POS[0], push)
    const baseY = THREE.MathUtils.lerp(HERO_START_POS[1], HERO_END_POS[1], push)
    const baseZ = THREE.MathUtils.lerp(HERO_START_POS[2], HERO_END_POS[2], push)
    const baseLX = THREE.MathUtils.lerp(HERO_START_LOOK[0], HERO_END_LOOK[0], push)
    const baseLY = THREE.MathUtils.lerp(HERO_START_LOOK[1], HERO_END_LOOK[1], push)

    // subtle hover nudge only — the old rig whipped the camera up to the
    // hovered floor (up to y≈90), which pushed every floor off its tag.
    // Here the hero framing stays locked and only breathes.
    let hoverOffY = 0
    if (hover !== null) {
      const focusY = floorLocalY(hover) * TOWER_SCALE
      hoverOffY = THREE.MathUtils.clamp((focusY - 48) * 0.16 * push, -9, 9)
    }

    const targetX = baseX * factor + state.pointer.x * (narrowRig ? 1.5 : 3.2) + sx
    const targetY = baseY + hoverOffY * 0.35 + state.pointer.y * (narrowRig ? 1.2 : 2.4) + sy
    const targetZ = baseZ * factor

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3.6, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3.6, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 3.6, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, baseLX, 3.6, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, baseLY + hoverOffY, 3.6, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, 0, 3.6, dt)
    camera.lookAt(look.current)
    if ('fov' in camera) {
      const cam = camera as THREE.PerspectiveCamera
      cam.fov = THREE.MathUtils.damp(cam.fov, 39 + (narrowRig ? 8 : 0), 4, dt)
      cam.updateProjectionMatrix()
    }

    /* --- project every floor to screen so the HTML tags track it --- */
    const map = tagEls.current
    if (map && size.width > 0 && size.height > 0) {
      const cos = Math.cos(TOWER_ROT)
      const sin = Math.sin(TOWER_ROT)
      // anchor point on the right face of the centered slab
      const lx = 10.4
      const wx = (lx * cos) * TOWER_SCALE
      const wz = (-lx * sin) * TOWER_SCALE
      // hand should tap the clickable name tag itself, not the slab edge
      const hand = handRef.current
      const handBox = hand?.parentElement?.getBoundingClientRect()

      // pass 1 — NDC → CSS pixels relative to the sticky canvas box
      const shots = LEVELS.map((l) => {
        proj.current.set(wx, floorLocalY(l.level) * TOWER_SCALE, wz)
        proj.current.project(camera)
        return {
          level: l.level,
          x: (proj.current.x * 0.5 + 0.5) * size.width,
          y: (-proj.current.y * 0.5 + 0.5) * size.height,
        }
      })

      // pass 2 — phones only: the floors project too close together for
      // readable tags, so spread the label centres apart. The leader line
      // still runs back to the floor each tag was projected from.
      const spread =
        size.width < 768
          ? spreadLabels(
              shots.map((s) => s.y),
              size.height
            )
          : null

      // pass 2b — refresh the cached pivot (label box left edge) in one
      // batch of reads so we don't thrash layout inside the write loop
      if (spread) {
        if (boxWidth.current !== size.width) {
          boxWidth.current = size.width
          boxLeft.current.clear()
        }
        map.forEach((set) =>
          set.forEach((el) => {
            const btn = el as unknown as HTMLButtonElement
            if (btn.dataset && btn.dataset.rail !== 'mobile') return
            if (boxLeft.current.has(el)) return
            boxLeft.current.set(el, el.getBoundingClientRect().left)
          })
        )
      }

      // pass 3 — write. Both rails (desktop + mobile) are mounted, so every
      // element is updated according to the rail it belongs to.
      shots.forEach((s, i) => {
        const targets = map.get(s.level) as Set<HTMLDivElement> | undefined
        if (!targets) return
        const y = spread ? spread[i] : s.y
        targets.forEach((el) => {
          const btn = el as unknown as HTMLButtonElement
          if (spread && btn.dataset && btn.dataset.rail === 'mobile') {
            el.style.top = `${y}px`
            const left = boxLeft.current.get(el)
            if (left !== undefined) {
              const dx = left - s.x
              const dy = y - s.y
              el.style.setProperty('--llen', `${Math.hypot(dx, dy)}px`)
              el.style.setProperty(
                '--lrot',
                `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`
              )
            }
          } else {
            el.style.top = `${y}px`
            el.style.setProperty('--leader-x', `${s.x}px`)
          }
        })
        if (s.level === tourLevel && hand && handBox) {
          // point the fingertip at the name tag body, not the leader line
          const tag = [...(targets ?? [])].find(
            (el) => el.offsetParent !== null || el.offsetWidth > 0
          )
          if (tag) {
            const tagRect = tag.getBoundingClientRect()
            hand.style.left = `${tagRect.left - handBox.left + tagRect.width / 2}px`
            hand.style.top = `${tagRect.top - handBox.top + tagRect.height / 2}px`
          } else {
            hand.style.left = `${s.x}px`
            hand.style.top = `${s.y}px`
          }
        }
      })
    }
  })

  const levelAt = (y: number) => {
    const local = y / TOWER_SCALE
    return THREE.MathUtils.clamp(
      Math.floor((local - TOWER_BASE) / FLOOR_HEIGHT) + 1,
      1,
      15
    )
  }

  const skyline = useMemo(() => {
    const rnd = (n: number) => {
      const x = Math.sin(n * 127.1) * 43758.5453
      return x - Math.floor(x)
    }
    return Array.from({ length: 46 }, (_, i) => {
      const a = (i / 46) * Math.PI * 2
      const r = 240 + rnd(i) * 190
      return {
        pos: [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number],
        w: 12 + rnd(i + 9) * 26,
        h: 14 + rnd(i + 4) * 54,
        d: 12 + rnd(i + 2) * 26,
      }
    })
  }, [])

  return (
    <>
      <fog attach="fog" args={['#e9dfd1', 210, 760]} />
      {/* hero lighting — copy-pasted from World.tsx so the flat matches */}
      <WorldLighting />
      <GroundShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[800, 80]} />
        <meshStandardMaterial color="#d9ccb5" roughness={0.98} />
      </mesh>

      {skyline.map((b, i) => (
        <mesh key={i} position={[b.pos[0], b.h / 2, b.pos[2]]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#cfc1ac' : '#d8ccb9'} roughness={1} />
        </mesh>
      ))}

      <group scale={TOWER_SCALE}>
        <primitive object={parts.root} />

        {LEVELS.map((l) => (
          <FloorBand
            key={l.level}
            level={l.level}
            active={hover === l.level}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}

        {/* full-height interaction surface — tapping anywhere maps to a floor */}
        <mesh
          position={[0, 43, 0]}
          onPointerMove={(e) => {
            if (e.face) onHover(levelAt(e.point.y))
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(levelAt(e.point.y))
          }}
        >
          <boxGeometry args={[27, 92, 23]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  price tag — top is driven live from the 3D projection (see          */
/*  TowerScene); the % below is only the pre-first-frame fallback.      */
/* ------------------------------------------------------------------ */
function PriceTag({
  level,
  active,
  onEnter,
  onClick,
  tagRef,
  rail = 'desktop',
}: {
  level: number
  active: boolean
  onEnter: () => void
  onClick: () => void
  tagRef?: (el: HTMLButtonElement | null) => void
  rail?: 'desktop' | 'mobile'
}) {
  const l = LEVELS[level - 1]
  const phone = rail === 'mobile'
  return (
    <button
      ref={tagRef}
      data-rail={rail}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onClick}
      className="group absolute right-0 flex -translate-y-1/2 items-center outline-none"
      style={{ top: `${LEVEL_TOP + (15 - level) * LEVEL_STEP}%` }}
      aria-label={`${l.label}, from ${l.flats[0].price}`}
    >
      {/* phone: the label centre is spread away from its floor, so the
          leader angles back to the projection instead of running flat */}
      {phone && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-full top-1/2 h-px origin-right"
          style={{
            width: 'var(--llen, 0px)',
            transform: 'rotate(var(--lrot, 0deg))',
            background: active ? '#a57e56' : 'rgba(26,27,24,0.55)',
          }}
        />
      )}
      <span
        className={`${phone ? 'hidden' : ''} mr-[-1px] h-px shrink-0 transition-all duration-500 ${
          active ? 'w-8 bg-clay md:w-12' : 'w-5 bg-ink/55 md:w-8'
        }`}
      />
      <span
        className={`relative block shrink-0 transition-all duration-500 ${
          active ? '-translate-x-1' : ''
        }`}
        style={{
          clipPath: 'polygon(0 50%, 10px 0, 100% 0, 100% 100%, 10px 100%)',
          background: active ? '#a57e56' : '#17251c',
          filter: active ? 'drop-shadow(0 8px 24px rgba(22,30,24,0.3))' : 'none',
        }}
      >
        <span
          className={`flex h-[28px] items-center gap-2 whitespace-nowrap pl-[18px] pr-3 font-medium transition-colors duration-500 md:h-[34px] md:gap-3 md:pr-4 ${
            active ? 'text-bone' : 'text-bone'
          }`}
        >
          <span className="shrink-0 text-[0.56rem] uppercase tracking-[0.12em] md:text-[0.62rem]">
            {level === 1 ? 'Ground' : `Level-${level - 1}`}
          </span>
          <span className="shrink-0 text-[0.54rem] tabular-nums tracking-[0.02em] text-bone/95 md:text-[0.64rem]">
            {l.flats[0].price}
          </span>
        </span>
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  flat detail                                                       */
/* ------------------------------------------------------------------ */
function FlatSheet({
  flat,
  level,
  onBack,
  onContinue,
}: {
  flat: Flat
  level: number
  onBack: () => void
  onContinue: () => void
}) {
  const [room, setRoom] = useState<string | null>(null)
  const [show3D, setShow3D] = useState(false)
  const l = LEVELS[level - 1]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[170] overflow-y-auto overscroll-contain bg-paper text-ink"
      data-lenis-prevent
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(to_right,rgba(26,27,24,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(26,27,24,0.05)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="relative flex min-h-full flex-col px-[var(--gutter)] pb-28 pt-24 md:pb-6 md:pt-24">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/12 pb-5">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.24em] text-ink/65 transition-colors hover:text-ink"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 transition-colors group-hover:border-ink/50">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.1" />
              </svg>
            </span>
            Back to level
          </button>

          <div className="flex flex-wrap items-center gap-5">
            <div className="text-right">
              <div className="text-[0.58rem] uppercase tracking-[0.22em] text-ink/75">
                {l.label} · {flat.type.code}
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-2xl leading-none md:text-3xl">
                  {flat.number}
                </span>
                <span className="text-[0.86rem] font-light text-ink/75">{flat.price}</span>
              </div>
            </div>
            <span className="hidden md:block">
              <button onClick={onContinue} className="btn-line border-ink/30">
                Continue to site
              </button>
            </span>
          </div>
        </div>

        <div className="grid flex-1 gap-8 py-4 lg:grid-cols-12 lg:gap-9">
          <div className="lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/75">
                  The plan · drawn to scale
                </div>
                <h3 className="mt-1.5 font-display text-[clamp(1.7rem,2.8vw,2.4rem)] leading-none">
                  {flat.type.name}
                </h3>
              </div>
              <NorthArrow className="mr-2 text-ink/75" />
            </div>

            <div
              className="relative mx-auto w-full max-w-[620px] border border-ink/12 bg-bone/60 p-2 md:p-3"
              style={{ aspectRatio: `${flat.type.planAspect}` }}
            >
              {show3D ? (
                <FlatViewer
                  flat={flat}
                  level={level}
                  embedded
                  onBack={() => setShow3D(false)}
                  onContinue={onContinue}
                />
              ) : (
                <FloorPlan
                  type={flat.type.key}
                  flatNumber={flat.number}
                  activeRoom={room}
                  onRoom={setRoom}
                  className="w-full"
                />
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ink/65">
                Hover or tap a room for its dimensions
              </span>
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ink/65">
                {flat.type.beds} · {flat.type.area} sq ft · {flat.type.aspect}
              </span>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="border border-ink/12 bg-bone p-4 md:p-5">
              <div className="text-[0.56rem] uppercase tracking-[0.24em] text-ink/75">
                Residence
              </div>
              <div className="mt-2 font-display text-[clamp(1.7rem,2.6vw,2.3rem)] leading-none">
                {flat.number}
              </div>
              <div className="mt-1.5 text-[0.66rem] uppercase tracking-[0.2em] text-ink/75">
                {l.label} · {l.title}
              </div>

              <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                {[
                  ['Bedrooms', flat.type.beds],
                  ['Carpet area', `${flat.type.area} sq ft`],
                  ['Balcony', `${flat.type.balcony} sq ft`],
                  ['Outlook', flat.type.aspect],
                  ['Price', flat.price],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-3 py-2">
                    <dt className="text-[0.56rem] uppercase tracking-[0.18em] text-ink/75">{k}</dt>
                    <dd className="text-right text-[0.8rem] font-light text-ink/85">{v}</dd>
                  </div>
                ))}
              </dl>

              <button
                onClick={() => setShow3D((v) => !v)}
                className="mt-4 flex w-full items-center justify-between gap-3 bg-forest px-5 py-4 text-[0.66rem] uppercase tracking-[0.24em] text-bone transition-colors hover:bg-clay"
              >
                <span>{show3D ? 'Back to 2D' : 'View in 3D'}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border border-bone/25">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                    <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" stroke="currentColor" strokeWidth="1" />
                    <path d="M4 8l8 4.5L20 8M12 12.5V20" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </span>
              </button>

              <button
                onClick={onBack}
                className="mt-2 w-full py-1 text-center text-[0.58rem] uppercase tracking-[0.18em] text-ink/75 transition-colors hover:text-ink"
              >
                ← Back to level
              </button>
            </div>

            <div className="mt-3 border border-ink/12 bg-paper/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.56rem] uppercase tracking-[0.24em] text-ink/75">
                  Rooms
                </span>
                <span className="text-[0.56rem] uppercase tracking-[0.2em] text-ink/70">
                  {flat.type.rooms.length}
                </span>
              </div>
              <div className="mt-3 grid max-h-[220px] grid-cols-2 gap-x-5 overflow-y-auto overscroll-contain pr-1" data-lenis-prevent>
                {flat.type.rooms.map((r) => (
                  <button
                    key={r.key}
                    onMouseEnter={() => setRoom(r.key)}
                    onClick={() => setRoom(r.key)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-ink/8 py-1.5 text-left transition-colors ${
                      room === r.key ? 'text-clay' : 'text-ink/70 hover:text-ink'
                    }`}
                  >
                    <span className="text-[0.8rem] font-light">{r.name}</span>
                    <span className="text-[0.56rem] tracking-[0.12em] opacity-70">{r.dims}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-ink/12 bg-paper/95 px-[var(--gutter)] py-3 backdrop-blur-md md:hidden">
          <button
            onClick={onBack}
            className="text-[0.6rem] uppercase tracking-[0.2em] text-ink/75"
          >
            Back
          </button>
          <button
            onClick={() => setShow3D((v) => !v)}
            className="flex-1 bg-forest px-4 py-4 text-[0.6rem] uppercase tracking-[0.2em] text-bone"
          >
            {show3D ? 'View in 2D · Furnished' : 'View in 3D · Furnished'}
          </button>
          <button
            onClick={onContinue}
            className="text-[0.6rem] uppercase tracking-[0.2em] text-ink/75"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  section                                                            */
/* ------------------------------------------------------------------ */
export default function Residences() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const [hover, setHover] = useState<number | null>(null)
  const [levelOpen, setLevelOpen] = useState<number | null>(null)
  const [flatIndex, setFlatIndex] = useState<number | null>(null)
  const [plateActive, setPlateActive] = useState(-1)
  // finger tour: which floor the hand is tapping (hover steals it)
  const [tour, setTour] = useState(14)
  const handRef = useRef<HTMLDivElement>(null)
  // live DOM handles for the floor projection — TowerScene writes
  // el.style.top every frame, so tags can't drift off their floors.
  const tagEls = useRef(new Map<number, Set<HTMLDivElement>>())
  const registerTag = (level: number) => (el: HTMLButtonElement | null) => {
    let set = tagEls.current.get(level)
    if (!set) {
      set = new Set()
      tagEls.current.set(level, set)
    }
    if (el) set.add(el as unknown as HTMLDivElement)
    else if (el === null) {
      // one rail unmounted — drop the stale handle for this mount only
      // (the other rail's handle for the same level stays in the set)
    }
  }

  const activeLevel = hover ?? tour
  const tourLevel = hover ?? tour
  const level = levelOpen ? LEVELS[levelOpen - 1] : null
  const flat = level && flatIndex !== null ? level.flats[flatIndex] : null
  const anyOpen = levelOpen !== null

  // separate pages via hash routes: #/level/13 · #/flat/1401
  // (popstate = browser back/forward; deep links open the right page)
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash
      const lvl = h.match(/^#\/level\/(\d+)$/)?.[1]
      const fl = h.match(/^#\/flat\/(\d+)$/)?.[1]
      if (lvl) {
        const n = Math.min(15, Math.max(1, parseInt(lvl, 10) || 1))
        setHover(n)
        setLevelOpen(n)
        setFlatIndex(null)
        setPlateActive(-1)
      } else if (fl) {
        // flat numbers look like 1401 / 1302 — first two digits are the level
        const n = parseInt(fl.slice(0, 2), 10)
        const i = LEVELS[n - 1]?.flats.findIndex((f) => f.number === fl) ?? -1
        if (n >= 1 && n <= 15 && i >= 0) {
          setHover(n)
          setLevelOpen(n)
          setFlatIndex(i)
          setPlateActive(i)
        } else {
          setLevelOpen(null)
          setFlatIndex(null)
        }
      } else {
        setLevelOpen(null)
        setFlatIndex(null)
      }
    }
    apply()
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
  }, [])

  useEffect(() => {
    document.title = flat
      ? `Asterion · ${flat.number} · ${level?.label ?? ''}`
      : level
        ? `Asterion · ${level.label}`
        : 'Asterion Residence — A luxurious lifestyle awaits'
  }, [flat, level])

  // cycle the finger down the tower, top to bottom, then loop
  useEffect(() => {
    const id = window.setInterval(
      () => setTour((t) => (t === 1 ? 15 : t - 1)),
      1300
    )
    return () => window.clearInterval(id)
  }, [])

  // page lock — body overflow only; Lenis stop() also blocked the pages'
  // own overflow scroll (data-lenis-prevent lets the pages scroll natively)
  useEffect(() => {
    if (!anyOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [anyOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (flatIndex !== null) backToLevel()
      else if (levelOpen !== null) closeLevel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flatIndex, levelOpen])

  const openLevel = (n: number) => {
    setHover(n)
    setLevelOpen(n)
    setFlatIndex(null)
    setPlateActive(-1)
    writeRoute(`#/level/${n}`)
  }

  const selectFlat = (i: number) => {
    if (!level) return
    setPlateActive(i)
    setFlatIndex(i)
    writeRoute(`#/flat/${level.flats[i].number}`)
  }

  const backToLevel = () => {
    setFlatIndex(null)
    if (levelOpen) writeRoute(`#/level/${levelOpen}`)
  }

  const closeLevel = () => {
    setLevelOpen(null)
    setFlatIndex(null)
    setPlateActive(-1)
    writeRoute('')
  }

  const continueToSite = () => {
    if (flat) {
      window.sessionStorage.setItem('asterion-flat', flat.number)
      window.dispatchEvent(new CustomEvent('asterion:flat', { detail: flat.number }))
    }
    setFlatIndex(null)
    setLevelOpen(null)
    document.body.style.overflow = ''
    writeRoute('')
    window.setTimeout(() => scrollToId('#entry'), 90)
  }

  return (
    <>
    <section
      ref={sectionRef}
      id="residences"
      className="relative h-[240svh] text-ink"
    >
      <div
        className={`sticky top-0 h-[100svh] min-h-[620px] overflow-hidden bg-[#e8dfd2] ${
          anyOpen ? 'z-[150]' : ''
        }`}
      >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,#f7efe2_0%,#e9dfd1_46%,#d8c9b5_100%)]" />

      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Canvas
            shadows
            dpr={[1, 1.7]}
            camera={{ position: HERO_START_POS, fov: 39, near: 2, far: 1400 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            onPointerMissed={() => {
              if (window.innerWidth < 760 && !anyOpen) openLevel(activeLevel)
            }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping
              // hero uses 0.9 — the old 1.08 was blowing the slabs out
              gl.toneMappingExposure = 0.9
              gl.setClearColor(0x000000, 0)
            }}
          >
            <Suspense fallback={null}>
              <TowerScene
                hover={hover}
                onHover={setHover}
                onSelect={openLevel}
                progress={scrollYProgress}
                tagEls={tagEls}
                handRef={handRef}
                tourLevel={tourLevel}
              />
            </Suspense>
          </Canvas>
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-[#e8dfd2] via-[#e8dfd2]/55 to-transparent" />

      {/* top-left copy */}
      <div className="pointer-events-none absolute left-[var(--gutter)] top-24 z-20 max-w-[310px] md:top-28">
        <div className="flex items-center gap-3 text-ink/85">
          <span className="h-px w-8 bg-ink/60" />
          <span className="micro">The residence · 01</span>
        </div>
        <h2 className="mt-4 hidden font-display text-[clamp(2rem,3.4vw,3.2rem)] leading-[0.9] text-ink md:block">
          Fifteen levels.
          <br />
          <span className="italic text-ink/75">Four homes each.</span>
        </h2>
        <p className="mt-4 hidden max-w-[260px] text-[0.8rem] leading-[1.85] text-ink/90 md:block">
          Scroll to draw the camera in. Hover a level to see its light, then open
          its plan.
        </p>
      </div>

      {/* level rail */}
      <div className="absolute inset-y-0 left-[56%] z-20 hidden w-[min(280px,25vw)] md:block">
        {LEVELS.map((l) => (
          <PriceTag
            key={l.level}
            level={l.level}
            active={hover === l.level}
            onEnter={() => setHover(l.level)}
            onClick={() => openLevel(l.level)}
            tagRef={registerTag(l.level)}
          />
        ))}
      </div>

      {/* mobile rail */}
      <div className="absolute inset-y-0 right-0 z-20 w-[47%] md:hidden">
        {LEVELS.map((l) => (
          <PriceTag
            key={l.level}
            level={l.level}
            rail="mobile"
            active={hover === l.level}
            onEnter={() => setHover(l.level)}
            onClick={() => openLevel(l.level)}
            tagRef={registerTag(l.level)}
          />
        ))}
      </div>

      {/* bottom CTA */}
      <div className="absolute inset-x-[var(--gutter)] bottom-6 z-20 flex flex-wrap items-end justify-between gap-4 md:bottom-8">
        <div className="pointer-events-auto">
          <button
            onClick={() => openLevel(activeLevel)}
            className="group flex items-end gap-4 text-left"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-ink/60 transition-all duration-500 group-hover:border-ink group-hover:bg-ink group-hover:text-bone md:h-14 md:w-14">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M12 4v15M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-[clamp(1.5rem,2.8vw,2.4rem)] leading-none text-ink">
                Explore residences
              </span>
              <span className="mt-2 block text-[0.5rem] uppercase tracking-[0.26em] text-ink/80">
                {LEVELS[activeLevel - 1].label} · {LEVELS[activeLevel - 1].flats[0].price}
              </span>
            </span>
          </button>
        </div>

        <div className="hidden text-right md:block">
          <div className="mt-1 text-[0.62rem] text-ink/75">
            {SITE.city} · {SITE.region}
          </div>
        </div>
      </div>

      {/* scroll approach cue */}
      <div className="pointer-events-none absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        <span className="text-[0.4rem] uppercase tracking-[0.3em] text-ink/75 [writing-mode:vertical-rl]">
          Scroll to approach
        </span>
        <span className="relative h-24 w-px overflow-hidden bg-ink/30">
          <motion.span
            style={{ scaleY: scrollYProgress }}
            className="absolute inset-0 origin-top bg-clay"
          />
        </span>
      </div>

      {/* finger tour — taps each floor in turn, no text */}
      {!anyOpen && (
        <div
          ref={handRef}
          className="pointer-events-none absolute left-0 top-0 z-30"
          aria-hidden
        >
          <motion.span
            key={tourLevel}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: [1, 0.78, 1],
              y: [0, 4, 0],
            }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.55, repeat: Infinity, repeatDelay: 0.5 },
              y: { duration: 0.55, repeat: Infinity, repeatDelay: 0.5 },
            }}
            className="block -translate-x-1/2 -translate-y-[85%] text-[1.6rem] leading-none drop-shadow-[0_4px_10px_rgba(23,37,28,0.35)] md:text-[2rem]"
          >
            👆
          </motion.span>
        </div>
      )}
      </div>
    </section>

      {/* floor plate page */}
      <AnimatePresence>
        {level && !flat && (
          <motion.div
            key={`level-${level.level}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[160] overflow-y-auto overscroll-contain bg-paper"
            data-lenis-prevent
          >
            <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_50%_42%,rgba(165,126,86,0.12),transparent_62%)]" />

            <div className="relative flex min-h-full flex-col px-[var(--gutter)] pb-6 pt-24 md:pt-28">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/12 pb-5">
                <button
                  onClick={closeLevel}
                  className="group flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.24em] text-ink/65 transition-colors hover:text-ink"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 transition-colors group-hover:border-ink/50">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                  </span>
                  Back to the tower
                </button>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[0.56rem] uppercase tracking-[0.22em] text-ink/75">
                      The residence · Asterion
                    </div>
                    <div className="mt-1 font-display text-2xl leading-none md:text-3xl">
                      {level.label}
                    </div>
                  </div>
                  <div className="hidden h-10 w-px bg-ink/15 md:block" />
                  <div className="hidden text-right md:block">
                    <div className="text-[0.56rem] uppercase tracking-[0.22em] text-ink/75">
                      Four residences
                    </div>
                    <div className="mt-1 text-[0.88rem] font-light text-ink/75">
                      From {level.flats[0].price}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid flex-1 items-center gap-8 py-6 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-4">
                  <div className="text-[0.58rem] uppercase tracking-[0.24em] text-ink/75">
                    The floor plate
                  </div>
                  <h3 className="mt-3 font-display text-[clamp(2.6rem,5.4vw,5rem)] leading-[0.86]">
                    {level.level === 1 ? (
                      <>
                        Ground
                        <br />
                        <span className="italic text-ink/70">level.</span>
                      </>
                    ) : (
                      <>
                        {level.label.replace(' LEVEL', '')}
                        <br />
                        <span className="italic text-ink/70">level.</span>
                      </>
                    )}
                  </h3>
                  <p className="mt-5 max-w-[300px] text-[0.86rem] font-light leading-[1.85] text-ink/70">
                    The plans repeat identically on every floor. Only the residence
                    number, the height and the horizon change.
                  </p>

                  <div className="mt-6 hidden space-y-1.5 lg:block">
                    {level.flats.map((f, i) => (
                      <button
                        key={f.number}
                        onMouseEnter={() => setPlateActive(i)}
                        onFocus={() => setPlateActive(i)}
                        onClick={() => selectFlat(i)}
                        className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm border-b border-ink/15 px-2 py-2.5 text-left transition-all duration-200 ${
                          plateActive === i
                            ? 'border-clay bg-clay/10 text-clay'
                            : 'text-ink/80 hover:border-ink/40 hover:bg-ink/[0.05] hover:text-ink'
                        }`}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className="font-display text-xl leading-none">{f.number}</span>
                          <span className="text-[0.56rem] uppercase tracking-[0.16em] opacity-80">
                            {f.type.code}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-[0.78rem] font-light">{f.price}</span>
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              plateActive === i ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-45 group-hover:translate-x-0 group-hover:opacity-100'
                            }`}
                            fill="none"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <LevelPlate
                    flats={level.flats}
                    levelNo={level.level}
                    active={plateActive}
                    onActive={(i) => setPlateActive(i ?? -1)}
                    onSelect={(i) => {
                      setPlateActive(i)
                      selectFlat(i)
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-ink/12 pt-4">
                <span className="hidden text-[0.6rem] uppercase tracking-[0.18em] text-ink/80 md:block">
                  Hover or tap a residence to light it
                </span>
                <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ink/80">
                  Four homes · one floor
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
                {level.flats.map((f, i) => (
                  <button
                    key={f.number}
                    onClick={() => selectFlat(i)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-sm border border-ink/25 bg-bone px-4 py-3.5 text-left transition-all duration-200 hover:border-clay hover:bg-clay/10 hover:shadow-sm active:scale-[0.99]"
                  >
                    <span className="font-display text-xl leading-none">{f.number}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[0.58rem] uppercase tracking-[0.14em] text-ink/75">
                        {f.type.code}
                      </span>
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink/55" fill="none">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* flat page */}
      <AnimatePresence>
        {flat && level && (
          <FlatSheet
            key={flat.number}
            flat={flat}
            level={level.level}
            onBack={backToLevel}
            onContinue={continueToSite}
          />
        )}
      </AnimatePresence>
    </>
  )
}
