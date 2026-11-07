import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { MotionValue } from 'framer-motion'
import { useTowerParts } from './Tower'

/* ------------------------------------------------------------------ */
/*  deterministic random                                               */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/*  sky                                                                */
/* ------------------------------------------------------------------ */
export function DawnSky() {
  const photo = useTexture('/images/hero_clouds.jpg') as THREE.Texture

  const material = useMemo(() => {
    photo.colorSpace = THREE.SRGBColorSpace
    photo.wrapS = THREE.MirroredRepeatWrapping
    photo.wrapT = THREE.ClampToEdgeWrapping
    // sample only the clear sky above the photograph's cloud sea, so no
    // distant cloud bank is projected above the township's horizon
    photo.repeat.set(3, 0.56)
    photo.offset.set(0, 0.44)
    photo.anisotropy = 16
    photo.needsUpdate = true
    return new THREE.MeshBasicMaterial({
      map: photo,
      color: '#f6f3ec',
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
  }, [photo])

  return (
    <mesh material={material} scale={1800} renderOrder={-10}>
      <sphereGeometry args={[1, 64, 40]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  clouds                                                             */
/* ------------------------------------------------------------------ */
/*  The opening frame is a photographic cloud plate, mapped far behind  */
/*  the scene so it behaves like a matte painting rather than a flat    */
/*  UI background. It fades as the camera breaks through the cloud      */
/*  layer, while the whiteout overlay in Cinematic handles the pass.    */
const CLOUD_BACKDROP = '/images/cloud_backdrop.jpg'

export function CloudField({ progress }: { progress: MotionValue<number> }) {
  const backdrop = useTexture(CLOUD_BACKDROP) as THREE.Texture
  const mesh = useRef<THREE.Mesh>(null)

  const material = useMemo(() => {
    backdrop.colorSpace = THREE.SRGBColorSpace
    backdrop.anisotropy = 16
    backdrop.needsUpdate = true
    return new THREE.MeshBasicMaterial({
      map: backdrop,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  }, [backdrop])

  useFrame(() => {
    const p = progress.get()
    const fade = p < 0.085 ? 1 : Math.max(0, 1 - (p - 0.085) / 0.075)
    material.opacity = fade
    if (mesh.current) mesh.current.visible = fade > 0.004
  })

  // horizon line in the source sits at ~76% from the top; place it at eye
  // height so the plate reads as a real horizon during the descent
  return (
    <mesh ref={mesh} position={[0, 905, -1700]} renderOrder={-6} material={material}>
      <planeGeometry args={[7200, 2287]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  passing clouds — real 3D billboards the drone flies through         */
/* ------------------------------------------------------------------ */
/*  The old whiteout was a flat DOM veil, so the descent read as a      */
/*  plain white flash. These soft puff sprites live in 3D along the    */
/*  camera corridor, so each one sweeps past with true parallax and     */
/*  the camera briefly engulfs in textured cloud instead of a wash.    */
function makePuffTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(77)
  // cauliflower puffs — many overlapping soft radial blooms
  for (let i = 0; i < 90; i++) {
    const x = 128 + (rnd() - 0.5) * 150
    const y = 128 + (rnd() - 0.5) * 90
    const r = 26 + rnd() * 62
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.20)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.11)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // gentle grey under-shading so puffs read volumetric, not flat white
  const under = ctx.createLinearGradient(0, 120, 0, 256)
  under.addColorStop(0, 'rgba(150,162,175,0)')
  under.addColorStop(1, 'rgba(150,162,175,0.16)')
  ctx.fillStyle = under
  ctx.fillRect(0, 120, 256, 136)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

export function CloudsPass({ progress }: { progress: MotionValue<number> }) {
  const tex = useMemo(() => makePuffTexture(), [])
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const matRefs = useRef<(THREE.SpriteMaterial | null)[]>([])
  const sprRefs = useRef<(THREE.Sprite | null)[]>([])

  const clouds = useMemo(() => {
    const rnd = mulberry32(1234)
    const arr: {
      pos: [number, number, number]
      scale: [number, number]
      base: number
      rotSpeed: number
      phase: number
    }[] = []
    for (let i = 0; i < 52; i++) {
      // spread along the descent corridor, mostly ahead of the start
      // camera (z 610) so the opening frame stays clean
      const x = (rnd() - 0.5) * 560
      const y = 28 + rnd() * 300
      const z = -60 + rnd() * 520
      const s = 58 + rnd() * 170
      arr.push({
        pos: [x, y, z],
        scale: [s, s * (0.52 + rnd() * 0.42)],
        base: 0.3 + rnd() * 0.48,
        rotSpeed: (rnd() - 0.5) * 0.05,
        phase: rnd() * Math.PI * 2,
      })
    }
    return arr
  }, [])

  useFrame((state, dt) => {
    const p = THREE.MathUtils.clamp(progress.get(), 0, 1)
    // fade in as we reach the deck, burst through, gone by p=0.20
    let fade: number
    if (p < 0.04) fade = 0.3
    else if (p < 0.10) fade = THREE.MathUtils.lerp(0.3, 1, THREE.MathUtils.smoothstep((p - 0.04) / 0.06, 0, 1))
    else if (p < 0.20) fade = 1 - THREE.MathUtils.smoothstep((p - 0.10) / 0.10, 0, 1)
    else fade = 0
    if (group.current) group.current.visible = fade > 0.01
    if (fade <= 0.01) return
    const t = state.clock.elapsedTime
    clouds.forEach((c, i) => {
      const mat = matRefs.current[i]
      const spr = sprRefs.current[i]
      if (!mat || !spr) return
      mat.rotation += c.rotSpeed * dt
      // slow breathing drift — base position stays, so parallax stays true
      spr.position.x = c.pos[0] + Math.sin(t * 0.06 + c.phase) * 10
      spr.position.y = c.pos[1] + Math.cos(t * 0.05 + c.phase) * 6
      const dist = spr.position.distanceTo(camera.position)
      // engulf moment: when the camera is inside a puff, go full so the
      // pass reads textured, not a uniform white cut
      const engulf = dist < 26 ? 1 : dist < 90 ? 0.9 : 1
      const aerial = THREE.MathUtils.clamp(1.25 - dist / 520, 0.35, 1)
      mat.opacity = c.base * fade * engulf * aerial
    })
  })

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <sprite
          key={i}
          ref={(s: THREE.Sprite | null) => {
            sprRefs.current[i] = s
          }}
          position={c.pos}
          scale={[c.scale[0], c.scale[1], 1]}
          renderOrder={6}
        >
          <spriteMaterial
            ref={(m: THREE.SpriteMaterial | null) => {
              matRefs.current[i] = m
            }}
            map={tex}
            color="#f6f2e8"
            transparent
            opacity={0}
            depthWrite={false}
            depthTest
            fog={false}
          />
        </sprite>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  the circular neighbourhood                                         */
/* ------------------------------------------------------------------ */
function makeFacadeTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e6ddcf'
  ctx.fillRect(0, 0, 256, 128)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const x = 10 + col * 31
      const y = 22 + row * 48
      ctx.fillStyle = `rgba(38,45,45,${0.42 + (col % 3) * 0.08})`
      ctx.fillRect(x, y, 17, 21)
      ctx.fillStyle = 'rgba(255,246,225,0.18)'
      ctx.fillRect(x + 1, y + 1, 15, 4)
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  for (let i = 0; i < 8; i++) ctx.fillRect(i * 32, 0, 1, 128)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, 1)
  t.needsUpdate = true
  return t
}

function makeGroundTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(91)
  ctx.fillStyle = '#a3a184'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 280; i++) {
    const x = rnd() * 512
    const y = rnd() * 512
    const r = 8 + rnd() * 46
    ctx.fillStyle = `rgba(${74 + rnd() * 52},${88 + rnd() * 50},${58 + rnd() * 34},${0.05 + rnd() * 0.1})`
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.6, rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 512
    const y = rnd() * 512
    ctx.fillStyle = `rgba(220,212,188,${0.04 + rnd() * 0.08})`
    ctx.fillRect(x, y, 12 + rnd() * 70, 1 + rnd() * 3)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(7, 7)
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

function makeGrassTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(717)
  ctx.fillStyle = '#5d674b'
  ctx.fillRect(0, 0, 512, 512)
  // broad tonal patches, mown strips and dry edges
  for (let i = 0; i < 180; i++) {
    const x = rnd() * 512
    const y = rnd() * 512
    const r = 14 + rnd() * 70
    const v = 70 + rnd() * 54
    ctx.fillStyle = `rgba(${v - 14},${v},${v - 28},${0.05 + rnd() * 0.11})`
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.4 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 32; i++) {
    const y = rnd() * 512
    ctx.fillStyle = `rgba(208,206,181,${0.015 + rnd() * 0.035})`
    ctx.fillRect(0, y, 512, 2 + rnd() * 9)
  }
  for (let i = 0; i < 4600; i++) {
    const v = 52 + rnd() * 58
    ctx.fillStyle = `rgba(${v - 16},${v},${v - 26},${0.12 + rnd() * 0.28})`
    ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(30, 30)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 16
  t.needsUpdate = true
  return t
}

function makeFoliageBump() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(423)
  ctx.fillStyle = '#7c7c7c'
  ctx.fillRect(0, 0, 256, 256)
  // clustered leaf masses catch the sun unevenly and break up the facets
  for (let i = 0; i < 5600; i++) {
    const x = rnd() * 256
    const y = rnd() * 256
    const v = 104 + rnd() * 106
    ctx.fillStyle = `rgba(${v},${v},${v},${0.22 + rnd() * 0.5})`
    ctx.beginPath()
    ctx.ellipse(x, y, 1 + rnd() * 3.6, 0.7 + rnd() * 2.1, rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 260; i++) {
    const x = rnd() * 256
    const y = rnd() * 256
    const v = 44 + rnd() * 46
    ctx.fillStyle = `rgba(${v},${v},${v},${0.16 + rnd() * 0.3})`
    ctx.beginPath()
    ctx.arc(x, y, 1 + rnd() * 4, 0, Math.PI * 2)
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2.4, 2.4)
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

function makeAsphaltTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(311)
  ctx.fillStyle = '#494843'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 17000; i++) {
    const v = 46 + rnd() * 54
    ctx.fillStyle = `rgba(${v},${v + 1},${v - 3},${0.16 + rnd() * 0.26})`
    ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  for (let i = 0; i < 200; i++) {
    const x = rnd() * 512
    const y = rnd() * 512
    ctx.fillStyle = `rgba(24,24,23,${0.05 + rnd() * 0.16})`
    ctx.beginPath()
    ctx.ellipse(x, y, 4 + rnd() * 24, 2 + rnd() * 9, rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(10, 10)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 16
  t.needsUpdate = true
  return t
}

function makeDirtTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(505)
  ctx.fillStyle = '#8d7257'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 700; i++) {
    const x = rnd() * 512
    const y = rnd() * 512
    const v = 76 + rnd() * 72
    ctx.fillStyle = `rgba(${v},${v * 0.8},${v * 0.6},${0.08 + rnd() * 0.22})`
    ctx.beginPath()
    ctx.ellipse(x, y, 2 + rnd() * 26, 1 + rnd() * 12, rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 12; i++) {
    const y = rnd() * 512
    ctx.fillStyle = `rgba(52,43,34,${0.1 + rnd() * 0.16})`
    ctx.fillRect(0, y, 512, 2 + rnd() * 4)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(4, 4)
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

function makeContactShadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126)
  g.addColorStop(0, 'rgba(12,14,11,0.56)')
  g.addColorStop(0.42, 'rgba(12,14,11,0.30)')
  g.addColorStop(0.75, 'rgba(12,14,11,0.09)')
  g.addColorStop(1, 'rgba(12,14,11,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function makeFormworkTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(919)
  ctx.fillStyle = '#b4ada0'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 3200; i++) {
    const v = 150 + rnd() * 50
    ctx.fillStyle = `rgba(${v},${v - 2},${v - 8},${0.06 + rnd() * 0.12})`
    ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  // shutter panel joints and tie-rod holes
  ctx.strokeStyle = 'rgba(96,91,82,0.35)'
  ctx.lineWidth = 1
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }
  for (let x = 0; x <= 256; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 256)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(94,89,80,0.22)'
  for (let y = 16; y < 256; y += 32) {
    for (let x = 32; x < 256; x += 64) {
      ctx.beginPath()
      ctx.arc(x, y, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 6)
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

function palmCrownGeometry() {
  const leaves: THREE.BufferGeometry[] = []
  const count = 11
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const g = new THREE.PlaneGeometry(1.1, 5.2, 1, 4)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v)
      const k = (y + 2.6) / 5.2
      pos.setX(v, pos.getX(v) * (1 - k * 0.55))
      pos.setZ(v, -k * k * 1.3)
    }
    g.rotateX(-Math.PI / 2 + 0.35)
    g.rotateY(a)
    g.translate(0, 0.1, 0)
    leaves.push(g)
  }
  const merged = mergeGeometries(leaves.map((g) => g.toNonIndexed()), false)!
  leaves.forEach((g) => g.dispose())
  return merged
}

/* ------------------------------------------------------------------ */
/*  the township                                                       */
/* ------------------------------------------------------------------ */
type TowerDef = {
  x: number
  z: number
  w: number
  d: number
  h: number
  rot: number
  style: number
  wing?: { w: number; d: number; h: number; ox: number; oz: number }
  crown?: boolean
}

const TOWERS: TowerDef[] = [
  { x: -126, z: -112, w: 30, d: 18, h: 64, rot: 0.14, style: 0, wing: { w: 13, d: 12, h: 46, ox: 14.5, oz: 5 }, crown: true },
  { x: 94, z: -148, w: 26, d: 19, h: 77, rot: -0.24, style: 1, wing: { w: 12, d: 11, h: 57, ox: -12, oz: -5 }, crown: true },
  { x: 186, z: -55, w: 23, d: 18, h: 59, rot: -0.04, style: 2 },
  { x: 176, z: 92, w: 29, d: 18, h: 68, rot: 0.18, style: 3, wing: { w: 12, d: 12, h: 49, ox: 13, oz: 5 } },
  { x: 56, z: 183, w: 27, d: 19, h: 62, rot: 0.42, style: 0 },
  { x: -93, z: 171, w: 25, d: 20, h: 57, rot: -0.36, style: 1, wing: { w: 11, d: 12, h: 42, ox: -11, oz: 5 } },
  { x: -194, z: 45, w: 30, d: 18, h: 72, rot: 0.10, style: 2, crown: true },
  { x: -199, z: -80, w: 24, d: 18, h: 55, rot: -0.18, style: 3 },
  { x: -34, z: -226, w: 27, d: 18, h: 70, rot: 0.02, style: 0 },
  { x: 84, z: -238, w: 26, d: 18, h: 61, rot: -0.10, style: 1 },
  { x: -264, z: 178, w: 29, d: 18, h: 66, rot: 0.30, style: 2 },
  { x: 258, z: 188, w: 25, d: 19, h: 73, rot: -0.25, style: 3, crown: true },
  { x: 258, z: -183, w: 28, d: 18, h: 67, rot: 0.20, style: 0 },
  { x: -78, z: 278, w: 26, d: 18, h: 58, rot: 0.10, style: 1 },
  { x: 226, z: 280, w: 24, d: 17, h: 54, rot: 0.34, style: 2 },
  { x: -288, z: -168, w: 24, d: 17, h: 60, rot: -0.12, style: 3 },
]

const TOWER_MATS = [
  { tex: 0, color: '#e7ddcd' },
  { tex: 1, color: '#dcd5c7' },
  { tex: 2, color: '#cfcdc4' },
  { tex: 3, color: '#e3dbcd' },
]

/* ------------------------------------------------------------------ */
/*  dense township fabric                                              */
/* ------------------------------------------------------------------ */
/*  The opening needs to read as a built-up Noida township, not a      */
/*  handful of towers in a park. These extra blocks are merged into a  */
/*  few draw calls so the density costs almost nothing at runtime.     */
type DenseDef = {
  x: number
  z: number
  w: number
  d: number
  h: number
  rot: number
  style: number
  crown: boolean
  wing?: { w: number; d: number; h: number; ox: number; oz: number }
}

const DENSE_TOWERS: DenseDef[] = (() => {
  const rnd = mulberry32(60317)
  const out: DenseDef[] = []
  const occupied = TOWERS.map((t) => ({
    x: t.x,
    z: t.z,
    r: Math.max(t.w, t.d) * 0.5 + 11,
  }))
  const roadAngles = [18, 108, 198, 288].map((d) => (d * Math.PI) / 180)
  const courts: [number, number][] = [
    [-165, -180],
    [172, 180],
    [-232, 125],
  ]
  const rings = [150, 190, 228, 264, 308, 334]
  for (const ring of rings) {
    const count = Math.max(10, Math.floor((Math.PI * 2 * ring) / 39))
    for (let i = 0; i < count; i++) {
      if (out.length >= 56) return out
      const a = (i / count) * Math.PI * 2 + ring * 0.017
      const x = Math.cos(a) * ring
      const z = Math.sin(a) * ring
      // keep the four approach roads and the parking courts clear
      if (roadAngles.some((ra) => Math.abs(x * Math.sin(ra) - z * Math.cos(ra)) < 19)) continue
      if (courts.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 55)) continue
      const w = 17 + rnd() * 13
      const d = 14 + rnd() * 9
      const clearance = Math.max(w, d) * 0.5 + 7
      if (occupied.some((o) => Math.hypot(x - o.x, z - o.z) < clearance + o.r)) continue
      if (rnd() < 0.2) continue
      const inner = ring < 280
      const h = (inner ? 34 : 26) + Math.round(rnd() * (inner ? 48 : 28))
      const wing =
        rnd() < 0.3 && inner
          ? {
              w: 9 + rnd() * 4,
              d: 9 + rnd() * 4,
              h: h * (0.55 + rnd() * 0.2),
              ox: (rnd() < 0.5 ? -1 : 1) * (w * 0.5 + 3),
              oz: (rnd() - 0.5) * 6,
            }
          : undefined
      out.push({
        x,
        z,
        w,
        d,
        h,
        rot: -a + Math.PI / 2 + (rnd() - 0.5) * 0.28,
        style: Math.floor(rnd() * 4),
        crown: rnd() < 0.22,
        wing,
      })
      occupied.push({ x, z, r: clearance })
    }
  }
  return out
})()

function scaleBoxFaces(g: THREE.BoxGeometry, w: number, d: number, floors: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute
  const ux = Math.max(1, Math.round(w / 15))
  const uz = Math.max(1, Math.round(d / 15))
  const vy = Math.max(1, Math.round(floors / 2))
  for (let i = 0; i < uv.count; i++) {
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 vertices each)
    const face = Math.floor(i / 4)
    const ru = face < 2 ? uz : ux
    uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * vy)
  }
  uv.needsUpdate = true
}

function DenseTownship({
  textures,
  shadowTex,
}: {
  textures: THREE.Texture[]
  shadowTex: THREE.Texture
}) {
  const shadowRef = useRef<THREE.InstancedMesh>(null)

  const built = useMemo(() => {
    const shells: THREE.BufferGeometry[][] = [[], [], [], []]
    const podiums: THREE.BufferGeometry[] = []
    const balconies: THREE.BufferGeometry[] = []
    const rails: THREE.BufferGeometry[] = []
    const roofs: THREE.BufferGeometry[] = []

    const place = (g: THREE.BufferGeometry, def: DenseDef) => {
      g.rotateY(def.rot)
      g.translate(def.x, 0, def.z)
      return g
    }

    DENSE_TOWERS.forEach((def) => {
      const floors = Math.max(8, Math.round(def.h / 3.15))

      const shell = new THREE.BoxGeometry(def.w, def.h, def.d)
      scaleBoxFaces(shell, def.w, def.d, floors)
      shell.translate(0, 4.2 + def.h / 2, 0)
      place(shell, def)
      shells[def.style].push(shell.toNonIndexed())
      shell.dispose()

      if (def.wing) {
        const wg = new THREE.BoxGeometry(def.wing.w, def.wing.h, def.wing.d)
        scaleBoxFaces(wg, def.wing.w, def.wing.d, Math.max(6, Math.round(def.wing.h / 3.15)))
        wg.translate(def.wing.ox, 4.2 + def.wing.h / 2, def.wing.oz)
        place(wg, def)
        shells[def.style].push(wg.toNonIndexed())
        wg.dispose()
      }

      const podium = new THREE.BoxGeometry(def.w + 9, 4.2, def.d + 9)
      podium.translate(0, 2.1, 0)
      place(podium, def)
      podiums.push(podium.toNonIndexed())
      podium.dispose()

      const front = def.d / 2 + 0.7
      for (let i = 2; i < floors; i++) {
        const y = 4.2 + i * 3.15
        const bw = def.w * (i % 4 === 0 ? 0.78 : 0.6)
        const slab = new THREE.BoxGeometry(bw, 0.16, 1.35)
        slab.translate(0, y, front + 0.6)
        place(slab, def)
        balconies.push(slab.toNonIndexed())
        slab.dispose()

        const rail = new THREE.BoxGeometry(bw, 0.86, 0.04)
        rail.translate(0, y + 0.53, front + 1.32)
        place(rail, def)
        rails.push(rail.toNonIndexed())
        rail.dispose()
      }

      const parapet = new THREE.BoxGeometry(def.w + 0.8, 0.55, def.d + 0.8)
      parapet.translate(0, 4.2 + def.h + 0.35, 0)
      place(parapet, def)
      roofs.push(parapet.toNonIndexed())
      parapet.dispose()

      const bulkhead = new THREE.BoxGeometry(def.w * 0.3, 2.3, def.d * 0.32)
      bulkhead.translate(def.w * 0.16, 4.2 + def.h + 1.18, -def.d * 0.1)
      place(bulkhead, def)
      roofs.push(bulkhead.toNonIndexed())
      bulkhead.dispose()

      if (def.crown) {
        const crown = new THREE.BoxGeometry(def.w * 0.5, 2.4, def.d * 0.54)
        crown.translate(0, 4.2 + def.h + 1.55, 0)
        place(crown, def)
        roofs.push(crown.toNonIndexed())
        crown.dispose()
      }
    })

    const merge = (parts: THREE.BufferGeometry[]) =>
      parts.length ? mergeGeometries(parts, false)! : null

    return {
      shells: shells.map((s) => merge(s)),
      podiums: merge(podiums),
      balconies: merge(balconies),
      rails: merge(rails),
      roofs: merge(roofs),
    }
  }, [])

  const shellMats = useMemo(
    () =>
      textures.map((base, i) => {
        const map = base.clone()
        map.wrapS = map.wrapT = THREE.RepeatWrapping
        map.repeat.set(1, 1)
        map.anisotropy = 16
        map.needsUpdate = true
        return new THREE.MeshStandardMaterial({
          map,
          color: TOWER_MATS[i % TOWER_MATS.length].color,
          roughness: 0.84,
          metalness: 0.02,
        })
      }),
    [textures]
  )

  useLayoutEffect(() => {
    if (!shadowRef.current) return
    const dummy = new THREE.Object3D()
    DENSE_TOWERS.forEach((def, i) => {
      dummy.position.set(def.x, 0.11, def.z)
      dummy.rotation.set(-Math.PI / 2, 0, -def.rot)
      dummy.scale.set(def.w * 1.7, def.d * 1.9, 1)
      dummy.updateMatrix()
      shadowRef.current!.setMatrixAt(i, dummy.matrix)
    })
    shadowRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      {built.shells.map((geometry, i) =>
        geometry ? (
          <mesh key={i} geometry={geometry} material={shellMats[i]} castShadow receiveShadow />
        ) : null
      )}
      {built.podiums ? (
        <mesh geometry={built.podiums} castShadow receiveShadow>
          <meshStandardMaterial color="#ded3c1" roughness={0.92} />
        </mesh>
      ) : null}
      {built.balconies ? (
        <mesh geometry={built.balconies} castShadow receiveShadow>
          <meshStandardMaterial color="#d9cdba" roughness={0.9} />
        </mesh>
      ) : null}
      {built.rails ? (
        <mesh geometry={built.rails}>
          <meshStandardMaterial
            color="#a8b9b4"
            transparent
            opacity={0.32}
            roughness={0.15}
            metalness={0.3}
          />
        </mesh>
      ) : null}
      {built.roofs ? (
        <mesh geometry={built.roofs} castShadow>
          <meshStandardMaterial color="#b3a998" roughness={0.9} />
        </mesh>
      ) : null}
      <instancedMesh
        ref={shadowRef}
        args={[undefined, undefined, DENSE_TOWERS.length]}
      >
        <circleGeometry args={[1, 18]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

function treeTint(rnd: () => number) {
  // a few dry, olive trees keep the groves from reading as one green mass
  const dry = rnd() < 0.13
  return new THREE.Color().setHSL(
    dry ? 0.13 + rnd() * 0.035 : 0.2 + rnd() * 0.055,
    dry ? 0.24 + rnd() * 0.1 : 0.26 + rnd() * 0.13,
    dry ? 0.19 + rnd() * 0.06 : 0.1 + rnd() * 0.07
  )
}

function leafyTreeGeometry() {
  // seven off-centre lobes give a broad, irregular crown instead of a
  // recognisable low-poly sphere when the drone passes close to the canopy
  const lobes = [
    { x: 0, y: 1.0, z: 0, r: 1.02, sx: 1.06, sy: 0.95, sz: 1.04 },
    { x: 0.58, y: 0.8, z: 0.18, r: 0.72, sx: 1.0, sy: 0.9, sz: 1.02 },
    { x: -0.54, y: 0.84, z: -0.14, r: 0.68, sx: 0.96, sy: 0.94, sz: 1.0 },
    { x: 0.14, y: 1.24, z: -0.42, r: 0.6, sx: 0.94, sy: 0.92, sz: 0.96 },
    { x: -0.16, y: 0.66, z: 0.56, r: 0.62, sx: 1.02, sy: 0.88, sz: 0.94 },
    { x: 0.44, y: 1.12, z: 0.42, r: 0.5, sx: 0.9, sy: 0.94, sz: 1.0 },
    { x: -0.44, y: 1.08, z: 0.34, r: 0.48, sx: 0.92, sy: 0.9, sz: 1.04 },
  ]
  const parts: THREE.BufferGeometry[] = []
  lobes.forEach((lobe, li) => {
    const g = new THREE.IcosahedronGeometry(lobe.r, 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v)
      const y = pos.getY(v)
      const z = pos.getZ(v)
      const n =
        1 +
        0.16 * Math.sin(x * 4.7 + y * 3.6) +
        0.12 * Math.cos(z * 5.9 - y * 2.7) +
        0.08 * Math.sin((x + z) * 9.0) +
        0.05 * Math.cos((x - z) * 13.0)
      pos.setXYZ(v, x * n * lobe.sx, y * n * 0.92 * lobe.sy, z * n * lobe.sz)
    }
    g.translate(lobe.x, lobe.y, lobe.z)
    const colors = new Float32Array(pos.count * 3)
    for (let v = 0; v < pos.count; v++) {
      const yy = pos.getY(v)
      const off = 1.06 + (li % 2 === 0 ? 0.03 : -0.02)
      const light = Math.max(0.34, Math.min(1, (yy + 0.5) * 0.42 + 0.34)) * off
      colors[v * 3] = light * 0.92
      colors[v * 3 + 1] = light
      colors[v * 3 + 2] = light * 0.86
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    parts.push(g.toNonIndexed())
  })
  const merged = mergeGeometries(parts, false)!
  parts.forEach((g) => g.dispose())
  return merged
}

function shrubGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let v = 0; v < pos.count; v++) {
    const x = pos.getX(v)
    const y = pos.getY(v)
    const z = pos.getZ(v)
    const n =
      1 +
      0.2 * Math.sin(x * 6.1 + y * 3.7) +
      0.14 * Math.cos(z * 5.3 - y * 4.9) +
      0.08 * Math.sin((x + z) * 12.0)
    pos.setXYZ(v, x * n, y * n * 0.72, z * n)
  }
  g.translate(0, 0.62, 0)
  const colors = new Float32Array(pos.count * 3)
  for (let v = 0; v < pos.count; v++) {
    const light = Math.max(0.4, Math.min(1.06, pos.getY(v) * 0.62 + 0.4))
    colors[v * 3] = light * 0.92
    colors[v * 3 + 1] = light
    colors[v * 3 + 2] = light * 0.86
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g.toNonIndexed()
}

function TowerMass({
  def,
  texture,
  podiumTex,
  roofTex,
  shadowTex,
}: {
  def: TowerDef
  texture: THREE.Texture
  podiumTex: THREE.Texture
  roofTex: THREE.Texture
  shadowTex: THREE.Texture
}) {
  const floors = Math.max(8, Math.round(def.h / 3.15))
  const mats = useMemo(() => {
    const make = (base: THREE.Texture, rx: number, color: string) => {
      const map = base.clone()
      map.wrapS = map.wrapT = THREE.RepeatWrapping
      map.repeat.set(Math.max(1, rx), floors / 4)
      map.anisotropy = 16
      map.needsUpdate = true
      return new THREE.MeshStandardMaterial({
        map,
        color,
        roughness: 0.82,
        metalness: 0.02,
      })
    }
    const warm = TOWER_MATS[def.style % TOWER_MATS.length]
    const front = make(texture, Math.max(1, Math.round(def.w / 17)), warm.color)
    const side = make(texture, Math.max(1, Math.round(def.d / 17)), warm.color)
    const roof = new THREE.MeshStandardMaterial({ color: '#8c8578', roughness: 0.95 })
    const stone = new THREE.MeshStandardMaterial({ map: podiumTex, color: '#e9e0d1', roughness: 0.9 })
    const roofSlab = new THREE.MeshStandardMaterial({ color: '#a39a8a', roughness: 0.9 })
    return { front, side, roof, stone, roofSlab, roofTex }
  }, [def, floors, texture, podiumTex, roofTex])

  const balconySlabs = useMemo(() => {
    const out: { y: number; z: number; w: number; d: number }[] = []
    for (let i = 2; i < floors; i++) {
      out.push({ y: 4.2 + i * 3.15, z: def.d / 2 + 0.8, w: def.w * (i % 3 === 0 ? 0.82 : 0.62), d: 1.5 })
    }
    return out
  }, [def, floors])

  const finGeometry = useMemo(() => new THREE.BoxGeometry(0.38, def.h * 0.96, 0.75), [def.h])

  const balconyGeo = useMemo(() => {
    const parts = balconySlabs.map((b) => {
      const g = new THREE.BoxGeometry(b.w, 0.18, b.d)
      g.translate(0, b.y, b.z)
      return g.toNonIndexed()
    })
    const merged = mergeGeometries(parts, false)!
    parts.forEach((g) => g.dispose())
    return merged
  }, [balconySlabs])

  const railGeo = useMemo(() => {
    const parts = balconySlabs.map((b) => {
      const g = new THREE.BoxGeometry(b.w, 0.92, 0.04)
      g.translate(0, b.y + 0.55, b.z + b.d / 2 - 0.08)
      return g.toNonIndexed()
    })
    const merged = mergeGeometries(parts, false)!
    parts.forEach((g) => g.dispose())
    return merged
  }, [balconySlabs])

  const handrailGeo = useMemo(() => {
    const parts = balconySlabs.map((b) => {
      const g = new THREE.BoxGeometry(b.w, 0.04, 0.07)
      g.translate(0, b.y + 1.02, b.z + b.d / 2 - 0.08)
      return g.toNonIndexed()
    })
    const merged = mergeGeometries(parts, false)!
    parts.forEach((g) => g.dispose())
    return merged
  }, [balconySlabs])

  return (
    <group position={[def.x, 0, def.z]} rotation={[0, def.rot, 0]}>
      {/* soft contact shadow grounding the podium */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]} scale={[def.w * 2.15, def.d * 2.6, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* podium */}
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow material={mats.stone}>
        <boxGeometry args={[def.w + 13, 4.2, def.d + 12]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[def.w + 18, 0.9, def.d + 17]} />
        <meshStandardMaterial color="#b9b09f" roughness={0.98} />
      </mesh>
      <mesh position={[0, 3.0, def.d / 2 + 6.2]} material={mats.roofSlab}>
        <boxGeometry args={[def.w * 0.5, 0.28, 2.6]} />
      </mesh>

      {/* main slab */}
      <mesh position={[0, 4.2 + def.h / 2, 0]} castShadow receiveShadow material={[mats.side, mats.side, mats.roof, mats.roof, mats.front, mats.front]}>
        <boxGeometry args={[def.w, def.h, def.d]} />
      </mesh>

      {/* wing, set slightly back */}
      {def.wing ? (
        <mesh
          position={[def.wing.ox, 4.2 + def.wing.h / 2, def.wing.oz]}
          castShadow
          receiveShadow
          material={[mats.side, mats.side, mats.roof, mats.roof, mats.front, mats.front]}
        >
          <boxGeometry args={[def.wing.w, def.wing.h, def.wing.d]} />
        </mesh>
      ) : null}

      {/* stone piers at the corners — outer face 0.05 proud, never flush */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (def.w / 2 - 0.65), 4.2 + def.h / 2, 0]} material={mats.stone}>
          <boxGeometry args={[1.4, def.h + 0.5, def.d + 0.35]} />
        </mesh>
      ))}

      {/* balcony slabs and glass balustrades */}
      <mesh geometry={balconyGeo} castShadow={false} receiveShadow>
        <meshStandardMaterial color="#d8cdbc" roughness={0.9} />
      </mesh>
      <mesh geometry={railGeo}>
        <meshStandardMaterial color="#9fb4b3" transparent opacity={0.3} roughness={0.12} metalness={0.35} />
      </mesh>
      <mesh geometry={handrailGeo}>
        <meshStandardMaterial color="#b1a28b" metalness={0.55} roughness={0.35} />
      </mesh>

      {/* vertical fins between bays */}
      {[-0.36, -0.12, 0.12, 0.36].map((f, i) => (
        <mesh key={i} position={[def.w * f, 4.2 + def.h / 2, def.d / 2 + 0.22]} geometry={finGeometry}>
          <meshStandardMaterial color="#d4c8b5" roughness={0.7} />
        </mesh>
      ))}

      {/* roof edge + parapet */}
      <mesh position={[0, 4.2 + def.h + 0.3, 0]} castShadow>
        <boxGeometry args={[def.w + 0.9, 0.5, def.d + 0.9]} />
        <meshStandardMaterial color="#b8af9f" roughness={0.85} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={`p-${sx}`} position={[sx * (def.w / 2 + 0.1), 4.2 + def.h + 0.7, 0]}>
          <boxGeometry args={[0.22, 0.7, def.d + 0.9]} />
          <meshStandardMaterial color="#cfc5b4" roughness={0.9} />
        </mesh>
      ))}
      {def.crown ? (
        <group>
          <mesh position={[0, 4.2 + def.h + 1.6, 0]} castShadow>
            <boxGeometry args={[def.w * 0.46, 2.8, def.d * 0.56]} />
            <meshStandardMaterial color="#ded5c4" roughness={0.85} />
          </mesh>
          <mesh position={[0, 4.2 + def.h + 3.05, 0]}>
            <boxGeometry args={[def.w * 0.5, 0.28, def.d * 0.62]} />
            <meshStandardMaterial color="#a79c8b" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <group position={[def.w * 0.18, 4.2 + def.h + 1.2, -def.d * 0.12]}>
          <mesh>
            <boxGeometry args={[def.w * 0.34, 2.2, def.d * 0.42]} />
            <meshStandardMaterial color="#ded5c5" roughness={0.88} />
          </mesh>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[def.w * 0.18, 0.4, def.d * 0.18]} />
            <meshStandardMaterial color="#a8a093" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* entrance portal and canopy */}
      <mesh position={[0, 2.05, (def.d + 12) / 2 + 0.03]} material={mats.roof}>
        <boxGeometry args={[def.w * 0.34, 3.9, 0.16]} />
      </mesh>
      <mesh position={[0, 2.0, (def.d + 12) / 2 + 0.15]}>
        <boxGeometry args={[def.w * 0.27, 3.2, 0.08]} />
        <meshStandardMaterial color="#2f3835" roughness={0.25} metalness={0.35} />
      </mesh>
      <mesh position={[0, 4.35, (def.d + 12) / 2 + 1.35]} castShadow>
        <boxGeometry args={[def.w * 0.4, 0.22, 3.1]} />
        <meshStandardMaterial color="#c7bba7" roughness={0.82} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={`col-${sx}`} position={[sx * def.w * 0.17, 3.15, (def.d + 12) / 2 + 2.7]}>
          <cylinderGeometry args={[0.12, 0.14, 2.3, 8]} />
          <meshStandardMaterial color="#b3a691" roughness={0.6} metalness={0.35} />
        </mesh>
      ))}

      {/* rooftop plant, water tanks and stair bulkhead */}
      <mesh position={[def.w * 0.23, 4.2 + def.h + 1.05, -def.d * 0.18]} castShadow>
        <boxGeometry args={[def.w * 0.2, 2.1, def.d * 0.24]} />
        <meshStandardMaterial color="#b9b1a2" roughness={0.9} />
      </mesh>
      <mesh position={[-def.w * 0.27, 4.2 + def.h + 0.95, def.d * 0.16]} castShadow>
        <cylinderGeometry args={[1.35, 1.35, 1.9, 10]} />
        <meshStandardMaterial color="#ded8ca" roughness={0.78} metalness={0.12} />
      </mesh>
      <mesh position={[-def.w * 0.27, 4.2 + def.h + 1.94, def.d * 0.16]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 6]} />
        <meshStandardMaterial color="#8d8578" roughness={0.7} />
      </mesh>
      <mesh position={[def.w * 0.37, 4.2 + def.h + 1.8, -def.d * 0.22]}>
        <cylinderGeometry args={[0.05, 0.08, 4.2, 5]} />
        <meshStandardMaterial color="#8f887b" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

export function Community({
  showTower = false,
  towerScale = 1.35,
}: {
  showTower?: boolean
  towerScale?: number
}) {
  const groundTex = useMemo(() => makeGroundTexture(), [])
  const grassTex = useMemo(() => makeGrassTexture(), [])
  const asphaltTex = useMemo(() => makeAsphaltTexture(), [])
  const shadowTex = useMemo(() => makeContactShadowTexture(), [])
  const treeGeo = useMemo(() => leafyTreeGeometry(), [])
  const treeBump = useMemo(() => makeFoliageBump(), [])
  const shrubGeo = useMemo(() => shrubGeometry(), [])
  const lampGeo = useMemo(() => {
    const pole = new THREE.CylinderGeometry(0.055, 0.08, 5.2, 6)
    pole.translate(0, 2.6, 0)
    const arm = new THREE.BoxGeometry(1.15, 0.07, 0.07)
    arm.translate(0.55, 5.12, 0)
    const head = new THREE.BoxGeometry(0.44, 0.18, 0.26)
    head.translate(1.06, 5.0, 0)
    return mergeParts([pole.toNonIndexed(), arm.toNonIndexed(), head.toNonIndexed()])
  }, [])
  const facadeTex = useTexture([
    '/images/facade_warm.jpg',
    '/images/facade_stone.jpg',
    '/images/facade_grey.jpg',
    '/images/facade_white.jpg',
  ]) as THREE.Texture[]
  const podiumTex = useTexture('/images/facade_white.jpg') as THREE.Texture
  const contextTex = useTexture('/images/facade_context.jpg') as THREE.Texture

  const treeRef = useRef<THREE.InstancedMesh>(null)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const shrubRef = useRef<THREE.InstancedMesh>(null)
  const contextRef = useRef<THREE.InstancedMesh>(null)
  const carBodyRef = useRef<THREE.InstancedMesh>(null)
  const carRoofRef = useRef<THREE.InstancedMesh>(null)
  const lampRef = useRef<THREE.InstancedMesh>(null)

  const data = useMemo(() => {
    const rnd = mulberry32(2026)

    // street trees, garden groves and planted edges
    const trees: { p: [number, number, number]; s: number; c: THREE.Color }[] = []
    const rows = [97, 130, 267, 302, 358, 386]
    rows.forEach((r, ri) => {
      const count = Math.floor((Math.PI * 2 * r) / 14)
      for (let i = 0; i < count; i++) {
        if (rnd() < 0.14) continue
        const a = (i / count) * Math.PI * 2 + ri * 0.08
        trees.push({
          p: [Math.cos(a) * r, 0, Math.sin(a) * r],
          s: 0.95 + rnd() * 0.65,
          c: treeTint(rnd),
        })
      }
    })
    // informal groves between the boulevards, like a mature gated township
    for (let c = 0; c < 17; c++) {
      const ca = rnd() * Math.PI * 2
      const cr = 138 + rnd() * 112
      const cx = Math.cos(ca) * cr
      const cz = Math.sin(ca) * cr
      const count = 7 + Math.floor(rnd() * 12)
      for (let i = 0; i < count; i++) {
        const a = rnd() * Math.PI * 2
        const r = Math.sqrt(rnd()) * (8 + rnd() * 22)
        trees.push({
          p: [cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r],
          s: 0.85 + rnd() * 0.9,
          c: treeTint(rnd),
        })
      }
    }
    // a few specimen trees framing the central garden
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.12
      const r = 57 + rnd() * 22
      trees.push({
        p: [Math.cos(a) * r, 0, Math.sin(a) * r],
        s: 1.05 + rnd() * 0.5,
        c: treeTint(rnd),
      })
    }

    // clipped hedges, shrub beds and understorey soften the edges of every
    // lawn and road — the layer that makes a township feel planted, not mown
    const shrubs: { p: [number, number, number]; s: number; c: THREE.Color }[] = []
    const shrubTint = (dark = 0) =>
      new THREE.Color().setHSL(
        0.23 + rnd() * 0.06,
        0.28 + rnd() * 0.16,
        0.055 + rnd() * 0.045 + dark
      )
    for (const r of [102.4, 123.6]) {
      const count = Math.floor((Math.PI * 2 * r) / 2.15)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
        shrubs.push({
          p: [Math.cos(a) * (r + (rnd() - 0.5) * 0.5), 0, Math.sin(a) * (r + (rnd() - 0.5) * 0.5)],
          s: 0.42 + rnd() * 0.14,
          c: shrubTint(),
        })
      }
    }
    // a low flowering hedge around the central garden
    for (const r of [87.4, 90.4]) {
      const count = Math.floor((Math.PI * 2 * r) / 2.6)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.04
        shrubs.push({
          p: [Math.cos(a) * r, 0, Math.sin(a) * r],
          s: 0.5 + rnd() * 0.16,
          c: shrubTint(0.012),
        })
      }
    }
    // soft planting skirts around every tower base
    TOWERS.forEach((def) => {
      const rad = Math.max(def.w, def.d) * 0.5 + 3.6
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + def.rot
        const d = rad + rnd() * 1.8
        shrubs.push({
          p: [def.x + Math.cos(a) * d, 0, def.z + Math.sin(a) * d],
          s: 0.55 + rnd() * 0.25,
          c: shrubTint(),
        })
      }
    })
    // and a lighter skirt around the dense township blocks
    DENSE_TOWERS.forEach((def) => {
      const rad = Math.max(def.w, def.d) * 0.5 + 3.2
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + def.rot
        const d = rad + rnd() * 1.6
        shrubs.push({
          p: [def.x + Math.cos(a) * d, 0, def.z + Math.sin(a) * d],
          s: 0.45 + rnd() * 0.22,
          c: shrubTint(),
        })
      }
    })
    // loose understorey among the groves
    for (let c = 0; c < 28; c++) {
      const ca = rnd() * Math.PI * 2
      const cr = 135 + rnd() * 130
      const cx = Math.cos(ca) * cr
      const cz = Math.sin(ca) * cr
      for (let i = 0; i < 9; i++) {
        const a = rnd() * Math.PI * 2
        const d = Math.sqrt(rnd()) * 12
        shrubs.push({
          p: [cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d],
          s: 0.65 + rnd() * 0.5,
          c: shrubTint(),
        })
      }
    }

    // lamps along the two boulevards, on the sidewalk not the asphalt
    const lamps: { p: [number, number, number] }[] = []
    for (const r of [126, 300]) {
      const count = Math.floor((Math.PI * 2 * r) / 34)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (r > 200 ? 0.05 : 0)
        lamps.push({ p: [Math.cos(a) * r, 0, Math.sin(a) * r] })
      }
    }

    // cars: some moving on the ring roads, the rest inside the parking courts
    const cars: { p: [number, number, number]; rot: number; c: THREE.Color }[] = []
    const carCols = ['#d8d2c6', '#2f3431', '#5d6763', '#a59c8c', '#3c4b53', '#6d2723', '#b8b3a7']
    for (const r of [111, 282]) {
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2
        const lane = r + (rnd() < 0.5 ? -3.6 : 3.6)
        cars.push({
          p: [Math.cos(a) * lane, 0, Math.sin(a) * lane],
          rot: -a,
          c: new THREE.Color(carCols[Math.floor(rnd() * carCols.length)]),
        })
      }
    }
    const courts: [number, number, number][] = [
      [-165, -180, 0.1],
      [172, 180, -0.1],
      [-232, 125, 0.3],
    ]
    courts.forEach(([cx, cz, rot]) => {
      for (let j = 0; j < 10; j++) {
        const lx = -27 + j * 5.4
        const lz = j % 2 === 0 ? -5.2 : 5.2
        const wx = cx + lx * Math.cos(rot) + lz * Math.sin(rot)
        const wz = cz - lx * Math.sin(rot) + lz * Math.cos(rot)
        cars.push({
          p: [wx, 0, wz],
          rot: rot + Math.PI / 2,
          c: new THREE.Color(carCols[Math.floor(rnd() * carCols.length)]),
        })
      }
    })

    // a belt of trees outside the wall, then groves out in the plain
    for (let i = 0; i < 190; i++) {
      const a = rnd() * Math.PI * 2
      const r = 402 + Math.sqrt(rnd()) * 560
      trees.push({
        p: [Math.cos(a) * r, 0, Math.sin(a) * r],
        s: 0.75 + rnd() * 1.05,
        c: treeTint(rnd),
      })
    }
    // mango orchards and poplar rows in the farmland beyond the boundary
    for (const [ox, oz, rot] of [
      [-585, -240, 0.18],
      [545, 335, -0.24],
      [-360, 615, 0.1],
    ] as [number, number, number][]) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 9; c++) {
          const lx = -64 + c * 16 + (r % 2) * 2
          const lz = -48 + r * 16
          trees.push({
            p: [
              ox + lx * Math.cos(rot) + lz * Math.sin(rot),
              0,
              oz - lx * Math.sin(rot) + lz * Math.cos(rot),
            ],
            s: 0.62 + rnd() * 0.3,
            c: treeTint(rnd),
          })
        }
      }
    }

    // low-density Noida context: clustered neighbourhoods, not floating boxes
    const context: { p: [number, number, number]; s: [number, number, number]; c: THREE.Color }[] = []
    for (let c = 0; c < 12; c++) {
      const ca = (c / 12) * Math.PI * 2 + 0.25
      const cr = 500 + rnd() * 520
      const cx = Math.cos(ca) * cr
      const cz = Math.sin(ca) * cr
      const count = 10 + Math.floor(rnd() * 12)
      for (let i = 0; i < count; i++) {
        const h = 9 + rnd() * 42 + (rnd() < 0.12 ? 25 : 0)
        context.push({
          p: [cx + (rnd() - 0.5) * 150, h / 2, cz + (rnd() - 0.5) * 150],
          s: [10 + rnd() * 24, h, 10 + rnd() * 24],
          c: new THREE.Color().setHSL(0.09, 0.04 + rnd() * 0.07, 0.38 + rnd() * 0.14),
        })
      }
    }

    return { trees, shrubs, lamps, cars, context }
  }, [])

  const dashGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    for (const r of [113, 284]) {
      const count = Math.floor((Math.PI * 2 * r) / 11)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
        const g = new THREE.BoxGeometry(0.17, 0.02, 4.4)
        g.rotateY(-a)
        g.translate(Math.cos(a) * r, 0, Math.sin(a) * r)
        parts.push(g.toNonIndexed())
      }
    }
    for (const deg of [18, 108, 198, 288]) {
      const a = (deg * Math.PI) / 180
      for (let d = -208; d <= 208; d += 12) {
        const rr = 298 + d
        const g = new THREE.BoxGeometry(0.17, 0.02, 4.2)
        g.rotateY(Math.PI / 2 - a)
        g.translate(Math.cos(a) * rr, 0, Math.sin(a) * rr)
        parts.push(g.toNonIndexed())
      }
    }
    return mergeParts(parts)
  }, [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    treeGeo.computeVertexNormals()

    if (treeRef.current) {
      data.trees.forEach((t, i) => {
        dummy.position.set(t.p[0], 1.2 + 1.78 * t.s, t.p[2])
        dummy.rotation.set(0, (i * 1.71) % (Math.PI * 2), 0)
        dummy.scale.set(t.s * 2.35, t.s * 2.05, t.s * 2.35)
        dummy.updateMatrix()
        treeRef.current!.setMatrixAt(i, dummy.matrix)
        treeRef.current!.setColorAt(i, t.c)
      })
      treeRef.current.instanceMatrix.needsUpdate = true
      if (treeRef.current.instanceColor) treeRef.current.instanceColor.needsUpdate = true
    }
    if (trunkRef.current) {
      data.trees.forEach((t, i) => {
        dummy.position.set(t.p[0], 1.55 * t.s, t.p[2])
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(t.s, t.s, t.s)
        dummy.updateMatrix()
        trunkRef.current!.setMatrixAt(i, dummy.matrix)
      })
      trunkRef.current.instanceMatrix.needsUpdate = true
    }
    if (shrubRef.current) {
      data.shrubs.forEach((s, i) => {
        dummy.position.set(s.p[0], 0, s.p[2])
        dummy.rotation.set(0, (i * 2.39) % (Math.PI * 2), 0)
        dummy.scale.set(s.s, s.s * (0.85 + (i % 5) * 0.06), s.s)
        dummy.updateMatrix()
        shrubRef.current!.setMatrixAt(i, dummy.matrix)
        shrubRef.current!.setColorAt(i, s.c)
      })
      shrubRef.current.instanceMatrix.needsUpdate = true
      if (shrubRef.current.instanceColor) shrubRef.current.instanceColor.needsUpdate = true
    }
    if (lampRef.current) {
      data.lamps.forEach((l, i) => {
        dummy.position.set(l.p[0], 0, l.p[2])
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        lampRef.current!.setMatrixAt(i, dummy.matrix)
      })
      lampRef.current.instanceMatrix.needsUpdate = true
    }
    if (carBodyRef.current && carRoofRef.current) {
      data.cars.forEach((c, i) => {
        dummy.position.set(c.p[0], 0.68, c.p[2])
        dummy.rotation.set(0, c.rot, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        carBodyRef.current!.setMatrixAt(i, dummy.matrix)
        carBodyRef.current!.setColorAt(i, c.c)
        dummy.position.y = 1.27
        dummy.scale.set(0.9, 0.85, 0.86)
        dummy.updateMatrix()
        carRoofRef.current!.setMatrixAt(i, dummy.matrix)
        carRoofRef.current!.setColorAt(i, color.copy(c.c).multiplyScalar(0.82))
      })
      carBodyRef.current.instanceMatrix.needsUpdate = true
      carRoofRef.current.instanceMatrix.needsUpdate = true
      if (carBodyRef.current.instanceColor) carBodyRef.current.instanceColor.needsUpdate = true
      if (carRoofRef.current.instanceColor) carRoofRef.current.instanceColor.needsUpdate = true
    }
    if (contextRef.current) {
      data.context.forEach((b, i) => {
        dummy.position.set(b.p[0], b.p[1], b.p[2])
        dummy.rotation.set(0, (i % 7) * 0.37, 0)
        dummy.scale.set(b.s[0], b.s[1], b.s[2])
        dummy.updateMatrix()
        contextRef.current!.setMatrixAt(i, dummy.matrix)
        contextRef.current!.setColorAt(i, b.c)
      })
      contextRef.current.instanceMatrix.needsUpdate = true
      if (contextRef.current.instanceColor) contextRef.current.instanceColor.needsUpdate = true
    }
  }, [data, treeGeo])

  return (
    <group>
      {/* city ground — lowest band, everything else sits well above it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <circleGeometry args={[1250, 128]} />
        <meshStandardMaterial map={groundTex} color="#d3d0b9" roughness={1} />
      </mesh>

      {/* township lawns */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <circleGeometry args={[350, 128]} />
        <meshStandardMaterial map={grassTex} bumpMap={grassTex} bumpScale={0.35} color="#c9cdb9" roughness={1} />
      </mesh>

      {/* green buffer outside the boundary wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <ringGeometry args={[351, 470, 160]} />
        <meshStandardMaterial map={grassTex} bumpMap={grassTex} bumpScale={0.3} color="#b5b7a0" roughness={1} />
      </mesh>

      {/* fields and farmland stitching the township into the Noida plain */}
      {[
        [-620, -420, 440, 250, 0.15],
        [600, -470, 400, 250, -0.22],
        [770, 230, 480, 330, 0.38],
        [-680, 330, 430, 280, -0.1],
        [40, -760, 560, 250, 0.08],
        [-260, 660, 500, 290, 0.26],
        [960, -70, 360, 320, -0.35],
        [-930, -90, 380, 300, 0.2],
        [180, 850, 480, 260, -0.18],
        [-820, 720, 420, 300, 0.32],
      ].map(([x, z, w, d, rot], i) => {
        const fw = w as number
        const fd = d as number
        const soil = ['#6d7549', '#837a50', '#5c6a44', '#8a7d55', '#707a4d', '#7c744c'][i % 6]
        return (
          <group key={`field-${i}`} position={[x, 0.0, z]} rotation-y={rot as number}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[fw, fd]} />
              <meshStandardMaterial color={soil} roughness={1} />
            </mesh>
            {/* field bunds and hedgerows give the plain its patchwork grain */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[0, 0.55, side * (fd / 2 - 1.4)]} castShadow>
                <boxGeometry args={[fw - 4, 1.1, 2.2]} />
                <meshStandardMaterial color="#4b563a" roughness={1} />
              </mesh>
            ))}
            {i % 2 === 0 && (
              <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1.6, 1.0, fd - 6]} />
                <meshStandardMaterial color="#505b3c" roughness={1} />
              </mesh>
            )}
            {/* crop rows across a few fields */}
            {i % 3 === 0 &&
              Array.from({ length: 7 }).map((_, r) => (
                <mesh key={r} position={[0, 0.03, -fd / 2 + 6 + r * ((fd - 12) / 6)]}>
                  <boxGeometry args={[fw - 10, 0.05, 0.8]} />
                  <meshStandardMaterial color="#565f3b" roughness={1} />
                </mesh>
              ))}
          </group>
        )
      })}

      {/* outer arterial roads and a ring road beyond the gate */}
      {[20, 110, 200, 290, 65, 155].map((deg) => {
        const a = (deg * Math.PI) / 180
        return (
          <mesh
            key={`outer-${deg}`}
            position={[Math.cos(a) * 830, 0.04, Math.sin(a) * 830]}
            rotation={[0, Math.PI / 2 - a, 0]}
            receiveShadow
          >
            <boxGeometry args={[17, 0.02, 1000]} />
            <meshStandardMaterial map={asphaltTex} color="#b9b7ae" roughness={0.98} />
          </mesh>
        )
      })}
      {[610, 890].map((r) => (
        <mesh key={`outer-ring-${r}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} receiveShadow>
          <ringGeometry args={[r - 8, r + 8, 200]} />
          <meshStandardMaterial map={asphaltTex} color="#b3b1a8" roughness={0.98} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} receiveShadow>
        <circleGeometry args={[92, 96]} />
        <meshStandardMaterial map={grassTex} bumpMap={grassTex} bumpScale={0.35} color="#d3d5c0" roughness={1} />
      </mesh>

      {/* central garden paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <ringGeometry args={[61, 65, 128]} />
        <meshStandardMaterial color="#cec2ac" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.17, 0]}>
        <ringGeometry args={[85, 89, 128]} />
        <meshStandardMaterial color="#cec2ac" roughness={0.92} />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180
        return (
          <mesh
            key={`walk-${deg}`}
            position={[Math.cos(a) * 82, 0.18, Math.sin(a) * 82]}
            rotation={[0, Math.PI / 2 - a, 0]}
            receiveShadow
          >
            <boxGeometry args={[3.4, 0.03, 34]} />
            <meshStandardMaterial color="#d0c4ae" roughness={0.92} />
          </mesh>
        )
      })}
      {/* clipped hedge rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[66.5, 68.6, 128]} />
        <meshStandardMaterial color="#3c4a31" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[83.2, 85, 128]} />
        <meshStandardMaterial color="#3c4a31" roughness={1} />
      </mesh>

      {/* internal boulevards with sidewalks, curbs and lane markings */}
      {[113, 284].map((r) => (
        <group key={r}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
            <ringGeometry args={[r - 11.4, r + 11.4, 180]} />
            <meshStandardMaterial color="#b1a794" roughness={0.95} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]} receiveShadow>
            <ringGeometry args={[r - 8.5, r + 8.5, 180]} />
            <meshStandardMaterial map={asphaltTex} color="#c9c7bf" roughness={0.98} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
            <ringGeometry args={[r - 9.7, r - 9.2, 180]} />
            <meshStandardMaterial color="#bdb2a0" roughness={0.94} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
            <ringGeometry args={[r + 9.2, r + 9.7, 180]} />
            <meshStandardMaterial color="#bdb2a0" roughness={0.94} />
          </mesh>
        </group>
      ))}

      {/* dashed lane markings on the rings and approach roads */}
      <mesh geometry={dashGeo} position={[0, 0.2, 0]}>
        <meshBasicMaterial color="#d9d0bd" transparent opacity={0.75} />
      </mesh>

      {/* approach roads break the rings into a real street network */}
      {[18, 108, 198, 288].map((deg) => {
        const a = (deg * Math.PI) / 180
        return (
          <group key={deg}>
            <mesh
              position={[Math.cos(a) * 298, 0.09, Math.sin(a) * 298]}
              rotation={[0, Math.PI / 2 - a, 0]}
              receiveShadow
            >
              <boxGeometry args={[24, 0.03, 452]} />
              <meshStandardMaterial color="#bfb5a4" roughness={0.94} />
            </mesh>
            <mesh
              position={[Math.cos(a) * 298, 0.13, Math.sin(a) * 298]}
              rotation={[0, Math.PI / 2 - a, 0]}
              receiveShadow
            >
              <boxGeometry args={[18, 0.025, 452]} />
              <meshStandardMaterial map={asphaltTex} color="#c9c7bf" roughness={0.98} />
            </mesh>
          </group>
        )
      })}

      {/* parking courts */}
      {[
        [-165, -180, 0.1],
        [172, 180, -0.1],
        [-232, 125, 0.3],
      ].map(([x, z, rot], i) => (
        <group key={i} position={[x, 0.08, z]} rotation={[0, rot, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[72, 36]} />
            <meshStandardMaterial map={asphaltTex} color="#b3b1a9" roughness={0.98} />
          </mesh>
          {Array.from({ length: 12 }).map((_, j) => (
            <mesh key={j} position={[-30 + j * 5.4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.14, 16]} />
              <meshBasicMaterial color="#d9cfb9" />
            </mesh>
          ))}
        </group>
      ))}

      {/* apartment towers */}
      {TOWERS.map((t) => (
        <TowerMass
          key={`${t.x}-${t.z}`}
          def={t}
          texture={facadeTex[t.style % facadeTex.length]}
          podiumTex={podiumTex}
          roofTex={contextTex}
          shadowTex={shadowTex}
        />
      ))}

      {/* the dense fabric of the township */}
      <DenseTownship textures={facadeTex} shadowTex={shadowTex} />

      {/* central hero tower */}
      {showTower ? <CompletedTower scale={towerScale} /> : null}

      {/* trees */}
      <instancedMesh ref={treeRef} args={[undefined, undefined, data.trees.length]} castShadow receiveShadow>
        <primitive object={treeGeo} attach="geometry" />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.98}
          vertexColors
          bumpMap={treeBump}
          bumpScale={0.6}
        />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, data.trees.length]}>
        <cylinderGeometry args={[0.18, 0.42, 3.2, 6]} />
        <meshStandardMaterial color="#54463a" roughness={0.98} />
      </instancedMesh>

      {/* hedges, shrub beds and planting skirts */}
      <instancedMesh ref={shrubRef} args={[undefined, undefined, data.shrubs.length]} castShadow receiveShadow>
        <primitive object={shrubGeo} attach="geometry" />
        <meshStandardMaterial color="#ffffff" roughness={1} vertexColors />
      </instancedMesh>

      {/* street lamps */}
      <instancedMesh ref={lampRef} args={[undefined, undefined, data.lamps.length]} castShadow>
        <primitive object={lampGeo} attach="geometry" />
        <meshStandardMaterial color="#6f6b61" roughness={0.55} metalness={0.5} />
      </instancedMesh>

      {/* cars */}
      <instancedMesh ref={carBodyRef} args={[undefined, undefined, data.cars.length]} castShadow>
        <boxGeometry args={[4.2, 1.05, 1.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={carRoofRef} args={[undefined, undefined, data.cars.length]}>
        <boxGeometry args={[2.2, 0.72, 1.62]} />
        <meshStandardMaterial color="#ffffff" roughness={0.28} metalness={0.25} />
      </instancedMesh>

      {/* Noida context */}
      <instancedMesh ref={contextRef} args={[undefined, undefined, data.context.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={contextTex} color="#ffffff" roughness={0.95} />
      </instancedMesh>

      {/* boundary wall / gate piers */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[350, 352.4, 160]} />
        <meshStandardMaterial color="#b6aa97" roughness={0.95} />
      </mesh>
      {[0, 90, 180, 270].map((deg) => {
        const a = (deg * Math.PI) / 180
        return (
          <mesh key={deg} position={[Math.cos(a) * 351, 1.5, Math.sin(a) * 351]} rotation={[0, -a, 0]}>
            <boxGeometry args={[3.4, 3, 3.4]} />
            <meshStandardMaterial color="#c1b5a2" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}


/* ------------------------------------------------------------------ */
/*  completed tower                                                    */
/* ------------------------------------------------------------------ */
function CompletedTower({ scale = 1.35 }: { scale?: number }) {
  const parts = useTowerParts()
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!group.current) return
    group.current.rotation.y = -0.32
  })
  return (
    <group ref={group} scale={scale}>
      <primitive object={parts.root} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  construction                                                       */
/* ------------------------------------------------------------------ */
function boxGeo(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rz = 0,
  rx = 0
) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.rotateZ(rz)
  g.rotateX(rx)
  g.translate(x, y, z)
  return g.toNonIndexed()
}

function mergeParts(parts: THREE.BufferGeometry[]) {
  const merged = mergeGeometries(parts, false)!
  parts.forEach((g) => g.dispose())
  return merged
}

function CraneCable({
  a,
  b,
  radius = 0.025,
}: {
  a: [number, number, number]
  b: [number, number, number]
  radius?: number
}) {
  const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const len = dir.length()
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[radius, radius, len, 5]} />
      <meshStandardMaterial color="#6e6658" roughness={0.55} metalness={0.55} />
    </mesh>
  )
}

function Crane({
  position,
  height,
  jib,
  phase,
  opacity,
}: {
  position: [number, number, number]
  height: number
  jib: number
  phase: number
  opacity: MotionValue<number>
}) {
  const group = useRef<THREE.Group>(null)
  const jibRef = useRef<THREE.Group>(null)
  const trolleyRef = useRef<THREE.Group>(null)
  const cableRef = useRef<THREE.Mesh>(null)
  const hookRef = useRef<THREE.Group>(null)
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null)

  const materials = useMemo(
    () => ({
      yellow: new THREE.MeshStandardMaterial({ color: '#d59b2e', roughness: 0.48, metalness: 0.42 }),
      dark: new THREE.MeshStandardMaterial({ color: '#7f6a3c', roughness: 0.62, metalness: 0.35 }),
      concrete: new THREE.MeshStandardMaterial({ color: '#a49a87', roughness: 0.96 }),
      glass: new THREE.MeshStandardMaterial({
        color: '#5c7075',
        roughness: 0.12,
        metalness: 0.45,
        transparent: true,
        opacity: 0.72,
      }),
      hook: new THREE.MeshStandardMaterial({ color: '#b7b0a2', roughness: 0.38, metalness: 0.7 }),
      red: new THREE.MeshStandardMaterial({ color: '#ff553b', emissive: '#ff2a17', emissiveIntensity: 3.2 }),
    }),
    []
  )

  const mastGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const seg = 2.55
    const half = 0.72
    const count = Math.ceil(height / seg)
    for (let i = 0; i < count; i++) {
      const y0 = 1 + i * seg
      const y1 = Math.min(height, y0 + seg)
      const h = y1 - y0
      const yc = (y0 + y1) / 2
      // corner posts
      for (const sx of [-half, half]) {
        for (const sz of [-half, half]) {
          parts.push(boxGeo(0.17, h, 0.17, sx, yc, sz))
        }
      }
      // horizontal frames
      for (const sz of [-half, half]) parts.push(boxGeo(half * 2, 0.09, 0.09, 0, y1, sz))
      for (const sx of [-half, half]) parts.push(boxGeo(0.09, 0.09, half * 2, sx, y1, 0))
      // diagonal bracing (two faces, alternating)
      const brace = Math.hypot(half * 2, h)
      const ang = Math.atan2(h, half * 2)
      for (const sz of [-half, half]) {
        parts.push(boxGeo(brace, 0.07, 0.07, 0, yc, sz, (i % 2 ? 1 : -1) * ang))
      }
      for (const sx of [-half, half]) {
        parts.push(boxGeo(0.07, 0.07, brace, sx, yc, 0, 0))
      }
    }
    // steel collar at the slew ring
    parts.push(boxGeo(3.1, 0.34, 3.1, 0, height + 0.4, 0))
    return mergeParts(parts)
  }, [height])

  const jibGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const chord = 0.16
    // bottom and top chords, triangular in section
    parts.push(boxGeo(jib, chord, chord, jib / 2, 0, 0))
    parts.push(boxGeo(jib, chord * 0.76, chord * 0.76, jib / 2, 0.96, 0))
    // side chords
    parts.push(boxGeo(jib, chord * 0.7, chord * 0.7, jib / 2, 0.48, 0.55))
    parts.push(boxGeo(jib, chord * 0.7, chord * 0.7, jib / 2, 0.48, -0.55))
    const bays = Math.floor(jib / 2.4)
    for (let i = 0; i <= bays; i++) {
      const x = (i / bays) * jib
      parts.push(boxGeo(0.07, 0.98, 0.07, x, 0.48, 0))
      if (i < bays) {
        const w = jib / bays
        const diag = Math.hypot(w, 0.92)
        const ang = Math.atan2(0.92, w)
        parts.push(boxGeo(diag, 0.06, 0.06, x + w / 2, 0.48, 0.55, ang))
        parts.push(boxGeo(diag, 0.06, 0.06, x + w / 2, 0.48, -0.55, -ang))
      }
    }
    // counter-jib 8m
    parts.push(boxGeo(8, 0.17, 0.17, -4, 0, 0))
    parts.push(boxGeo(8, 0.12, 0.12, -4, 0.78, 1.35))
    parts.push(boxGeo(8, 0.12, 0.12, -4, 0.78, -1.35))
    for (let i = 0; i < 4; i++) {
      parts.push(boxGeo(0.07, 0.8, 0.07, -1 - i * 2, 0.4, 1.35))
      parts.push(boxGeo(0.07, 0.8, 0.07, -1 - i * 2, 0.4, -1.35))
    }
    return mergeParts(parts)
  }, [jib])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const k = opacity.get()
    if (group.current) {
      group.current.visible = k > 0.01
      group.current.scale.y = 0.12 + k * 0.88
      group.current.position.y = position[1] - (1 - k) * 8
    }
    if (jibRef.current) {
      jibRef.current.rotation.y = Math.sin(t * 0.07 + phase) * 0.42 + phase * 0.18
    }
    if (trolleyRef.current) {
      trolleyRef.current.position.x = jib * (0.45 + 0.2 * Math.sin(t * 0.16 + phase))
    }
    const drop = height * 0.5 + Math.sin(t * 0.33 + phase) * 5
    if (cableRef.current) {
      cableRef.current.scale.y = Math.max(0.2, drop)
      cableRef.current.position.y = -drop / 2
    }
    if (hookRef.current) hookRef.current.position.y = -drop
    if (beaconRef.current) {
      beaconRef.current.emissiveIntensity = 1.2 + (Math.sin(t * 3 + phase * 2) > 0 ? 2.8 : 0)
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 0.55, 0]} material={materials.concrete} receiveShadow>
        <boxGeometry args={[6.4, 1.1, 6.4]} />
      </mesh>
      <mesh position={[0, 1.05, 0]} material={materials.dark}>
        <boxGeometry args={[4.8, 0.4, 4.8]} />
      </mesh>
      <mesh geometry={mastGeo} material={materials.yellow} castShadow />

      <group ref={jibRef} position={[0, height + 0.6, 0]}>
        <mesh geometry={jibGeo} material={materials.yellow} castShadow />
        {/* operator cab */}
        <group position={[2.6, -1.1, 1.3]}>
          <mesh material={materials.dark}>
            <boxGeometry args={[1.9, 1.7, 1.7]} />
          </mesh>
          <mesh position={[0.96, 0.1, 0]} material={materials.glass}>
            <boxGeometry args={[0.04, 0.92, 1.2]} />
          </mesh>
          <mesh position={[0, 0.1, 0.86]} material={materials.glass}>
            <boxGeometry args={[1.1, 0.92, 0.04]} />
          </mesh>
        </group>

        {/* counterweights */}
        {[-4.7, -5.6, -6.5].map((x, i) => (
          <mesh key={i} position={[x, -0.8, 0]} material={materials.dark}>
            <boxGeometry args={[0.72, 1.25, 1.85]} />
          </mesh>
        ))}

        {/* A-frame apex and pendant cables */}
        <group position={[0, 0.35, 0]}>
          <mesh position={[0, 2.2, 0]} rotation={[0, 0, 0]} material={materials.yellow}>
            <boxGeometry args={[0.22, 4.2, 0.22]} />
          </mesh>
          <mesh position={[0, 4.15, 0]} material={materials.dark}>
            <boxGeometry args={[0.9, 0.5, 0.9]} />
          </mesh>
          <mesh position={[0, 4.55, 0]} material={materials.red}>
            <sphereGeometry args={[0.16, 10, 8]} />
          </mesh>
          <CraneCable a={[0, 4.05, 0]} b={[jib * 0.94, 1.0, 0]} />
          <CraneCable a={[0, 4.05, 0]} b={[-7.4, 0.8, 0]} />
        </group>

        {/* trolley + hook block */}
        <group ref={trolleyRef} position={[jib * 0.52, 0.1, 0]}>
          <mesh material={materials.dark}>
            <boxGeometry args={[0.85, 0.3, 1.1]} />
          </mesh>
          <mesh ref={cableRef} position={[0, -1, 0]} material={materials.hook}>
            <cylinderGeometry args={[0.022, 0.022, 1, 5]} />
          </mesh>
          <group ref={hookRef} position={[0, -1, 0]}>
            <mesh material={materials.hook}>
              <boxGeometry args={[0.65, 0.6, 0.65]} />
            </mesh>
            <mesh position={[0, -0.46, 0]} material={materials.hook} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.28, 0.08, 8, 16, Math.PI * 1.4]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* mast-top beacon */}
      <mesh position={[0, height + 4.3, 0]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial ref={beaconRef} color="#ff553b" emissive="#ff2a17" emissiveIntensity={3.2} />
      </mesh>
    </group>
  )
}


function WorkerCrew({ progress }: { progress: MotionValue<number> }) {
  const body = useRef<THREE.InstancedMesh>(null)
  const head = useRef<THREE.InstancedMesh>(null)
  const rnd = useMemo(() => mulberry32(77), [])
  const crew = useMemo(
    () =>
      Array.from({ length: 26 }, () => ({
        a: rnd() * Math.PI * 2,
        r: 8 + rnd() * 30,
        speed: 0.1 + rnd() * 0.22,
        y: 0.9,
        phase: rnd() * Math.PI * 2,
      })),
    [rnd]
  )

  useFrame((state) => {
    const p = progress.get()
    const k =
      p < 0.44
        ? 0
        : p < 0.5
          ? (p - 0.44) / 0.06
          : p > 0.88
            ? Math.max(0, 1 - (p - 0.88) / 0.055)
            : 1
    if (!body.current || !head.current) return
    const dummy = new THREE.Object3D()
    crew.forEach((w, i) => {
      const t = state.clock.elapsedTime * w.speed + w.phase
      const r = w.r + Math.sin(t) * 4
      const x = Math.cos(w.a + t * 0.2) * r
      const z = Math.sin(w.a + t * 0.2) * r
      dummy.position.set(x, 1.0 * k, z)
      dummy.rotation.set(0, -t, 0)
      dummy.scale.setScalar(Math.max(0.001, k))
      dummy.updateMatrix()
      body.current!.setMatrixAt(i, dummy.matrix)
      dummy.position.y = 1.85 * k
      dummy.updateMatrix()
      head.current!.setMatrixAt(i, dummy.matrix)
    })
    body.current.instanceMatrix.needsUpdate = true
    head.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, crew.length]}>
        <capsuleGeometry args={[0.28, 0.7, 3, 8]} />
        <meshStandardMaterial color="#cf7d3d" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, crew.length]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color="#a97d54" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

function BrickPiles() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const bricks = useMemo(() => {
    const rnd = mulberry32(44)
    const out: { p: [number, number, number]; r: number }[] = []
    const piles = [
      [22, 0, 14],
      [-24, 0, -9],
      [18, 0, -22],
    ]
    piles.forEach(([px, , pz]) => {
      for (let layer = 0; layer < 10; layer++) {
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 3; j++) {
            out.push({
              p: [px + i * 0.42 + (layer % 2) * 0.2, 0.12 + layer * 0.22, pz + j * 0.28],
              r: rnd() * 0.1,
            })
          }
        }
      }
    })
    return out
  }, [])

  useFrame(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D()
    bricks.forEach((b, i) => {
      dummy.position.set(b.p[0], b.p[1], b.p[2])
      dummy.rotation.set(0, b.r, 0)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, bricks.length]}>
      <boxGeometry args={[0.38, 0.18, 0.24]} />
      <meshStandardMaterial color="#b96a43" roughness={0.95} />
    </instancedMesh>
  )
}

function SiteFence() {
  const posts = useMemo(() => {
    const out: { p: [number, number, number]; ry: number }[] = []
    const size = 34
    for (let i = -size; i <= size; i += 4) {
      out.push({ p: [i, 0, -size], ry: 0 })
      out.push({ p: [i, 0, size], ry: 0 })
      out.push({ p: [-size, 0, i], ry: Math.PI / 2 })
      out.push({ p: [size, 0, i], ry: Math.PI / 2 })
    }
    return out
  }, [])
  return (
    <group>
      {posts.map((post, i) => (
        <mesh key={i} position={[post.p[0], 1.15, post.p[2]]} rotation={[0, post.ry, 0]}>
          <boxGeometry args={[0.14, 2.3, 0.14]} />
          <meshStandardMaterial color="#8b9297" roughness={0.55} metalness={0.35} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, 1.12, s * 34]}>
            <boxGeometry args={[68, 2.16, 0.08]} />
            <meshStandardMaterial color="#68747a" roughness={0.82} />
          </mesh>
          <mesh position={[0, 2.13, s * 34]}>
            <boxGeometry args={[68.2, 0.16, 0.1]} />
            <meshStandardMaterial color="#d6d3c9" roughness={0.8} />
          </mesh>
          <mesh position={[s * 34, 1.12, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[68, 2.16, 0.08]} />
            <meshStandardMaterial color="#68747a" roughness={0.82} />
          </mesh>
          <mesh position={[s * 34, 2.13, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[68.2, 0.16, 0.1]} />
            <meshStandardMaterial color="#d6d3c9" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* site gate on the south face */}
      {[-1, 1].map((s) => (
        <mesh key={`gate-${s}`} position={[s * 19.5, 1.12, 34.06]}>
          <boxGeometry args={[29, 2.16, 0.05]} />
          <meshStandardMaterial color="#59676a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Excavator({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* tracks */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.38, s * 1.1]} castShadow>
          <boxGeometry args={[4.1, 0.62, 0.86]} />
          <meshStandardMaterial color="#3a3b38" roughness={0.85} />
        </mesh>
      ))}
      {/* chassis and rotating body */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[3.1, 0.42, 2.1]} />
        <meshStandardMaterial color="#6e6a5f" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[-0.35, 1.58, 0]} castShadow>
        <boxGeometry args={[2.4, 1.15, 1.9]} />
        <meshStandardMaterial color="#d29a2f" roughness={0.52} metalness={0.25} />
      </mesh>
      <mesh position={[0.55, 2.05, 0.38]}>
        <boxGeometry args={[1.05, 1.05, 1.2]} />
        <meshStandardMaterial color="#2f393a" roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh position={[0.55, 2.05, 0.99]}>
        <boxGeometry args={[0.85, 0.8, 0.04]} />
        <meshStandardMaterial color="#8aa3a5" roughness={0.12} metalness={0.4} />
      </mesh>
      {/* boom */}
      <mesh position={[1.75, 2.2, 0]} rotation={[0, 0, -0.62]} castShadow>
        <boxGeometry args={[3.6, 0.34, 0.36]} />
        <meshStandardMaterial color="#d29a2f" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[3.55, 2.5, 0]} rotation={[0, 0, 0.8]} castShadow>
        <boxGeometry args={[2.6, 0.28, 0.3]} />
        <meshStandardMaterial color="#c08a28" roughness={0.58} metalness={0.25} />
      </mesh>
      <mesh position={[4.4, 1.5, 0]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[1.1, 0.8, 1.0]} />
        <meshStandardMaterial color="#5c5b53" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

export function ConstructionSite({ progress }: { progress: MotionValue<number> }) {
  const parts = useTowerParts()
  const root = useRef<THREE.Group>(null)
  const site = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const columns = useRef<THREE.Group>(null)
  const smooth = useRef(0)
  const dirtTex = useMemo(() => makeDirtTexture(), [])
  const formTex = useMemo(() => makeFormworkTexture(), [])

  const craneOpacity = useMemo(() => {
    // simple motion-value-like wrapper for the crane; reads the same progress
    return {
      get: () => {
        const p = progress.get()
        if (p < 0.08) return THREE.MathUtils.clamp(p / 0.08, 0, 1)
        if (p < 0.85) return 1
        return Math.max(0, 1 - (p - 0.85) / 0.075)
      },
    } as unknown as MotionValue<number>
  }, [progress])

  useFrame((state, dt) => {
    const p = THREE.MathUtils.clamp(progress.get(), 0, 1)
    smooth.current = THREE.MathUtils.damp(smooth.current, p, 5.4, dt)
    const k = smooth.current
    const r = parts.root
    r.rotation.y = -0.32
    r.visible = k > 0.435
    r.scale.setScalar(1.48)

    if (k <= 0.435) return

    const podiumK = THREE.MathUtils.smoothstep(k, 0.435, 0.53)
    parts.podium.scale.y = 0.02 + 0.98 * podiumK
    parts.podium.position.y = -0.5 * (1 - podiumK)

    // one floor finishes before the next slab appears: the plate always rests
    // on a completed floor below, so no slab ever floats in mid-air
    parts.floors.forEach((floor, i) => {
      const start = 0.485 + i * 0.0205
      const fk = THREE.MathUtils.smoothstep(k, start, start + 0.0205)
      floor.visible = fk > 0.002
      floor.position.y = floor.userData.baseY
      floor.scale.set(1, 0.02 + 1.04 * fk, 1)
    })

    // slipform core and structural columns always lead the floor plates, so
    // the rising tower reads as a building under construction, not floating slabs
    const visibleFloors = THREE.MathUtils.clamp(
      Math.floor((k - 0.485) / 0.0205) + 1,
      0,
      15
    )
    const coreH = visibleFloors * 3.45 + 3.6
    if (core.current) {
      core.current.visible = k > 0.47 && k < 0.88
      core.current.scale.y = Math.max(0.01, coreH)
      core.current.position.y = Math.max(0.01, coreH) / 2
    }
    if (columns.current) {
      columns.current.visible = k > 0.47 && k < 0.88
      columns.current.scale.y = Math.max(0.01, coreH)
    }

    const crownK = THREE.MathUtils.smoothstep(k, 0.795, 0.855)
    parts.crown.visible = k > 0.795
    parts.crown.position.y = parts.crown.userData.baseY
    parts.crown.scale.set(0.9 + 0.1 * crownK, 0.82 + 0.18 * crownK, 0.9 + 0.1 * crownK)

    parts.palms.forEach((palm) => {
      palm.visible = k > 0.89
    })

    if (site.current) {
      const sk = k < 0.875 ? 1 : Math.max(0.001, 1 - (k - 0.875) / 0.06)
      site.current.visible = sk > 0.012
      site.current.scale.setScalar(sk)
    }
  })

  return (
    <group>
      <group ref={root}>
        <primitive object={parts.root} />
        <group position={[0, 13.35, 0]}>
          <mesh ref={core} position={[0, 0.5, -0.6]} castShadow receiveShadow>
            <boxGeometry args={[5.4, 1, 6.2]} />
            <meshStandardMaterial map={formTex} color="#e0dbd0" roughness={0.95} />
          </mesh>
          <group ref={columns}>
            {[
              [-8.6, -6.1],
              [8.6, -6.1],
              [-8.6, 6.1],
              [8.6, 6.1],
              [-8.6, 0],
              [8.6, 0],
              [0, -6.1],
              [0, 6.1],
            ].map(([x, z], i) => (
              <mesh key={i} position={[x, 0.5, z]} castShadow>
                <boxGeometry args={[0.5, 1, 0.5]} />
                <meshStandardMaterial color="#8a867b" roughness={0.88} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      <group ref={site}>
      {/* site ground, excavation and foundation mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0]} receiveShadow>
        <planeGeometry args={[76, 76]} />
        <meshStandardMaterial map={dirtTex} color="#c7bcaa" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]} receiveShadow>
        <planeGeometry args={[46, 40]} />
        <meshStandardMaterial color="#766c5d" roughness={1} />
      </mesh>
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <boxGeometry args={[30, 0.2, 24]} />
        <meshStandardMaterial color="#7a7061" roughness={1} />
      </mesh>
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <boxGeometry args={[23, 0.16, 17]} />
        <meshStandardMaterial color="#aaa094" roughness={0.96} />
      </mesh>
      {/* rebar mat on the raft */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`rb-x-${i}`} position={[-10.5 + i * 1.4, 0.39, 0]}>
          <boxGeometry args={[0.05, 0.04, 16]} />
          <meshStandardMaterial color="#8a6a48" roughness={0.65} metalness={0.45} />
        </mesh>
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`rb-z-${i}`} position={[0, 0.4, -7.7 + i * 1.4]}>
          <boxGeometry args={[22, 0.04, 0.05]} />
          <meshStandardMaterial color="#8a6a48" roughness={0.65} metalness={0.45} />
        </mesh>
      ))}

      <SiteFence />
      <WorkerCrew progress={progress} />
      <BrickPiles />

      {/* excavators, site sheds, stacks and barriers */}
      <Excavator position={[-17, 0, 15]} rotation={0.6} />
      <Excavator position={[19, 0, -14]} rotation={-2.1} />

      {/* soil piles */}
      {[
        [-27, 21, 3.4],
        [25, -24, 3.1],
        [24, 20, 2.7],
      ].map(([x, z, s], i) => (
        <mesh key={`soil-${i}`} position={[x, 0.9, z]} castShadow>
          <coneGeometry args={[s, 1.9, 12]} />
          <meshStandardMaterial color="#847965" roughness={1} />
        </mesh>
      ))}

      {/* stacked pipes and pallets */}
      <group position={[-24, 0.25, -22]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 5.4, 8]} />
          <meshStandardMaterial color="#8b8b84" roughness={0.7} metalness={0.35} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.9, 0.8]}>
          <cylinderGeometry args={[0.28, 0.28, 5.4, 8]} />
          <meshStandardMaterial color="#9a9287" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>
      <mesh position={[25, 0.6, -4]} castShadow>
        <boxGeometry args={[3.4, 1.2, 1.6]} />
        <meshStandardMaterial color="#b7a68b" roughness={0.9} />
      </mesh>
      <mesh position={[25, 1.4, -4]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[2.8, 0.4, 1.3]} />
        <meshStandardMaterial color="#8f7a5c" roughness={0.95} />
      </mesh>

      {/* safety barriers by the gate */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={`bar-${i}`} position={[-12 + i * 3.2, 0, 31]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[2.3, 0.24, 0.16]} />
            <meshStandardMaterial color="#d2d0c5" roughness={0.7} />
          </mesh>
          <mesh position={[0.65, 0.55, 0]}>
            <boxGeometry args={[0.7, 0.25, 0.17]} />
            <meshStandardMaterial color="#cc5b2e" roughness={0.6} />
          </mesh>
          <mesh position={[-0.65, 0.55, 0]}>
            <boxGeometry args={[0.7, 0.25, 0.17]} />
            <meshStandardMaterial color="#cc5b2e" roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.9, 0.27, 0]}>
              <boxGeometry args={[0.08, 0.54, 0.08]} />
              <meshStandardMaterial color="#a8a69d" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      <Crane position={[-34, 0, -17]} height={64} jib={42} phase={0.2} opacity={craneOpacity} />
      <Crane position={[31, 0, 22]} height={53} jib={36} phase={1.7} opacity={craneOpacity} />
      <Crane position={[5, 0, -38]} height={44} jib={30} phase={3.1} opacity={craneOpacity} />

      {/* site office + material sheds */}
      <group position={[26, 0, -28]}>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[4.8, 2.6, 2.4]} />
          <meshStandardMaterial color="#d8d2c3" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.3, 1.23]}>
          <boxGeometry args={[1.1, 0.9, 0.04]} />
          <meshStandardMaterial color="#4b514c" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.7, 0]}>
          <boxGeometry args={[5.1, 0.12, 2.7]} />
          <meshStandardMaterial color="#c8c0af" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[-26, 0.7, 27]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[5.4, 1.4, 2]} />
        <meshStandardMaterial color="#8a7b62" roughness={0.9} />
      </mesh>
      {[-18, 18].map((x) => (
        <mesh key={x} position={[x, 0.45, -27]} rotation={[0, 0.1, 0]}>
          <coneGeometry args={[2.4, 1.1, 12]} />
          <meshStandardMaterial color="#b8a17e" roughness={1} />
        </mesh>
      ))}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  camera rig                                                         */
/* ------------------------------------------------------------------ */
type CamKey = { p: number; pos: [number, number, number]; look: [number, number, number]; fov: number }

const CAMERA_KEYS: CamKey[] = [
  { p: 0.0, pos: [0, 312, 610], look: [0, 302, -1600], fov: 43 },
  { p: 0.06, pos: [-4, 300, 584], look: [0, 284, -1300], fov: 44 },
  { p: 0.11, pos: [-20, 256, 512], look: [0, 186, -430], fov: 45 },
  { p: 0.16, pos: [-52, 190, 432], look: [0, 74, -28], fov: 47 },
  { p: 0.23, pos: [-146, 104, 316], look: [0, 42, 0], fov: 47 },
  { p: 0.32, pos: [-244, 112, 232], look: [0, 40, 0], fov: 45 },
  { p: 0.42, pos: [-213, 95, 171], look: [0, 38, 0], fov: 43 },
  { p: 0.5, pos: [-132, 79, 137], look: [0, 40, 0], fov: 42 },
  { p: 0.57, pos: [-28, 69, 129], look: [0, 45, 0], fov: 40 },
  { p: 0.64, pos: [62, 56, 108], look: [0, 37, 0], fov: 41 },
  { p: 0.73, pos: [82, 43, 88], look: [0, 34, 0], fov: 42 },
  { p: 0.82, pos: [81, 44, 143], look: [0, 44, 0], fov: 42 },
  { p: 0.91, pos: [45, 47, 168], look: [0, 45, 0], fov: 40 },
  { p: 1.0, pos: [-38, 47, 176], look: [0, 45, 0], fov: 39 },
]

function sampleKeys(p: number) {
  const keys = CAMERA_KEYS
  if (p <= keys[0].p) return keys[0]
  if (p >= keys[keys.length - 1].p) return keys[keys.length - 1]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (p >= a.p && p <= b.p) {
      const raw = (p - a.p) / (b.p - a.p)
      const t = raw * raw * (3 - 2 * raw)
      return {
        pos: [
          a.pos[0] + (b.pos[0] - a.pos[0]) * t,
          a.pos[1] + (b.pos[1] - a.pos[1]) * t,
          a.pos[2] + (b.pos[2] - a.pos[2]) * t,
        ] as [number, number, number],
        look: [
          a.look[0] + (b.look[0] - a.look[0]) * t,
          a.look[1] + (b.look[1] - a.look[1]) * t,
          a.look[2] + (b.look[2] - a.look[2]) * t,
        ] as [number, number, number],
        fov: a.fov + (b.fov - a.fov) * t,
        p,
      }
    }
  }
  return keys[keys.length - 1]
}

export function CinematicRig({ progress }: { progress: MotionValue<number> }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0, 34, 0))
  const pos = useRef(new THREE.Vector3(0, 228, 392))

  useFrame((state, dt) => {
    const p = progress.get()
    const key = sampleKeys(p)
    const narrow = size.width < 760
    const factor = narrow ? 1.24 : 1
    const targetX = key.pos[0] * factor + state.pointer.x * (narrow ? 1.5 : 3.2)
    const targetY = key.pos[1] * (narrow ? 1.05 : 1) + state.pointer.y * (narrow ? 1.2 : 2.4)
    const targetZ = key.pos[2] * factor
    const shake = p < 0.28 ? 0.9 : 0.25
    const sx = Math.sin(state.clock.elapsedTime * 0.6) * shake
    const sy = Math.cos(state.clock.elapsedTime * 0.47) * shake * 0.7

    pos.current.set(targetX + sx, targetY + sy, targetZ)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.current.x, 3.6, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.current.y, 3.6, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.current.z, 3.6, dt)

    look.current.x = THREE.MathUtils.damp(look.current.x, key.look[0], 3.6, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, key.look[1], 3.6, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, key.look[2], 3.6, dt)
    camera.lookAt(look.current)

    if ('fov' in camera) {
      const cam = camera as THREE.PerspectiveCamera
      cam.fov = THREE.MathUtils.damp(cam.fov, key.fov + (narrow ? 8 : 0), 4, dt)
      cam.updateProjectionMatrix()
    }
  })
  return null
}

/* ------------------------------------------------------------------ */
/*  scene lighting                                                     */
/* ------------------------------------------------------------------ */
export function WorldLighting({ night = false }: { night?: boolean }) {
  return (
    <>
      <hemisphereLight
        intensity={night ? 0.34 : 0.44}
        color={night ? '#7890a0' : '#dbe6ec'}
        groundColor={night ? '#15120d' : '#5e594b'}
      />
      <directionalLight
        position={[-320, 280, 180]}
        intensity={night ? 1.2 : 1.95}
        color={night ? '#ffb173' : '#ffe0ba'}
        castShadow={!night}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={220}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[240, 150, -280]}
        intensity={night ? 0.6 : 0.38}
        color={night ? '#6f91b2' : '#a9c3d4'}
      />
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={night ? 1.4 : 2.4}
          position={[-70, 60, -60]}
          scale={[120, 45, 1]}
          color={night ? '#ffbd84' : '#ffd8b1'}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[60, 40, 20]}
          rotation-y={-Math.PI / 2}
          scale={[70, 50, 1]}
          color="#9db6c7"
        />
        <Lightformer
          form="ring"
          intensity={1.4}
          position={[0, 100, 0]}
          scale={50}
          color="#fff1d8"
        />
      </Environment>
    </>
  )
}
