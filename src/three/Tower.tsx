import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { MotionValue } from 'framer-motion'

const MODEL = '/models/asterion.glb'
const FLOOR_HEIGHT = 3.45
const TOWER_BASE = 13.35

useGLTF.preload(MODEL)

/* ------------------------------------------------------------------ */
/*  material styling                                                   */
/* ------------------------------------------------------------------ */
type MatSpec = {
  color?: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
  envMapIntensity?: number
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
}

const MATS: Record<string, MatSpec> = {
  Glass: {
    color: '#7e8b87',
    roughness: 0.16,
    metalness: 0.42,
    envMapIntensity: 1.3,
    emissive: '#33403c',
    emissiveIntensity: 0.45,
  },
  GlassWarm: {
    color: '#9a896c',
    roughness: 0.22,
    metalness: 0.34,
    envMapIntensity: 1.15,
    emissive: '#3a2c1d',
    emissiveIntensity: 0.4,
  },
  GlassRailing: {
    color: '#a9bcb7',
    roughness: 0.1,
    metalness: 0.5,
    transparent: true,
    opacity: 0.24,
    envMapIntensity: 1.6,
  },
  WindowLit: {
    color: '#4a3826',
    emissive: '#ffb168',
    emissiveIntensity: 1.3,
    roughness: 0.35,
  },
  WarmLight: { color: '#ffd6a4', emissive: '#ffc281', emissiveIntensity: 2.4, roughness: 0.5 },
  SoftLight: { color: '#ffe6c4', emissive: '#ffd2a1', emissiveIntensity: 1.1, roughness: 0.6 },
  Water: { color: '#21413e', roughness: 0.05, metalness: 0.3, envMapIntensity: 2 },
  Foliage: { color: '#445333', roughness: 0.9 },
  FoliageLight: { color: '#5f6e45', roughness: 0.9 },
  Trunk: { color: '#574433', roughness: 0.95 },
  Bronze: { color: '#96724a', metalness: 0.9, roughness: 0.3, envMapIntensity: 1.6 },
  BronzeLight: { color: '#b89263', metalness: 0.9, roughness: 0.26, envMapIntensity: 1.8 },
  Stone: { color: '#d2c5b0', roughness: 0.7 },
  StoneLight: { color: '#e6dccb', roughness: 0.66 },
  StoneDark: { color: '#9c8f7c', roughness: 0.78 },
  Paving: { color: '#c2b29a', roughness: 0.9 },
  DarkInterior: { color: '#2b302a', roughness: 0.88 },
}

function tuneMaterial(src: THREE.Material): THREE.Material {
  const m = src.clone() as THREE.MeshStandardMaterial
  const spec = MATS[src.name]
  if (spec && 'isMeshStandardMaterial' in m) {
    if (spec.color) m.color.set(spec.color)
    if (spec.roughness !== undefined) m.roughness = spec.roughness
    if (spec.metalness !== undefined) m.metalness = spec.metalness
    if (spec.emissive) m.emissive.set(spec.emissive)
    if (spec.emissiveIntensity !== undefined)
      m.emissiveIntensity = spec.emissiveIntensity
    if (spec.envMapIntensity !== undefined)
      m.envMapIntensity = spec.envMapIntensity
    if (spec.transparent) {
      m.transparent = true
      m.opacity = spec.opacity ?? 0.3
      m.depthWrite = false
    }
    m.needsUpdate = true
  }
  return m
}

/* ------------------------------------------------------------------ */
/*  merge helpers                                                      */
/* ------------------------------------------------------------------ */
function mergeNode(node: THREE.Object3D): THREE.Group {
  node.updateWorldMatrix(true, true)
  const group = new THREE.Group()
  group.name = node.name
  const inv = new THREE.Matrix4().copy(node.matrixWorld).invert()
  const buckets = new Map<
    string,
    { material: THREE.Material; geos: THREE.BufferGeometry[] }
  >()
  const materials = new Map<string, THREE.Material>()

  node.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const sourceMat = mesh.material as THREE.Material
    let tuned = materials.get(sourceMat.uuid)
    if (!tuned) {
      tuned = tuneMaterial(sourceMat)
      materials.set(sourceMat.uuid, tuned)
    }
    const bucket = buckets.get(tuned.uuid)
    let geo = mesh.geometry.clone()
    if (geo.index) {
      const flat = geo.toNonIndexed()
      geo.dispose()
      geo = flat
    }
    const local = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld)
    geo.applyMatrix4(local)
    const norm = geo.attributes.normal
    if (!norm) geo.computeVertexNormals()
    if (bucket) bucket.geos.push(geo)
    else buckets.set(tuned.uuid, { material: tuned, geos: [geo] })
  })

  buckets.forEach((b) => {
    // normalise vertex attributes so merges never fail
    const common = new Set(['position', 'normal', 'uv'])
    b.geos.forEach((g) => {
      Object.keys(g.attributes).forEach((k) => {
        if (!common.has(k)) g.deleteAttribute(k)
      })
    })
    const hasUv = b.geos.every((g) => !!g.attributes.uv)
    if (!hasUv) b.geos.forEach((g) => g.deleteAttribute('uv'))
    const merged =
      b.geos.length > 1
        ? mergeGeometries(b.geos, false)
        : b.geos[0].clone()
    b.geos.forEach((g) => g.dispose())
    if (!merged) return
    const mesh = new THREE.Mesh(merged, b.material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  })
  return group
}

function collectMeshes(obj: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = []
  obj.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) out.push(m)
  })
  return out
}

/* ------------------------------------------------------------------ */
/*  parts                                                              */
/* ------------------------------------------------------------------ */
export type TowerParts = {
  root: THREE.Group
  podium: THREE.Group
  floors: THREE.Group[]
  crown: THREE.Group
  palms: THREE.Group[]
  dispose: () => void
}

export function useTowerParts(): TowerParts {
  const { scene } = useGLTF(MODEL)

  return useMemo(() => {
    const source = scene.clone(true)
    source.updateMatrixWorld(true)

    const towerNode = source.getObjectByName('TOWER')
    const podiumNode = source.getObjectByName('PODIUM')
    if (!towerNode || !podiumNode) throw new Error('Tower parts missing')

    const root = new THREE.Group()
    root.name = 'Asterion'

    const podium = mergeNode(podiumNode)
    root.add(podium)

    const towerRoot = new THREE.Group()
    towerRoot.position.copy(towerNode.position)
    towerRoot.quaternion.copy(towerNode.quaternion)
    towerRoot.scale.copy(towerNode.scale)
    root.add(towerRoot)

    /* Each GLB floor's *geometry mass* is off-axis: balconies, railings
       and reveal plates stick out unevenly, so the bounding-box centre
       swings ±2 units left/right between floors and the stack reads as
       a zigzag. The structural footprint is the floor slab
       (`L##_slab`, crown: `crown_slab`) — its centre (and the glass
       centre, which matches it exactly) sits within ±0.5 X / ±0.9 Z on
       every floor. Align each floor on that centre, measured in the
       floor node's own local frame *before* the merge, and the tower
       piles up dead vertical. Y (pitch,3.45) is exact and untouched. */
    const slabCenter = (node: THREE.Object3D): THREE.Vector3 => {
      const key = node.name === 'CROWN' ? 'crown_slab' : `${node.name}_slab`
      const slab =
        node.getObjectByName(key) ?? node.getObjectByName(`${node.name}_core`)
      if (!slab) return new THREE.Vector3()
      const box = new THREE.Box3().setFromObject(slab)
      if (!Number.isFinite(box.min.x)) return new THREE.Vector3()
      return box
        .getCenter(new THREE.Vector3())
        .applyMatrix4(new THREE.Matrix4().copy(node.matrixWorld).invert())
    }

    const centerOnAxis = (g: THREE.Group, node: THREE.Object3D) => {
      const c = slabCenter(node)
      g.position.x -= c.x
      g.position.z -= c.z
    }

    const floors: THREE.Group[] = []
    let crown: THREE.Group | null = null
    towerNode.children.forEach((child) => {
      if (child.name.startsWith('L') && /^L\d\d$/.test(child.name)) {
        const g = mergeNode(child)
        g.position.copy(child.position)
        g.userData.baseY = child.position.y
        centerOnAxis(g, child)
        // overlapping slabs hide the dark glass line between floors
        g.scale.y = 1.06
        floors.push(g)
        towerRoot.add(g)
      } else if (child.name === 'CROWN') {
        crown = mergeNode(child)
        crown.position.copy(child.position)
        crown.userData.baseY = child.position.y
        centerOnAxis(crown, child)
        towerRoot.add(crown)
      }
    })
    floors.sort((a, b) => a.userData.baseY - b.userData.baseY)

    const palms: THREE.Group[] = []
    source.children.forEach((child) => {
      if (child === towerNode || child === podiumNode) return
      if (!child.name) return
      const g = mergeNode(child)
      g.position.copy(child.position)
      g.quaternion.copy(child.quaternion)
      g.scale.copy(child.scale)
      g.userData.homeScale = child.scale.clone()
      palms.push(g)
      root.add(g)
    })

    const dispose = () => {
      root.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => m?.dispose())
      })
      void collectMeshes(root)
    }

    return { root, podium, floors, crown: crown!, palms, dispose }
  }, [scene])
}

/* ------------------------------------------------------------------ */
/*  environment + light                                                */
/* ------------------------------------------------------------------ */
export function TowerEnvironment({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <ambientLight intensity={dark ? 0.32 : 0.78} color={dark ? '#9db4bd' : '#e9e3d6'} />
      <hemisphereLight
        intensity={dark ? 0.35 : 0.62}
        color={dark ? '#2b3d40' : '#f3ead9'}
        groundColor={dark ? '#070b08' : '#a89b87'}
      />
      <directionalLight
        position={[38, 62, 34]}
        intensity={dark ? 2.1 : 2.8}
        color={dark ? '#ffb877' : '#ffd7ae'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={90}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0004}
      />
      <directionalLight
        position={[-46, 24, -38]}
        intensity={dark ? 1.1 : 0.85}
        color={dark ? '#7f9fb8' : '#a9becd'}
      />
      <directionalLight
        position={[12, 34, 92]}
        intensity={dark ? 0.5 : 0.62}
        color={dark ? '#9db6c7' : '#dce8ec'}
      />
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={dark ? 3.2 : 2.2}
          position={[0, 46, -62]}
          scale={[90, 34, 1]}
          color="#ffd3a4"
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-70, 20, 22]}
          rotation-y={Math.PI / 2}
          scale={[60, 50, 1]}
          color="#93aec4"
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[60, 16, 40]}
          rotation-y={-Math.PI / 2}
          scale={[60, 40, 1]}
          color="#f3c99b"
        />
        <Lightformer
          form="ring"
          intensity={1.4}
          position={[6, 80, 10]}
          scale={30}
          color="#fff1d8"
        />
      </Environment>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  ground shadow disc                                                 */
/* ------------------------------------------------------------------ */
export function GroundShadow({ dark = false }: { dark?: boolean }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 128)
    grad.addColorStop(0, 'rgba(0,0,0,0.55)')
    grad.addColorStop(0.45, 'rgba(0,0,0,0.25)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return t
  }, [])

  const ground = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')!
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 256)
    grad.addColorStop(0, 'rgba(196,178,150,0.92)')
    grad.addColorStop(0.3, 'rgba(201,184,158,0.78)')
    grad.addColorStop(0.56, 'rgba(207,191,167,0.42)')
    grad.addColorStop(0.78, 'rgba(210,196,175,0.15)')
    grad.addColorStop(1, 'rgba(210,196,175,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <>
      {!dark && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
          <planeGeometry args={[178, 178]} />
          <meshBasicMaterial
            map={ground}
            transparent
            depthWrite={false}
            opacity={0.92}
          />
        </mesh>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          color={dark ? '#000000' : '#4b4234'}
          opacity={dark ? 0.9 : 0.5}
        />
      </mesh>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  camera rig                                                         */
/* ------------------------------------------------------------------ */
function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

export function AssemblyRig({ progress }: { progress: MotionValue<number> }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0, 26, 0))
  const target = useRef(new THREE.Vector3(0, 26, 0))
  const pos = useRef(new THREE.Vector3(54, 30, 140))

  useFrame((state, dt) => {
    const p = progress.get()
    const narrow = size.width / Math.max(size.height, 1) < 1
    const dist = narrow ? 215 : 190
    const px = 30 + state.pointer.x * 5
    const py = 20 + p * 9 + state.pointer.y * 3
    const pz = dist - p * 12
    target.current.set(0, 24 + p * 9, 0)
    pos.current.set(px, py, pz)
    camera.position.x = damp(camera.position.x, pos.current.x, 4, dt)
    camera.position.y = damp(camera.position.y, pos.current.y, 4, dt)
    camera.position.z = damp(camera.position.z, pos.current.z, 4, dt)
    look.current.x = damp(look.current.x, target.current.x, 4, dt)
    look.current.y = damp(look.current.y, target.current.y, 4, dt)
    look.current.z = damp(look.current.z, target.current.z, 4, dt)
    camera.lookAt(look.current)
  })
  return null
}

export function ExploreRig({ focus }: { focus: MotionValue<number> }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0, 31, 0))
  const target = useRef(new THREE.Vector3(0, 31, 0))

  useFrame((state, dt) => {
    const narrow = size.width / Math.max(size.height, 1) < 0.95
    const fy = focus.get()
    const dist = narrow ? 205 : 132
    camera.position.x = damp(
      camera.position.x,
      dist * 0.42 + state.pointer.x * 4,
      3.6,
      dt
    )
    camera.position.y = damp(
      camera.position.y,
      Math.min(80, Math.max(22, 30 + fy * 0.62)) + state.pointer.y * 2,
      3.6,
      dt
    )
    camera.position.z = damp(camera.position.z, dist, 3.6, dt)
    target.current.set(0, 30 + fy * 0.35, 0)
    look.current.lerp(target.current, 1 - Math.exp(-3.6 * dt))
    camera.lookAt(look.current)
  })
  return null
}

/* ------------------------------------------------------------------ */
/*  level band                                                         */
/* ------------------------------------------------------------------ */
export function LevelBand({
  level,
  active,
}: {
  level: number
  active: boolean
}) {
  const y = TOWER_BASE + (level - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.42
  const geo = useMemo(() => new THREE.BoxGeometry(20.6, 0.12, 15.8), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo])
  const glow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 64, 8, 128, 64, 128)
    g.addColorStop(0, 'rgba(255,204,148,0.95)')
    g.addColorStop(0.35, 'rgba(238,171,107,0.4)')
    g.addColorStop(1, 'rgba(238,171,107,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  const ref = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.SpriteMaterial>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const s = active ? 1 + Math.sin(t * 2.1) * 0.008 : 1
    ref.current.scale.setScalar(s)
    if (mat.current) mat.current.opacity = active ? 0.09 + Math.sin(t * 2.1) * 0.02 : 0.03
    if (halo.current) halo.current.opacity = active ? 0.42 + Math.sin(t * 1.7) * 0.08 : 0
  })

  return (
    <group ref={ref} position={[0, y, 0]}>
      <sprite scale={[36, 11, 1]}>
        <spriteMaterial
          ref={halo}
          map={glow}
          transparent
          opacity={0.4}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          color="#ffc58a"
        />
      </sprite>
      <mesh geometry={geo}>
        <meshBasicMaterial
          ref={mat}
          color="#f0c78e"
          transparent
          opacity={0.09}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color={active ? '#ffd7a4' : '#c8a97a'}
          transparent
          opacity={active ? 0.95 : 0.24}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  assembled scene pieces                                             */
/* ------------------------------------------------------------------ */
export function TowerBody({
  parts,
  mode,
  progress,
  level,
}: {
  parts: TowerParts
  mode: 'assemble' | 'explore'
  progress?: MotionValue<number>
  level?: number
}) {
  const smooth = useRef(0)

  useFrame((state, dt) => {
    if (mode === 'assemble' && progress) {
      smooth.current = damp(smooth.current, progress.get(), 5, dt)
      const p = smooth.current
      const podiumK = THREE.MathUtils.smoothstep(p, 0.01, 0.2)
      parts.podium.scale.y = 0.02 + 0.98 * podiumK
      parts.podium.position.y = -0.5 * (1 - podiumK)

      parts.floors.forEach((f, i) => {
        const start = 0.035 + i * 0.052
        const k = THREE.MathUtils.smoothstep(p, start, start + 0.19)
        f.visible = k > 0.002
        f.position.y = f.userData.baseY
        f.scale.set(1, 0.002 + 0.998 * k, 1)
      })

      const crownStart = 0.87
      const ck = THREE.MathUtils.smoothstep(p, crownStart, crownStart + 0.13)
      parts.crown.visible = p > 0.845
      parts.crown.position.y = parts.crown.userData.baseY + (1 - ck) * 24
      parts.crown.scale.set(0.94 + 0.06 * ck, 0.85 + 0.15 * ck, 0.94 + 0.06 * ck)

      parts.root.rotation.y = -0.22 + p * 0.42 + Math.sin(state.clock.elapsedTime * 0.08) * 0.03
    } else {
      parts.root.rotation.y = -0.32
    }
  })

  /* lift the active floor with a warm emissive wash */
  useEffect(() => {
    if (mode !== 'explore' || !level) return
    parts.floors.forEach((floor, idx) => {
      const on = idx === level - 1
      floor.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        mats.forEach((raw) => {
          const m = raw as THREE.MeshStandardMaterial
          if (!m || !m.emissive) return
          if (!m.userData.__baseEmissive) {
            m.userData.__baseEmissive = m.emissive.clone()
            m.userData.__baseIntensity = m.emissiveIntensity ?? 0
          }
          if (on) {
            m.emissive.set('#ffa866')
            m.emissiveIntensity = Math.max(0.85, m.userData.__baseIntensity)
          } else {
            m.emissive.copy(m.userData.__baseEmissive)
            m.emissiveIntensity = m.userData.__baseIntensity
          }
        })
      })
    })
  }, [parts, mode, level])

  return (
    <group>
      <primitive object={parts.root} />
      {mode === 'explore' && level ? (
        <group rotation-y={-0.32}>
          <LevelBand key={level} level={level} active />
        </group>
      ) : null}
    </group>
  )
}

export function TowerFallback() {
  return null
}

export function TowerCamera({ mode }: { mode: 'assemble' | 'explore' }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(mode === 'assemble' ? 54 : 56, 30, 140)
  }, [camera, mode])
  return null
}

export { MODEL, FLOOR_HEIGHT, TOWER_BASE }
