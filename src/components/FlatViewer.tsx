import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import {
  DECOR_IDEAS,
  type DecorIdea,
  type Flat,
  type RoomRect,
} from '../data/site'

const S = 1 // rooms are already defined in metres
const WALL_H = 1.16
const WALL_T = 0.12

const SHELL = {
  wall: '#f6f2ea',
  floor: '#e9e2d6',
  wet: '#e4e7e2',
  wood: '#d6c6b1',
  fabric: '#f1ece2',
  light: '#fff4de',
  glass: '#aebfbd',
}

type Palette = Pick<DecorIdea, 'wall' | 'floor' | 'fabric' | 'wood' | 'light'>

/* ------------------------------------------------------------------ */
/*  generic shapes                                                     */
/* ------------------------------------------------------------------ */
function B({
  p,
  s,
  c,
  rough = 0.72,
  metal = 0,
  emissive,
  opacity,
}: {
  p: [number, number, number]
  s: [number, number, number]
  c: string
  rough?: number
  metal?: number
  emissive?: string
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
        emissiveIntensity={emissive ? 1.6 : 0}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  )
}

function Cyl({
  p,
  r = 0.2,
  h = 0.4,
  c,
  rough = 0.6,
  metal = 0,
  emissive,
  rTop,
}: {
  p: [number, number, number]
  r?: number
  rTop?: number
  h?: number
  c: string
  rough?: number
  metal?: number
  emissive?: string
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, 20]} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissive ? 2 : 0}
      />
    </mesh>
  )
}

function Lamp({ p, c }: { p: [number, number, number]; c: string }) {
  return (
    <>
      <mesh position={p}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#fffaf0" emissive={c} emissiveIntensity={2.6} roughness={0.4} />
      </mesh>
      <pointLight position={p} intensity={2.2} distance={6.5} decay={2} color={c} />
    </>
  )
}

function Plant({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.36, 12]} />
        <meshStandardMaterial color="#9a7454" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <icosahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color="#4c5f3f" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.15, 0.8, 0.06]} castShadow>
        <icosahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#5d7049" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

function Art({
  p,
  s,
  c,
  rot = 0,
}: {
  p: [number, number, number]
  s: [number, number]
  c: string
  rot?: number
}) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh>
        <boxGeometry args={[s[0] + 0.06, s[1] + 0.06, 0.035]} />
        <meshStandardMaterial color="#3d352c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.024]}>
        <boxGeometry args={[s[0], s[1], 0.01]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  walls + floor                                                      */
/* ------------------------------------------------------------------ */
function roomFrame(room: RoomRect, cx: number, cz: number) {
  return {
    x: (room.x + room.w / 2 - cx) / S,
    z: (room.y + room.h / 2 - cz) / S,
    w: room.w / S,
    d: room.h / S,
  }
}

function WallRun({
  walls,
  cx,
  cz,
  colour,
}: {
  walls: Flat['type']['walls']
  cx: number
  cz: number
  colour: string
}) {
  return (
    <group>
      {walls.map((wall, i) => {
        const x1 = wall.x1 - cx
        const z1 = wall.z1 - cz
        const x2 = wall.x2 - cx
        const z2 = wall.z2 - cz
        const len = Math.hypot(x2 - x1, z2 - z1)
        if (len < 0.02) return null
        const angle = Math.atan2(z2 - z1, x2 - x1)
        return (
          <mesh
            key={`${wall.x1}-${wall.z1}-${wall.x2}-${wall.z2}-${i}`}
            position={[(x1 + x2) / 2, WALL_H / 2, (z1 + z2) / 2]}
            rotation={[0, -angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[len + WALL_T, WALL_H, WALL_T]} />
            <meshStandardMaterial color={colour} roughness={0.92} metalness={0} />
          </mesh>
        )
      })}
    </group>
  )
}

function Railings({
  room,
  cx,
  cz,
}: {
  room: RoomRect
  cx: number
  cz: number
}) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  if (room.kind !== 'balcony' && room.kind !== 'terrace') return null
  return (
    <group>
      <mesh position={[x, 0.42, z - d / 2 + 0.03]}>
        <boxGeometry args={[w, 0.84, 0.03]} />
        <meshStandardMaterial color={SHELL.glass} transparent opacity={0.26} roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position={[x - w / 2 + 0.03, 0.42, z]}>
        <boxGeometry args={[0.03, 0.84, d]} />
        <meshStandardMaterial color={SHELL.glass} transparent opacity={0.22} roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position={[x + w / 2 - 0.03, 0.42, z]}>
        <boxGeometry args={[0.03, 0.84, d]} />
        <meshStandardMaterial color={SHELL.glass} transparent opacity={0.22} roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position={[x, 0.86, z - d / 2 + 0.03]}>
        <boxGeometry args={[w, 0.025, 0.05]} />
        <meshStandardMaterial color="#a08b6d" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Glazing({
  panes,
  cx,
  cz,
}: {
  panes: Flat['type']['glazing']
  cx: number
  cz: number
}) {
  return (
    <group>
      {panes.map((pane, i) => {
        const x1 = pane.x1 - cx
        const z1 = pane.z1 - cz
        const x2 = pane.x2 - cx
        const z2 = pane.z2 - cz
        const len = Math.hypot(x2 - x1, z2 - z1)
        if (len < 0.05) return null
        const angle = Math.atan2(z2 - z1, x2 - x1)
        const px = (x1 + x2) / 2
        const pz = (z1 + z2) / 2
        if (pane.kind === 'door') {
          return (
            <group key={i} position={[px, 0, pz]} rotation={[0, -angle, 0]}>
              <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
                <boxGeometry args={[len * 0.92, 1.04, 0.06]} />
                <meshStandardMaterial color="#8a6a4a" roughness={0.62} />
              </mesh>
              <mesh position={[len * 0.28, 0.52, 0.05]}>
                <boxGeometry args={[0.035, 0.22, 0.035]} />
                <meshStandardMaterial color="#c9ac7c" metalness={0.7} roughness={0.28} />
              </mesh>
            </group>
          )
        }
        const sill = pane.kind === 'slider' ? 0 : 0.54
        return (
          <group key={i} position={[px, 0, pz]} rotation={[0, -angle, 0]}>
            {sill > 0 && (
              <mesh position={[0, sill / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[len + 0.04, sill, WALL_T]} />
                <meshStandardMaterial color="#e8e0d2" roughness={0.85} />
              </mesh>
            )}
            <mesh position={[0, (sill + WALL_H) / 2, 0]}>
              <boxGeometry args={[len - 0.02, WALL_H - sill, 0.025]} />
              <meshPhysicalMaterial
                color="#a9c5c0"
                transparent
                opacity={0.26}
                roughness={0.08}
                metalness={0.05}
                depthWrite={false}
              />
            </mesh>
            {[-len / 2, 0, len / 2].map((mx) => (
              <mesh key={mx} position={[mx, (sill + WALL_H) / 2, 0]}>
                <boxGeometry args={[0.035, WALL_H - sill, 0.05]} />
                <meshStandardMaterial color="#8e8069" metalness={0.4} roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0, WALL_H - 0.02, 0]}>
              <boxGeometry args={[len + 0.04, 0.04, 0.06]} />
              <meshStandardMaterial color="#d9cfbd" roughness={0.7} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  furnishings                                                        */
/* ------------------------------------------------------------------ */
function Living({
  room,
  cx,
  cz,
  p,
  dining,
}: {
  room: RoomRect
  cx: number
  cz: number
  p: Palette
  dining?: boolean
}) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  const sw = Math.min(w * 0.62, 3.2)
  const sd = Math.min(d * 0.26, 1.05)
  return (
    <group>
      <mesh position={[x, 0.015, z + d * 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.7, d * 0.52]} />
        <meshStandardMaterial color={p.fabric} roughness={1} />
      </mesh>

      {/* sofa */}
      <group position={[x - w * 0.06, 0, z + d * 0.24]}>
        <B p={[0, 0.26, 0]} s={[sw, 0.32, sd]} c={p.fabric} rough={0.95} />
        <B p={[0, 0.52, sd / 2 - 0.1]} s={[sw, 0.42, 0.16]} c={p.fabric} rough={0.95} />
        <B p={[-sw / 2 + 0.08, 0.44, 0]} s={[0.14, 0.36, sd]} c={p.fabric} rough={0.95} />
        <B p={[sw / 2 - 0.08, 0.44, 0]} s={[0.14, 0.36, sd]} c={p.fabric} rough={0.95} />
        <B p={[-sw * 0.18, 0.5, -0.05]} s={[0.38, 0.28, 0.8]} c={p.wood} rough={0.9} />
        <B p={[sw * 0.2, 0.5, -0.05]} s={[0.38, 0.28, 0.8]} c={p.wood} rough={0.9} />
      </group>

      {/* coffee table */}
      <Cyl p={[x + w * 0.04, 0.24, z - d * 0.02]} r={0.48} h={0.06} c={p.wood} rough={0.55} />
      <Cyl p={[x + w * 0.04, 0.12, z - d * 0.02]} r={0.26} h={0.24} c="#7d6c58" rough={0.4} metal={0.2} />

      {/* side table + lamp */}
      <Cyl p={[x - w * 0.34, 0.26, z - d * 0.12]} r={0.22} h={0.06} c={p.wood} />
      <Cyl p={[x - w * 0.34, 0.13, z - d * 0.12]} r={0.04} h={0.26} c="#6e5e4c" />
      <Lamp p={[x - w * 0.34, 0.44, z - d * 0.12]} c={p.light} />

      {/* media wall */}
      <B p={[x + w * 0.06, 0.3, z - d / 2 + 0.18]} s={[Math.min(w * 0.5, 2.4), 0.34, 0.36]} c={p.wood} rough={0.65} />
      <B p={[x + w * 0.06, 0.9, z - d / 2 + 0.08]} s={[Math.min(w * 0.34, 1.5), 0.72, 0.04]} c="#20211e" rough={0.35} />
      <Art p={[x - w * 0.28, 0.78, z - d / 2 + 0.06]} s={[0.7, 0.55]} c={p.fabric} />
      <Plant p={[x + w * 0.38, 0, z - d * 0.24]} s={0.9} />

      {dining && w > 3.4 ? (
        <group position={[x + w * 0.22, 0, z - d * 0.05]}>
          <B p={[0, 0.62, 0]} s={[1.5, 0.06, 0.9]} c={p.wood} rough={0.55} />
          <B p={[-0.6, 0.31, -0.32]} s={[0.07, 0.62, 0.07]} c="#6d5a44" />
          <B p={[0.6, 0.31, -0.32]} s={[0.07, 0.62, 0.07]} c="#6d5a44" />
          <B p={[-0.6, 0.31, 0.32]} s={[0.07, 0.62, 0.07]} c="#6d5a44" />
          <B p={[0.6, 0.31, 0.32]} s={[0.07, 0.62, 0.07]} c="#6d5a44" />
          {[-0.45, 0.45].map((dx) => (
            <group key={dx}>
              <B p={[dx, 0.28, 0.7]} s={[0.34, 0.42, 0.34]} c={p.fabric} />
              <B p={[dx, 0.62, 0.86]} s={[0.34, 0.44, 0.06]} c={p.fabric} />
              <B p={[dx, 0.28, -0.7]} s={[0.34, 0.42, 0.34]} c={p.fabric} />
              <B p={[dx, 0.62, -0.86]} s={[0.34, 0.44, 0.06]} c={p.fabric} />
            </group>
          ))}
        </group>
      ) : null}
    </group>
  )
}

function Dining({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  const tw = Math.min(w * 0.55, 1.9)
  return (
    <group position={[x, 0, z]}>
      <B p={[0, 0.62, 0]} s={[tw, 0.06, Math.min(d * 0.5, 0.95)]} c={p.wood} rough={0.5} />
      <B p={[-tw * 0.36, 0.31, 0]} s={[0.08, 0.62, Math.min(d * 0.42, 0.7)]} c="#74614a" />
      <B p={[tw * 0.36, 0.31, 0]} s={[0.08, 0.62, Math.min(d * 0.42, 0.7)]} c="#74614a" />
      {[-1, 1].map((side) =>
        [-0.3, 0.3].map((off) => (
          <group key={`${side}-${off}`} position={[off * tw, 0, side * Math.min(d * 0.34, 0.62)]}>
            <B p={[0, 0.24, 0]} s={[0.34, 0.4, 0.34]} c={p.fabric} />
            <B p={[0, 0.56, side * 0.16]} s={[0.34, 0.46, 0.06]} c={p.fabric} />
          </group>
        ))
      )}
      <Lamp p={[0, 2.05, 0]} c={p.light} />
      <Plant p={[w * 0.32, 0, -d * 0.28]} s={0.75} />
    </group>
  )
}

function Kitchen({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  const cw = Math.min(w * 0.82, 3.1)
  return (
    <group>
      <B p={[x, 0.45, z - d / 2 + 0.32]} s={[cw, 0.9, 0.58]} c={p.wood} rough={0.6} />
      <B p={[x, 0.93, z - d / 2 + 0.32]} s={[cw + 0.04, 0.05, 0.62]} c="#ded3c2" rough={0.3} />
      <B p={[x + cw * 0.18, 1.62, z - d / 2 + 0.12]} s={[cw * 0.56, 0.6, 0.38]} c={p.wood} rough={0.6} />
      <B p={[x, 0.46, z + d * 0.1]} s={[Math.min(w * 0.55, 1.9), 0.92, 0.72]} c={p.wood} rough={0.55} />
      <B p={[x, 0.94, z + d * 0.1]} s={[Math.min(w * 0.55, 1.9) + 0.04, 0.05, 0.76]} c="#ded3c2" rough={0.3} />
      <Lamp p={[x, 2.02, z + d * 0.1]} c={p.light} />
      <Cyl p={[x - 0.5, 0.36, z + d * 0.1]} r={0.05} h={0.72} c="#6b5a45" />
      <Cyl p={[x + 0.5, 0.36, z + d * 0.1]} r={0.05} h={0.72} c="#6b5a45" />
    </group>
  )
}

function Bedroom({
  room,
  cx,
  cz,
  p,
  master,
}: {
  room: RoomRect
  cx: number
  cz: number
  p: Palette
  master?: boolean
}) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  const bw = Math.min(w * (master ? 0.6 : 0.56), master ? 2.2 : 1.8)
  const bd = Math.min(d * 0.58, 2.1)
  return (
    <group>
      <mesh position={[x, 0.015, z + d * 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.66, d * 0.5]} />
        <meshStandardMaterial color={p.fabric} roughness={1} />
      </mesh>
      <group position={[x, 0, z - d * 0.02]}>
        <B p={[0, 0.24, 0]} s={[bw, 0.3, bd]} c={p.wood} rough={0.6} />
        <B p={[0, 0.44, 0]} s={[bw + 0.05, 0.18, bd]} c="#f1ece1" rough={0.95} />
        <B p={[0, 0.55, 0.1]} s={[bw + 0.08, 0.08, bd * 0.72]} c={p.fabric} rough={1} />
        <B p={[-bw * 0.24, 0.58, -bd * 0.28]} s={[bw * 0.34, 0.14, 0.38]} c="#fffaf1" rough={0.95} />
        <B p={[bw * 0.24, 0.58, -bd * 0.28]} s={[bw * 0.34, 0.14, 0.38]} c="#fffaf1" rough={0.95} />
        <B p={[0, 0.65, -bd / 2 - 0.03]} s={[bw + 0.2, 0.9, 0.08]} c={p.wood} rough={0.7} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[x + side * (bw / 2 + 0.32), 0, z - d * 0.02]}>
          <B p={[0, 0.26, 0]} s={[0.42, 0.52, 0.42]} c={p.wood} rough={0.6} />
          <Lamp p={[0, 0.65, 0]} c={p.light} />
        </group>
      ))}
      <Art p={[x, 0.82, z - d / 2 + 0.06]} s={[0.75, 0.5]} c={p.fabric} />
      <Plant p={[x + w * 0.34, 0, z + d * 0.3]} s={0.8} />
    </group>
  )
}

function Bath({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  return (
    <group>
      <B p={[x, 0.03, z]} s={[w - 0.1, 0.06, d - 0.1]} c={SHELL.wet} rough={0.4} />
      <B p={[x, 0.3, z - d * 0.22]} s={[Math.min(w * 0.63, 1.5), 0.58, Math.min(d * 0.4, 0.85)]} c="#f7f4ed" rough={0.25} />
      <B p={[x, 0.54, z - d * 0.22]} s={[Math.min(w * 0.5, 1.2), 0.06, Math.min(d * 0.3, 0.62)]} c="#b9d2cf" rough={0.12} metal={0.2} />
      <B p={[x, 0.42, z + d * 0.32]} s={[Math.min(w * 0.62, 1.4), 0.82, 0.42]} c={p.wood} rough={0.5} />
      <B p={[x, 0.86, z + d * 0.32]} s={[Math.min(w * 0.58, 1.3), 0.05, 0.46]} c="#e1d6c6" rough={0.25} />
      <B p={[x, 1.0, z + d * 0.32]} s={[0.72, 0.56, 0.03]} c="#c4d0cc" rough={0.1} metal={0.7} />
      <mesh position={[x + w * 0.3, 0.8, z - d * 0.24]}>
        <boxGeometry args={[0.04, 1.15, 0.8]} />
        <meshStandardMaterial color={SHELL.glass} transparent opacity={0.24} roughness={0.05} metalness={0.3} />
      </mesh>
      <Lamp p={[x, 1.06, z - d * 0.04]} c={p.light} />
    </group>
  )
}

function Study({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  return (
    <group>
      <B p={[x, 0.72, z - d / 2 + 0.4]} s={[Math.min(w * 0.66, 1.6), 0.06, 0.62]} c={p.wood} rough={0.5} />
      <B p={[x - 0.6, 0.36, z - d / 2 + 0.4]} s={[0.06, 0.72, 0.52]} c="#6a5844" />
      <B p={[x + 0.6, 0.36, z - d / 2 + 0.4]} s={[0.06, 0.72, 0.52]} c="#6a5844" />
      <B p={[x, 0.86, z - d / 2 + 0.38]} s={[0.44, 0.28, 0.03]} c="#242521" rough={0.35} />
      <B p={[x, 0.44, z - d / 2 + 1.0]} s={[0.44, 0.46, 0.44]} c={p.fabric} />
      <B p={[x, 0.72, z - d / 2 + 1.18]} s={[0.44, 0.5, 0.06]} c={p.fabric} />
      <B p={[x + w * 0.32, 0.9, z - d / 2 + 0.16]} s={[0.4, 1.4, 0.3]} c={p.wood} rough={0.7} />
      <Lamp p={[x, 1.5, z - d / 2 + 0.4]} c={p.light} />
    </group>
  )
}

function Maid({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  return (
    <group>
      <B p={[x, 0.22, z]} s={[Math.min(w * 0.72, 1.2), 0.26, Math.min(d * 0.55, 1.7)]} c="#f0ebe1" rough={0.9} />
      <B p={[x, 0.38, z + 0.1]} s={[Math.min(w * 0.7, 1.16), 0.08, Math.min(d * 0.4, 1.2)]} c={p.fabric} rough={1} />
      <B p={[x, 0.5, z - Math.min(d * 0.28, 0.85)]} s={[Math.min(w * 0.72, 1.2), 0.08, 0.05]} c={p.wood} />
      <B p={[x - w * 0.28, 0.7, z - d * 0.3]} s={[0.36, 1.4, 0.4]} c={p.wood} rough={0.65} />
    </group>
  )
}

function Hall({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  return (
    <group>
      <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[Math.min(w * 0.5, 1.4), d * 0.8]} />
        <meshStandardMaterial color={p.fabric} roughness={1} />
      </mesh>
      <B p={[x, 0.4, z - d / 2 + 0.22]} s={[Math.min(w * 0.6, 1.2), 0.78, 0.32]} c={p.wood} rough={0.55} />
      <B p={[x, 0.98, z - d / 2 + 0.08]} s={[0.62, 0.8, 0.03]} c="#bfcac6" metal={0.7} rough={0.1} />
      <Plant p={[x + w * 0.3, 0, z - d * 0.34]} s={0.65} />
    </group>
  )
}

function Balcony({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  const { x, z, w, d } = roomFrame(room, cx, cz)
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[x + side * w * 0.22, 0, z * 0 + z]}>
          <B p={[0, 0.22, 0]} s={[0.44, 0.2, 0.44]} c={p.wood} rough={0.7} />
          <B p={[0, 0.5, -0.16]} s={[0.44, 0.46, 0.06]} c={p.wood} rough={0.7} />
        </group>
      ))}
      <Cyl p={[x, 0.28, z]} r={0.24} h={0.5} c={p.wood} rough={0.55} />
      <Plant p={[x - w * 0.32, 0, z - d * 0.2]} s={0.75} />
    </group>
  )
}

function Furnishing({ room, cx, cz, p }: { room: RoomRect; cx: number; cz: number; p: Palette }) {
  switch (room.kind) {
    case 'living':
    case 'family':
      return <Living room={room} cx={cx} cz={cz} p={p} dining={room.kind === 'living'} />
    case 'dining':
      return <Dining room={room} cx={cx} cz={cz} p={p} />
    case 'kitchen':
      return <Kitchen room={room} cx={cx} cz={cz} p={p} />
    case 'bed':
      return <Bedroom room={room} cx={cx} cz={cz} p={p} master={room.key === 'master'} />
    case 'bath':
      return <Bath room={room} cx={cx} cz={cz} p={p} />
    case 'study':
      return <Study room={room} cx={cx} cz={cz} p={p} />
    case 'maid':
      return <Maid room={room} cx={cx} cz={cz} p={p} />
    case 'hall':
      return <Hall room={room} cx={cx} cz={cz} p={p} />
    case 'balcony':
    case 'terrace':
      return <Balcony room={room} cx={cx} cz={cz} p={p} />
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/*  flat shell                                                         */
/* ------------------------------------------------------------------ */
function Interior({
  flat,
  furnished,
  idea,
  onRoom,
}: {
  flat: Flat
  furnished: boolean
  idea: DecorIdea
  onRoom: (key: string | null) => void
}) {
  const palette: Palette = furnished
    ? { wall: idea.wall, floor: idea.floor, fabric: idea.fabric, wood: idea.wood, light: idea.light }
    : { ...SHELL, wall: SHELL.wall, floor: SHELL.floor, fabric: SHELL.fabric, wood: SHELL.wood, light: SHELL.light }

  const { cx, cz, w, d } = useMemo(() => {
    const xs = flat.type.rooms.map((r) => r.x)
    const ys = flat.type.rooms.map((r) => r.y)
    const right = Math.max(...flat.type.rooms.map((r) => r.x + r.w))
    const bottom = Math.max(...flat.type.rooms.map((r) => r.y + r.h))
    return {
      cx: (Math.min(...xs) + right) / 2,
      cz: (Math.min(...ys) + bottom) / 2,
      w: (right - Math.min(...xs)) / S,
      d: (bottom - Math.min(...ys)) / S,
    }
  }, [flat])

  return (
    <group position={[0, 0, 0]}>
      {/* base slab */}
      <B p={[0, -0.12, 0]} s={[w + 0.3, 0.22, d + 0.3]} c="#b9a98f" rough={0.9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[w + 0.2, d + 0.2]} />
        <meshStandardMaterial color={palette.floor} roughness={0.85} />
      </mesh>

      {flat.type.rooms.map((room) => {
        const f = roomFrame(room, cx, cz)
        return (
          <group key={room.key}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[f.x, 0.012, f.z]}
              receiveShadow
              onPointerOver={(e) => {
                e.stopPropagation()
                onRoom(room.key)
              }}
              onPointerOut={() => onRoom(null)}
            >
              <planeGeometry args={[Math.max(0.1, f.w - 0.09), Math.max(0.1, f.d - 0.09)]} />
              <meshStandardMaterial
                color={room.kind === 'bath' ? SHELL.wet : palette.floor}
                roughness={0.8}
              />
            </mesh>
            <Railings room={room} cx={cx} cz={cz} />
            {furnished ? <Furnishing room={room} cx={cx} cz={cz} p={palette} /> : null}
          </group>
        )
      })}

      {/* one set of walls only — no overlapping faces, no z-fighting */}
      <WallRun walls={flat.type.walls} cx={cx} cz={cz} colour={palette.wall} />
      <Glazing panes={flat.type.glazing} cx={cx} cz={cz} />

      {/* label anchors — same floating labels in furnished and shell mode */}
      {flat.type.rooms.map((room) => {
        const f = roomFrame(room, cx, cz)
        return (
          <Html
            key={`lbl-${room.key}`}
            position={[f.x, furnished ? 1.15 : 0.62, f.z]}
            center
            zIndexRange={[8, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="whitespace-nowrap border border-ink/20 bg-paper/95 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-ink/80 backdrop-blur-sm"
              style={{ fontFamily: 'Jost, sans-serif' }}
            >
              {room.label}
            </div>
          </Html>
        )
      })}
    </group>
  )
}

function FitCamera({ flat }: { flat: Flat }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const xs = flat.type.rooms.map((r) => r.x)
    const ys = flat.type.rooms.map((r) => r.y)
    const right = Math.max(...flat.type.rooms.map((r) => r.x + r.w))
    const bottom = Math.max(...flat.type.rooms.map((r) => r.y + r.h))
    const w = (right - Math.min(...xs)) / S
    const d = (bottom - Math.min(...ys)) / S
    const aspect = size.width / Math.max(1, size.height)
    const portrait = aspect < 0.85
    const fov = portrait ? 44 : 38
    // match the 2D plate: balcony at the top, kitchen on the right —
    // so the camera sits on the balcony (north) side, not the far side
    const dir = portrait
      ? new THREE.Vector3(0.46, 1.0, -0.5).normalize()
      : new THREE.Vector3(0.55, 0.78, -0.56).normalize()

    // project the flat's bounding box and find the nearest distance that fits
    const probe = new THREE.PerspectiveCamera(fov, aspect, 0.1, 400)
    const corners: THREE.Vector3[] = []
    for (const sx of [-w / 2, w / 2]) {
      for (const sz of [-d / 2, d / 2]) {
        for (const sy of [0, 1.16]) corners.push(new THREE.Vector3(sx, sy, sz))
      }
    }
    const fits = (dist: number) => {
      probe.position.copy(dir).multiplyScalar(dist)
      probe.lookAt(0, 0.4, 0)
      probe.updateMatrixWorld()
      probe.updateProjectionMatrix()
      return corners.every((corner) => {
        const p = corner.clone().project(probe)
        return Math.abs(p.x) <= 0.9 && Math.abs(p.y) <= 0.86
      })
    }
    const radius = Math.sqrt(w * w + d * d) / 2
    let lo = radius
    let hi = radius * 9
    for (let i = 0; i < 26; i += 1) {
      const mid = (lo + hi) / 2
      if (fits(mid)) hi = mid
      else lo = mid
    }
    camera.position.copy(dir).multiplyScalar(hi)
    camera.lookAt(0, 0.4, 0)
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = fov
    cam.near = 0.1
    cam.far = 200
    cam.updateProjectionMatrix()
  }, [camera, flat, size.width, size.height])
  return null
}

/* ------------------------------------------------------------------ */
/*  viewer                                                             */
/* ------------------------------------------------------------------ */
/* walls pop out of the 2D plate when the 3D view is grown in place */
function Rise({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = Math.min(1, state.clock.elapsedTime / 1.35)
    const k = THREE.MathUtils.smoothstep(t, 0, 1)
    ref.current.scale.y = 0.02 + 0.98 * k
    ref.current.position.y = (1 - k) * -0.35
  })
  return <group ref={ref}>{children}</group>
}

export default function FlatViewer({
  flat,
  level,
  embedded = false,
  onBack,
  onContinue,
}: {
  flat: Flat
  level: number
  embedded?: boolean
  onBack: () => void
  onContinue: () => void
}) {
  const [furnished, setFurnished] = useState(true)
  const [ideaIndex, setIdeaIndex] = useState(0)
  const [decorOpen, setDecorOpen] = useState(false)
  const [room, setRoom] = useState<string | null>(null)
  const idea = DECOR_IDEAS[ideaIndex]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (decorOpen) setDecorOpen(false)
        else onBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decorOpen, onBack])

  const toggle = (next: boolean) => {
    setFurnished(next)
    setRoom(null)
    if (!next) setDecorOpen(false)
  }

  return (
    <motion.div
      initial={embedded ? { opacity: 0, scale: 0.92, y: 28 } : { opacity: 0 }}
      animate={embedded ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={
        embedded
          ? 'absolute inset-0 overflow-hidden bg-[#101812] text-bone'
          : 'fixed inset-0 z-[140] overflow-hidden bg-[#101812] text-bone'
      }
      data-lenis-prevent
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,#314036_0%,#131d16_56%,#0a110c_100%)]" />

      <div className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 1.7]}
          camera={{ position: [9, 11, 12], fov: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
            gl.setClearColor(0x000000, 0)
          }}
        >
          <Suspense fallback={null}>
            <FitCamera flat={flat} />
            <ambientLight intensity={furnished ? 0.55 : 1.05} color={furnished ? '#f3e2c8' : '#f5f2ea'} />
            <hemisphereLight
              intensity={furnished ? 0.5 : 0.9}
              color={furnished ? '#f0ddc4' : '#ffffff'}
              groundColor={furnished ? '#5b4a37' : '#b9b0a1'}
            />
            <directionalLight
              position={[9, 16, 10]}
              intensity={furnished ? 2.1 : 2.8}
              color={furnished ? '#ffd4a0' : '#fff7ea'}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-12}
              shadow-camera-right={12}
              shadow-camera-top={12}
              shadow-camera-bottom={-12}
              shadow-bias={-0.0005}
            />
            <directionalLight
              position={[-10, 8, -9]}
              intensity={furnished ? 0.5 : 0.8}
              color={furnished ? '#7d9ab1' : '#dbe6ec'}
            />
            <Rise>
              <Interior flat={flat} furnished={furnished} idea={idea} onRoom={setRoom} />
            </Rise>
            <ContactShadows
              position={[0, -0.26, 0]}
              opacity={0.5}
              scale={34}
              blur={2.6}
              far={7}
              color="#050906"
            />
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              dampingFactor={0.075}
              minDistance={6}
              maxDistance={70}
              minPolarAngle={0.12}
              maxPolarAngle={1.42}
              target={[0, 0.55, 0]}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* grade */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(5,9,6,0.66)_100%)]" />

      {/* header — page already carries its own, so hide when grown in place */}
      {!embedded && (
      <div className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-[var(--gutter)] pt-6 md:pt-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 text-[0.64rem] uppercase tracking-[0.24em] text-bone/80 transition-colors hover:text-bone"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full border border-bone/25 transition-colors group-hover:border-bone/60">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          </span>
          <span className="hidden sm:inline">Back to 2D</span>
        </button>

        <div className="text-center">
          <div className="text-[0.56rem] uppercase tracking-[0.24em] text-bone/80">
            The residence · {flat.type.code}
          </div>
          <div className="mt-1 font-display text-2xl leading-none text-bone md:text-3xl">
            {flat.number}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="flex items-center gap-3 text-[0.64rem] uppercase tracking-[0.24em] text-bone/80 transition-colors hover:text-bone"
        >
          <span className="hidden sm:inline">Continue to site</span>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-bone/25">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          </span>
        </button>
      </div>
      )}

      {/* mode */}
      {!embedded && (
      <div className="pointer-events-none absolute left-[var(--gutter)] top-24 z-20 md:top-28">
        <div className="flex items-center gap-3">
          <span className={`h-1.5 w-1.5 rounded-full ${furnished ? 'bg-clay' : 'bg-bone/40'}`} />
          <span className="text-[0.64rem] uppercase tracking-[0.24em] text-bone/80">
            {furnished ? `Furnished · ${idea.name}` : 'Unfurnished · white shell'}
          </span>
        </div>
        <div className="mt-2 text-[0.56rem] uppercase tracking-[0.2em] text-bone/75">
          {furnished ? 'Sixteen decor directions for this home' : 'Drag to orbit · scroll or pinch to zoom'}
        </div>
      </div>
      )}

      {/* room tag */}
      <AnimatePresence>
        {room ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-40 left-1/2 z-30 -translate-x-1/2 border border-bone/15 bg-forest-deep/90 px-5 py-3 text-center backdrop-blur md:bottom-32"
          >
            <div className="font-display text-xl leading-none">
              {flat.type.rooms.find((r) => r.key === room)?.name}
            </div>
            <div className="mt-1 text-[0.56rem] uppercase tracking-[0.2em] text-bone/65">
              {flat.type.rooms.find((r) => r.key === room)?.dims}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* footer controls */}
      {embedded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#060a07]/85 to-transparent" />
      )}
      <div
        className={`pointer-events-auto absolute inset-x-0 bottom-0 z-20 ${
          embedded ? 'px-3 pb-3' : 'px-[var(--gutter)] pb-5 md:pb-7'
        }`}
      >
        <div className={`flex flex-wrap items-end gap-2 ${embedded ? 'gap-1.5' : 'justify-between gap-4'}`}>
          <div className={`flex flex-wrap items-center ${embedded ? 'gap-1.5' : 'gap-2'}`}>
            <button
              onClick={() => toggle(false)}
              className={`border whitespace-nowrap uppercase transition-all duration-300 ${
                embedded
                  ? 'px-3 py-2 text-[0.52rem] tracking-[0.14em]'
                  : 'px-5 py-3.5 text-[0.62rem] tracking-[0.2em]'
              } ${
                !furnished
                  ? 'border-bone bg-bone text-ink'
                  : 'border-bone/35 bg-[#060a07]/40 text-bone/85 hover:border-bone/70 hover:text-bone'
              }`}
            >
              Unfurnished
            </button>
            <button
              onClick={() => toggle(true)}
              className={`border whitespace-nowrap uppercase transition-all duration-300 ${
                embedded
                  ? 'px-3 py-2 text-[0.52rem] tracking-[0.14em]'
                  : 'px-5 py-3.5 text-[0.62rem] tracking-[0.2em]'
              } ${
                furnished
                  ? 'border-bone bg-bone text-ink'
                  : 'border-bone/35 bg-[#060a07]/40 text-bone/85 hover:border-bone/70 hover:text-bone'
              }`}
            >
              Furnished
            </button>
            <button
              onClick={() => setDecorOpen(true)}
              className={`border whitespace-nowrap uppercase transition-colors hover:bg-clay hover:text-bone ${
                embedded
                  ? 'border-clay/70 bg-[#060a07]/40 px-3 py-2 text-[0.52rem] tracking-[0.14em] text-clay'
                  : 'border-clay/70 px-5 py-3.5 text-[0.62rem] tracking-[0.2em] text-clay'
              }`}
            >
              Home decor · 16
            </button>
          </div>

          {!embedded && (
          <div className="flex items-center gap-3">
            <button
              onClick={onContinue}
              className="bg-bone px-6 py-3.5 text-[0.62rem] uppercase tracking-[0.2em] text-ink transition-colors hover:bg-clay hover:text-bone"
            >
              Continue to site
            </button>
          </div>
          )}
        </div>
      </div>

      {/* decor drawer */}
      <AnimatePresence>
        {decorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end bg-[#060a07]/60 backdrop-blur-sm md:items-center md:justify-center"
            onClick={() => setDecorOpen(false)}
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82svh] w-full overflow-y-auto border-t border-bone/10 bg-[#101812] px-[var(--gutter)] pb-8 pt-7 md:max-w-4xl md:border md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[0.56rem] uppercase tracking-[0.24em] text-bone/75">
                    Residence {flat.number} · decor
                  </div>
                  <h3 className="mt-2 font-display text-3xl leading-none md:text-4xl">
                    Sixteen ways to live here.
                  </h3>
                  <p className="mt-2 text-[0.78rem] font-light leading-relaxed text-bone/65">
                    Every palette below furnishes this same residence — the plan you are
                    standing in, on this floor.
                  </p>
                </div>
                <button
                  onClick={() => setDecorOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-bone/20 text-bone/80"
                  aria-label="Close decor ideas"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {DECOR_IDEAS.map((d, i) => (
                  <button
                    key={d.key}
                    onClick={() => {
                      setIdeaIndex(i)
                      setFurnished(true)
                      setDecorOpen(false)
                    }}
                    className={`group border p-4 text-left transition-all duration-300 ${
                      i === ideaIndex
                        ? 'border-clay bg-bone/[0.06]'
                        : 'border-bone/12 hover:border-bone/35'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[0.52rem] uppercase tracking-[0.22em] text-bone/75">
                          {flat.number} · {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="mt-1 font-display text-xl leading-none">{d.name}</div>
                      </div>
                      <div className="flex gap-1">
                        {d.palette.map((c) => (
                          <span key={c} className="h-4 w-4 rounded-full border border-bone/20" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-[0.74rem] font-light leading-relaxed text-bone/80">
                      {d.note}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[0.52rem] uppercase tracking-[0.18em]">
                      <span className="text-bone/75">{d.floor} · {d.wall} · {d.wood}</span>
                      <span className={i === ideaIndex ? 'text-clay' : 'text-bone/70'}>
                        {i === ideaIndex ? 'Applied' : 'Apply'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
