import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Stars } from '@react-three/drei'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import * as THREE from 'three'
import { LEVELS } from '../data/site'

const STAGES = [
  {
    n: '01',
    key: 'arrival',
    label: 'The arrival',
    line: 'Sector 137, Noida. The gates open quietly.',
  },
  {
    n: '02',
    key: 'lobby',
    label: 'The lobby',
    line: 'Stone, bronze, and a welcome held in warm light.',
  },
  {
    n: '03',
    key: 'corridor',
    label: 'The corridor',
    line: 'A sequence of arches, leading you inward.',
  },
  {
    n: '04',
    key: 'home',
    label: 'The residence',
    line: 'The door closes behind you. The city stays outside.',
  },
]

function stageFor(p: number) {
  if (p < 0.2) return 0
  if (p < 0.46) return 1
  if (p < 0.74) return 2
  return 3
}

/* ------------------------------------------------------------------ */
/*  materials                                                          */
/* ------------------------------------------------------------------ */
const MAT = {
  stone: '#cbbda8',
  stoneDark: '#8f816e',
  plaster: '#d9cebd',
  bronze: '#8d6a41',
  bronzeLight: '#c09a67',
  wood: '#5a4430',
  dark: '#101611',
  glass: '#7d9694',
  warm: '#ffcf96',
  linen: '#ded2bf',
}

function Box({
  p,
  s,
  c,
  rough = 0.65,
  metal = 0,
  emissive,
  intensity = 1.5,
  opacity,
}: {
  p: [number, number, number]
  s: [number, number, number]
  c: string
  rough?: number
  metal?: number
  emissive?: string
  intensity?: number
  opacity?: number
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissive ? intensity : 0}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  )
}

function Cyl({
  p,
  r = 0.3,
  h = 1,
  c,
  metal = 0,
  rough = 0.6,
}: {
  p: [number, number, number]
  r?: number
  h?: number
  c: string
  metal?: number
  rough?: number
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={c} metalness={metal} roughness={rough} />
    </mesh>
  )
}

function Planter({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.38, 0]} r={0.46} h={0.76} c="#9b7653" rough={0.85} />
      <mesh position={[0, 1.15, 0]} castShadow>
        <icosahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#3c5036" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.35, 1.5, 0.15]} castShadow>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#4b5e3f" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.35, 1.42, -0.16]} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#445739" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

function Pendant({ p, warm = MAT.warm }: { p: [number, number, number]; warm?: string }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.5, 0]} r={0.012} h={0.8} c="#3a3127" />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color="#fff7e8" emissive={warm} emissiveIntensity={3} />
      </mesh>
      <pointLight intensity={1.6} distance={7} decay={2} color={warm} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  exterior                                                           */
/* ------------------------------------------------------------------ */
function Facade({ progress }: { progress: any }) {
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)

  useFrame(() => {
    const p = progress.get()
    const k = THREE.MathUtils.smoothstep(p, 0.13, 0.28)
    if (left.current) left.current.position.x = -1.62 - k * 1.85
    if (right.current) right.current.position.x = 1.62 + k * 1.85
  })

  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 12]} receiveShadow>
        <planeGeometry args={[60, 44]} />
        <meshStandardMaterial color="#1b211c" roughness={0.42} metalness={0.28} />
      </mesh>

      {/* facade wall around the opening */}
      <Box p={[-7.2, 5, 0]} s={[10.2, 10, 1.1]} c={MAT.plaster} rough={0.85} />
      <Box p={[7.2, 5, 0]} s={[10.2, 10, 1.1]} c={MAT.plaster} rough={0.85} />
      <Box p={[0, 7.6, 0]} s={[4.2, 4.8, 1.1]} c={MAT.plaster} rough={0.85} />
      <Box p={[0, 10.1, 0]} s={[24.4, 0.5, 1.5]} c={MAT.stoneDark} rough={0.7} />

      {/* warm facade reveal */}
      <Box p={[-2.1, 2.6, 0.62]} s={[0.06, 5.2, 0.06]} c={MAT.warm} emissive={MAT.warm} intensity={3} />
      <Box p={[2.1, 2.6, 0.62]} s={[0.06, 5.2, 0.06]} c={MAT.warm} emissive={MAT.warm} intensity={3} />

      {/* canopy */}
      <Box p={[0, 5.5, 3.1]} s={[8.4, 0.24, 6.2]} c={MAT.bronze} metal={0.75} rough={0.28} />
      <Box p={[0, 5.36, 3.1]} s={[7.8, 0.03, 5.6]} c={MAT.warm} emissive={MAT.warm} intensity={2.4} />
      {[-3.6, 3.6].map((x) => (
        <Cyl key={x} p={[x, 2.75, 5.9]} r={0.09} h={5.5} c={MAT.bronze} metal={0.8} rough={0.24} />
      ))}

      {/* door frame */}
      <Box p={[-2.18, 2.55, 1.15]} s={[0.18, 5.1, 0.22]} c={MAT.bronze} metal={0.8} rough={0.25} />
      <Box p={[2.18, 2.55, 1.15]} s={[0.18, 5.1, 0.22]} c={MAT.bronze} metal={0.8} rough={0.25} />
      <Box p={[0, 5.1, 1.15]} s={[4.54, 0.18, 0.22]} c={MAT.bronze} metal={0.8} rough={0.25} />

      {/* sliding glass door */}
      <group ref={left} position={[-1.62, 0, 1.1]}>
        <Box p={[0, 2.45, 0]} s={[3.16, 4.86, 0.06]} c={MAT.glass} rough={0.08} metal={0.4} opacity={0.34} />
        <Box p={[1.55, 2.45, 0.04]} s={[0.05, 4.86, 0.09]} c={MAT.bronze} metal={0.9} rough={0.2} />
        <Box p={[0, 4.83, 0.04]} s={[3.16, 0.05, 0.09]} c={MAT.bronze} metal={0.9} rough={0.2} />
        <Cyl p={[1.34, 2.2, 0.16]} r={0.035} h={1.1} c={MAT.bronzeLight} metal={1} rough={0.16} />
      </group>
      <group ref={right} position={[1.62, 0, 1.1]}>
        <Box p={[0, 2.45, 0]} s={[3.16, 4.86, 0.06]} c={MAT.glass} rough={0.08} metal={0.4} opacity={0.34} />
        <Box p={[-1.55, 2.45, 0.04]} s={[0.05, 4.86, 0.09]} c={MAT.bronze} metal={0.9} rough={0.2} />
        <Box p={[0, 4.83, 0.04]} s={[3.16, 0.05, 0.09]} c={MAT.bronze} metal={0.9} rough={0.2} />
        <Cyl p={[-1.34, 2.2, 0.16]} r={0.035} h={1.1} c={MAT.bronzeLight} metal={1} rough={0.16} />
      </group>

      {/* address plaque */}
      <Box p={[3.05, 2.6, 1.25]} s={[0.72, 0.9, 0.04]} c={MAT.stoneDark} rough={0.5} />
      <Html position={[3.05, 2.6, 1.3]} center style={{ pointerEvents: 'none' }}>
        <div className="text-center font-display text-[11px] leading-none tracking-[0.18em] text-bone/80">
          A
          <br />
          <span className="text-[6px] tracking-[0.12em]">01</span>
        </div>
      </Html>

      {/* planters + bollards */}
      <Planter p={[-4.6, 0, 4.2]} s={1.05} />
      <Planter p={[4.6, 0, 4.2]} s={1.05} />
      {[-5.8, 5.8].map((x) => (
        <group key={x}>
          <Cyl p={[x, 0.5, 7]} r={0.055} h={1} c="#2c2a24" metal={0.4} />
          <Box p={[x, 1.02, 7]} s={[0.18, 0.06, 0.18]} c={MAT.warm} emissive={MAT.warm} intensity={4} />
        </group>
      ))}

      {/* warm spill from the lobby */}
      <pointLight position={[0, 2.6, -1]} intensity={10} distance={16} decay={2} color={MAT.warm} />
      <pointLight position={[0, 4.6, 5.4]} intensity={5} distance={12} decay={2} color="#ffd9ab" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  lobby                                                              */
/* ------------------------------------------------------------------ */
function Lobby() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -8]} receiveShadow>
        <planeGeometry args={[14, 20]} />
        <meshStandardMaterial color="#b9a88f" roughness={0.32} metalness={0.12} />
      </mesh>
      <Box p={[0, 4.5, -8]} s={[14, 0.22, 20]} c="#231f19" rough={0.9} />
      <Box p={[-6.9, 2.3, -8]} s={[0.35, 4.6, 20]} c={MAT.plaster} rough={0.9} />
      <Box p={[6.9, 2.3, -8]} s={[0.35, 4.6, 20]} c={MAT.plaster} rough={0.9} />

      {/* back wall, opened at the centre for the corridor */}
      <Box p={[-4.35, 2.3, -17.6]} s={[5.1, 4.6, 0.3]} c={MAT.stoneDark} rough={0.55} />
      <Box p={[4.35, 2.3, -17.6]} s={[5.1, 4.6, 0.3]} c={MAT.stoneDark} rough={0.55} />
      <Box p={[0, 3.85, -17.6]} s={[3.6, 1.5, 0.3]} c={MAT.stoneDark} rough={0.55} />
      <mesh position={[0, 2.99, -17.42]}>
        <torusGeometry args={[1.8, 0.05, 8, 28, Math.PI]} />
        <meshStandardMaterial color={MAT.bronzeLight} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* backlit stone behind reception */}
      <Box p={[4.35, 2.1, -17.3]} s={[4.9, 3.4, 0.08]} c="#b79a6d" emissive="#e8b982" intensity={0.6} rough={0.5} />
      <Html position={[4.35, 2.35, -17.15]} center style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap font-display text-[14px] uppercase tracking-[0.4em] text-[#2a2118]/60">
          Asterion
        </div>
      </Html>

      {/* lift bank */}
      <group position={[-4.35, 0, -17]}>
        <Box p={[0, 2.1, 0]} s={[2.7, 4.2, 0.16]} c="#1d1b16" rough={0.5} metal={0.3} />
        <Box p={[-0.68, 2.1, 0.1]} s={[1.26, 4.06, 0.06]} c={MAT.bronze} metal={0.85} rough={0.26} />
        <Box p={[0.68, 2.1, 0.1]} s={[1.26, 4.06, 0.06]} c={MAT.bronze} metal={0.85} rough={0.26} />
        <Box p={[0, 2.1, 0.14]} s={[0.02, 4.06, 0.02]} c={MAT.warm} emissive={MAT.warm} intensity={2.4} />
        <Box p={[0, 4.35, 0.12]} s={[2.9, 0.1, 0.1]} c={MAT.warm} emissive={MAT.warm} intensity={2.6} />
      </group>

      {/* reception desk + seating */}
      <Box p={[4.35, 0.56, -6.4]} s={[3.6, 1.12, 1.1]} c={MAT.wood} rough={0.55} />
      <Box p={[4.35, 1.14, -6.4]} s={[3.8, 0.07, 1.2]} c={MAT.stone} rough={0.3} />
      <Box p={[4.35, 0.52, -5.7]} s={[3.6, 1.03, 0.16]} c={MAT.bronze} metal={0.6} rough={0.36} />
      <Cyl p={[4.35, 1.28, -6.3]} r={0.16} h={0.26} c="#28251f" />
      <Box p={[-4.6, 0.44, -5.2]} s={[3.4, 0.5, 1.2]} c={MAT.linen} rough={0.95} />
      <Box p={[-4.6, 0.78, -4.7]} s={[3.4, 0.5, 0.18]} c={MAT.linen} rough={0.95} />
      {[-5.7, -4.6, -3.5].map((x) => (
        <Box key={x} p={[x, 0.52, -5.95]} s={[0.7, 0.28, 0.7]} c={MAT.wood} rough={0.7} />
      ))}

      {/* pendants */}
      {[-3, -6.5, -10, -13.5].map((z, i) => (
        <Pendant key={z} p={[i % 2 === 0 ? -1.2 : 1.2, 3.35, z]} />
      ))}
      {/* light coves */}
      <Box p={[-6.7, 4.1, -8]} s={[0.05, 0.08, 16]} c={MAT.warm} emissive={MAT.warm} intensity={2.2} />
      <Box p={[6.7, 4.1, -8]} s={[0.05, 0.08, 16]} c={MAT.warm} emissive={MAT.warm} intensity={2.2} />
      <Planter p={[-6, 0, -12]} s={0.85} />
      <Planter p={[6, 0, -11.5]} s={0.85} />

      <pointLight position={[0, 3.3, -5]} intensity={16} distance={18} decay={2} color="#ffd3a3" />
      <pointLight position={[0, 3.2, -12]} intensity={12} distance={16} decay={2} color="#ffc892" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  corridor                                                           */
/* ------------------------------------------------------------------ */
function ArchNiche({ side, z }: { side: -1 | 1; z: number }) {
  const x = side * 1.76
  return (
    <group position={[x, 0, z]} rotation={[0, side === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, 1.35, 0.02]}>
        <planeGeometry args={[1.34, 2.7]} />
        <meshStandardMaterial color="#171c17" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.7, 0.02]}>
        <torusGeometry args={[0.67, 0.035, 8, 24, Math.PI]} />
        <meshStandardMaterial color={MAT.bronzeLight} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.35, 0.05]}>
        <boxGeometry args={[1.34, 2.7, 0.02]} />
        <meshStandardMaterial color="#2b1e15" emissive="#ffb274" emissiveIntensity={0.24} transparent opacity={0.35} />
      </mesh>
      <Box p={[0, 2.76, 0.05]} s={[0.08, 0.08, 0.16]} c={MAT.warm} emissive={MAT.warm} intensity={2.5} />
    </group>
  )
}

function Corridor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -27]} receiveShadow>
        <planeGeometry args={[3.6, 20]} />
        <meshStandardMaterial color="#a08d75" roughness={0.45} metalness={0.08} />
      </mesh>
      <Box p={[0, 3.2, -27]} s={[3.6, 0.16, 20]} c="#24201a" rough={0.9} />
      <Box p={[-1.84, 1.6, -27]} s={[0.16, 3.2, 20]} c={MAT.plaster} rough={0.88} />
      <Box p={[1.84, 1.6, -27]} s={[0.16, 3.2, 20]} c={MAT.plaster} rough={0.88} />
      {[-21, -25.5, -30, -34.5].map((z) => (
        <ArchNiche key={z} side={-1} z={z} />
      ))}
      {[-23.2, -27.7, -32.2, -36.2].map((z) => (
        <ArchNiche key={z} side={1} z={z} />
      ))}
      <Box p={[0, 3.06, -27]} s={[0.07, 0.05, 18]} c={MAT.warm} emissive={MAT.warm} intensity={2.8} />
      {[-20, -26, -32].map((z) => (
        <Pendant key={z} p={[0, 2.9, z]} />
      ))}
      <pointLight position={[0, 2.7, -23]} intensity={9} distance={11} decay={2} color="#ffca94" />
      <pointLight position={[0, 2.7, -31]} intensity={9} distance={11} decay={2} color="#ffca94" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  apartment                                                          */
/* ------------------------------------------------------------------ */
function makeSkyline() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#6d7f8c')
  g.addColorStop(0.42, '#c9a68c')
  g.addColorStop(0.68, '#e9c9a2')
  g.addColorStop(1, '#9c8066')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 512)
  let x = 0
  let seed = 17
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  while (x < 1024) {
    const w = 22 + rnd() * 70
    const h = 60 + rnd() * 250
    ctx.fillStyle = `rgba(45,50,52,${0.32 + rnd() * 0.3})`
    ctx.fillRect(x, 512 - h, w, h)
    ctx.fillStyle = 'rgba(255,214,160,0.65)'
    for (let wy = 512 - h + 14; wy < 500; wy += 18) {
      for (let wx = x + 6; wx < x + w - 6; wx += 12) {
        if (rnd() > 0.72) ctx.fillRect(wx, wy, 3, 5)
      }
    }
    x += w + 4 + rnd() * 18
  }
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function Apartment() {
  const sky = useMemo(() => makeSkyline(), [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -47]} receiveShadow>
        <planeGeometry args={[12, 20]} />
        <meshStandardMaterial color="#b29a7c" roughness={0.5} />
      </mesh>
      <Box p={[0, 3.2, -47]} s={[12, 0.18, 20]} c="#2c261e" rough={0.9} />
      <Box p={[-6, 1.6, -47]} s={[0.2, 3.2, 20]} c={MAT.plaster} rough={0.9} />
      <Box p={[6, 1.6, -47]} s={[0.2, 3.2, 20]} c={MAT.plaster} rough={0.9} />
      <Box p={[-3.55, 1.6, -37]} s={[4.9, 3.2, 0.2]} c={MAT.plaster} rough={0.9} />
      <Box p={[3.55, 1.6, -37]} s={[4.9, 3.2, 0.2]} c={MAT.plaster} rough={0.9} />
      <Box p={[0, 2.9, -37]} s={[2.2, 0.6, 0.2]} c={MAT.plaster} rough={0.9} />

      {/* window wall */}
      <mesh position={[0, 1.55, -57.92]}>
        <planeGeometry args={[11.4, 2.9]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      {[-5.7, -3.8, -1.9, 0, 1.9, 3.8, 5.7].map((x) => (
        <Box key={x} p={[x, 1.55, -57.84]} s={[0.05, 2.9, 0.06]} c="#2d2a22" rough={0.6} />
      ))}
      <Box p={[0, 3.0, -57.84]} s={[11.5, 0.08, 0.1]} c="#2d2a22" rough={0.6} />
      <Box p={[0, 0.12, -57.84]} s={[11.5, 0.08, 0.1]} c="#2d2a22" rough={0.6} />

      {/* living room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.02, -50]}>
        <planeGeometry args={[6.2, 5.2]} />
        <meshStandardMaterial color="#d9cdbb" roughness={1} />
      </mesh>
      <Box p={[-1, 0.34, -49]} s={[3.8, 0.42, 1.15]} c="#d9cdbb" rough={0.95} />
      <Box p={[-1, 0.62, -48.5]} s={[3.8, 0.5, 0.16]} c="#d9cdbb" rough={0.95} />
      <Box p={[-2.8, 0.55, -49]} s={[0.16, 0.36, 1.15]} c="#d9cdbb" rough={0.95} />
      <Box p={[0.8, 0.55, -49]} s={[0.16, 0.36, 1.15]} c="#d9cdbb" rough={0.95} />
      <Cyl p={[-1, 0.28, -51]} r={0.7} h={0.08} c="#8f7556" rough={0.5} />
      <Cyl p={[-1, 0.14, -51]} r={0.34} h={0.28} c="#6d5841" rough={0.45} />
      <Box p={[3.8, 0.32, -49]} s={[2.2, 0.4, 0.6]} c="#8f7556" rough={0.5} />
      <Box p={[3.8, 0.56, -49]} s={[2.2, 0.06, 0.6]} c="#b9a27f" rough={0.4} />
      <Planter p={[4.6, 0, -54]} s={1.05} />
      <Planter p={[-4.7, 0, -55]} s={1.15} />

      {/* dining */}
      <Box p={[3.4, 0.74, -44]} s={[2.2, 0.08, 1]} c="#7f6649" rough={0.5} />
      <Cyl p={[2.6, 0.37, -44]} r={0.06} h={0.74} c="#5b4631" />
      <Cyl p={[4.2, 0.37, -44]} r={0.06} h={0.74} c="#5b4631" />
      {[-1.1, 0, 1.1].map((x) => (
        <Box key={x} p={[x + 3.4, 0.6, -45.3]} s={[0.34, 0.46, 0.06]} c="#cdbfae" />
      ))}
      {[2.6, 4.2].map((x) => (
        <group key={x} position={[x, 0, -44]}>
          <Box p={[0, 0.25, 0]} s={[0.38, 0.42, 0.38]} c="#cdbfae" />
          <Box p={[0, 0.62, x < 3.4 ? -0.22 : 0.22]} s={[0.38, 0.5, 0.06]} c="#cdbfae" />
        </group>
      ))}

      {/* pendants + cove */}
      <Pendant p={[-1, 2.5, -50]} />
      <Pendant p={[2.4, 2.5, -50]} />
      <Box p={[-1, 3.05, -46]} s={[8, 0.04, 12]} c="#3b3126" rough={0.9} />
      <Box p={[-1, 3.06, -52]} s={[6, 0.04, 0.08]} c={MAT.warm} emissive={MAT.warm} intensity={2} />
      <pointLight position={[0, 2.7, -48]} intensity={14} distance={17} decay={2} color="#ffcf9a" />
      <pointLight position={[0, 2.2, -54]} intensity={7} distance={12} decay={2} color="#ffc084" />

      {/* apartment door frame */}
      <Box p={[-1.05, 1.4, -37.05]} s={[0.16, 2.8, 0.24]} c={MAT.wood} rough={0.45} />
      <Box p={[1.05, 1.4, -37.05]} s={[0.16, 2.8, 0.24]} c={MAT.wood} rough={0.45} />
      <Box p={[0, 2.86, -37.05]} s={[2.26, 0.16, 0.24]} c={MAT.wood} rough={0.45} />
    </group>
  )
}

function ApartmentDoor({ progress }: { progress: any }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const p = progress.get()
    const k = THREE.MathUtils.smoothstep(p, 0.74, 0.84)
    ref.current.rotation.y = -k * 1.42
  })
  return (
    <group ref={ref} position={[-0.95, 0, -38.1]}>
      <Box p={[0.95, 1.36, 0]} s={[1.9, 2.72, 0.08]} c="#4f3b29" rough={0.45} />
      <Box p={[0.95, 1.36, 0.05]} s={[1.55, 2.42, 0.02]} c="#5f4935" rough={0.5} />
      <Cyl p={[1.68, 1.14, 0.12]} r={0.035} h={0.3} c={MAT.bronzeLight} metal={1} rough={0.15} />
      <Html position={[0.95, 1.92, 0.08]} center style={{ pointerEvents: 'none' }}>
        <div className="font-display text-[10px] tracking-[0.22em] text-[#d9c6a7]">01</div>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  camera                                                             */
/* ------------------------------------------------------------------ */
type Key = { p: number; pos: [number, number, number]; look: [number, number, number]; fov: number }

const KEYS: Key[] = [
  { p: 0, pos: [0, 1.85, 18], look: [0, 3.0, 0], fov: 46 },
  { p: 0.11, pos: [0, 1.76, 11], look: [0, 2.7, 0], fov: 44 },
  { p: 0.2, pos: [0, 1.72, 4.6], look: [0, 2.2, -4], fov: 42 },
  { p: 0.3, pos: [0, 1.7, -0.4], look: [0.4, 2.2, -9], fov: 44 },
  { p: 0.4, pos: [0, 1.7, -5], look: [0.8, 2.3, -14], fov: 44 },
  { p: 0.5, pos: [0, 1.68, -12.5], look: [0, 2.1, -21], fov: 42 },
  { p: 0.6, pos: [0, 1.66, -19], look: [0, 1.9, -30], fov: 42 },
  { p: 0.7, pos: [0, 1.66, -27], look: [0, 1.9, -38], fov: 42 },
  { p: 0.8, pos: [0, 1.64, -35], look: [0, 1.8, -45], fov: 44 },
  { p: 0.9, pos: [0, 1.62, -44], look: [-0.5, 1.7, -54], fov: 46 },
  { p: 1, pos: [0, 1.6, -51], look: [-0.9, 1.5, -58], fov: 48 },
]

function sample(p: number) {
  if (p <= KEYS[0].p) return KEYS[0]
  const last = KEYS[KEYS.length - 1]
  if (p >= last.p) return last
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i]
    const b = KEYS[i + 1]
    if (p >= a.p && p <= b.p) {
      const raw = (p - a.p) / (b.p - a.p)
      const t = raw * raw * (3 - 2 * raw)
      return {
        p,
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
      }
    }
  }
  return last
}

function EntryCamera({ progress }: { progress: any }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 2.8, 0))
  useFrame((state, dt) => {
    const p = progress.get()
    const k = sample(p)
    const sway = 0.03
    camera.position.x = THREE.MathUtils.damp(camera.position.x, k.pos[0] + Math.sin(state.clock.elapsedTime * 0.23) * sway, 5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, k.pos[1], 5, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, k.pos[2], 5, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, k.look[0], 4.4, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, k.look[1], 4.4, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, k.look[2], 4.4, dt)
    camera.lookAt(look.current)
    if ('fov' in camera) {
      const cam = camera as THREE.PerspectiveCamera
      const portrait = state.size.width < state.size.height
      cam.fov = THREE.MathUtils.damp(cam.fov, k.fov + (portrait ? 9 : 0), 4, dt)
      cam.updateProjectionMatrix()
    }
  })
  return null
}

/* ------------------------------------------------------------------ */
/*  scene                                                              */
/* ------------------------------------------------------------------ */
function EntryScene({ progress }: { progress: any }) {
  return (
    <>
      <color attach="background" args={['#0a0f0c']} />
      <fog attach="fog" args={['#0a0f0c', 16, 68]} />
      <ambientLight intensity={0.26} color="#b9c9c2" />
      <hemisphereLight intensity={0.3} color="#8fa4a5" groundColor="#1d1a14" />
      <directionalLight
        position={[12, 22, 16]}
        intensity={1.4}
        color="#9db9c1"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />
      <Stars radius={90} depth={40} count={900} factor={2.4} saturation={0} fade speed={0.3} />
      <Facade progress={progress} />
      <Lobby />
      <Corridor />
      <Apartment />
      <ApartmentDoor progress={progress} />
      <EntryCamera progress={progress} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  section                                                            */
/* ------------------------------------------------------------------ */
export default function Entry() {
  const ref = useRef<HTMLElement>(null)
  const [stage, setStage] = useState(0)
  const [flatNumber, setFlatNumber] = useState('0101')
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    const stored = window.sessionStorage.getItem('asterion-flat')
    if (stored) setFlatNumber(stored)
    const onFlat = (e: Event) => {
      const next = (e as CustomEvent<string>).detail
      if (next) setFlatNumber(next)
    }
    window.addEventListener('asterion:flat', onFlat)
    return () => window.removeEventListener('asterion:flat', onFlat)
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const s = stageFor(v)
    setStage((prev) => (prev === s ? prev : s))
  })

  const fade = useTransform(scrollYProgress, [0.93, 0.995], [0, 1])
  const intro = useTransform(scrollYProgress, [0, 0.05], [1, 0])
  const introY = useTransform(scrollYProgress, [0, 0.06], [0, -18])
  const stageOpacity = useTransform(scrollYProgress, [0.03, 0.09], [0, 1])
  const stageData = STAGES[stage]
  const level = flatNumber.slice(0, 2)
  const levelLabel = LEVELS[Math.max(0, Math.min(14, Number(level) - 1))]?.label

  return (
    <section ref={ref} id="entry" className="relative h-[460vh] bg-[#0a0f0c] text-bone">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Canvas
          shadows
          dpr={[1, 1.6]}
          camera={{ position: [0, 1.85, 18], fov: 46, near: 0.05, far: 140 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.15
          }}
        >
          <Suspense fallback={null}>
            <EntryScene progress={scrollYProgress} />
          </Suspense>
        </Canvas>

        {/* cinematic grade */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(4,8,5,0.72)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050906]/70 to-transparent" />

        {/* top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-[var(--gutter)] pb-4 pt-24 md:pt-28">
          <div className="flex items-center gap-3 text-bone/75">
            <span className="h-1 w-1 rounded-full bg-bone/60" />
            <span className="micro">Asterion · A private arrival</span>
          </div>
          <div className="text-right">
            <div className="text-[0.44rem] uppercase tracking-[0.26em] text-bone/60">
              Residence {flatNumber}
            </div>
            <div className="mt-1 text-[0.52rem] uppercase tracking-[0.2em] text-bone/75">
              {levelLabel}
            </div>
          </div>
        </div>

        {/* opening title */}
        <motion.div
          style={{ opacity: intro, y: introY }}
          className="pointer-events-none absolute inset-x-0 top-[46%] z-20 -translate-y-1/2 px-[var(--gutter)]"
        >
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-bone/40" />
            <span className="eyebrow text-bone/75">Now, the arrival</span>
          </div>
          <h2 className="mt-4 font-display text-[clamp(3.2rem,8vw,8rem)] leading-[0.82] text-bone">
            Step
            <br />
            inside.
          </h2>
        </motion.div>

        {/* stage copy */}
        <motion.div
          style={{ opacity: stageOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-[var(--gutter)] pb-8 md:pb-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={stageData.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[560px]"
            >
              <div className="flex items-center gap-4">
                <span className="text-[0.5rem] uppercase tracking-[0.24em] text-bone/60">
                  {stageData.n} / 04
                </span>
                <span className="h-px w-10 bg-bone/25" />
                <span className="eyebrow text-bone/75">{stageData.label}</span>
              </div>
              <p className="mt-3 font-display text-[clamp(1.5rem,2.6vw,2.2rem)] leading-tight text-bone/90">
                {stageData.line}
              </p>
              {stage === 3 ? (
                <div className="mt-4 flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.24em] text-bone/70">
                  <span className="scroll-rail scale-y-50" />
                  <span>Scroll to enter the residence</span>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* stage rail */}
        <div className="pointer-events-none absolute right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center justify-end gap-3">
              <span className={`text-[0.46rem] uppercase tracking-[0.22em] transition-all duration-700 ${stage === i ? 'text-bone/80' : 'text-bone/0'}`}>
                {s.label}
              </span>
              <span className={`h-px transition-all duration-700 ${stage === i ? 'w-8 bg-bone/70' : 'w-3 bg-bone/25'}`} />
            </div>
          ))}
        </div>

        {/* soft white handoff */}
        <motion.div
          style={{ opacity: fade }}
          className="pointer-events-none absolute inset-0 z-30 bg-bone"
        />
      </div>
    </section>
  )
}
