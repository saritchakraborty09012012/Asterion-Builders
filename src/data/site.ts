export type PlanType = 'a' | 'b' | 'c' | 'd'

export type RoomKind =
  | 'living'
  | 'bed'
  | 'bath'
  | 'kitchen'
  | 'dining'
  | 'terrace'
  | 'hall'
  | 'study'
  | 'family'
  | 'pool'
  | 'core'
  | 'maid'
  | 'balcony'

export type RoomRect = {
  key: string
  name: string
  label: string
  x: number
  y: number
  w: number
  h: number
  kind: RoomKind
  dims: string
  note?: string
}

export type Hotspot = {
  key: string
  name: string
  label: string
  x: number
  y: number
  w: number
  h: number
  kind: RoomKind
  dims: string
}

export type WallSeg = { x1: number; z1: number; x2: number; z2: number }
export type GlazingSeg = WallSeg & { kind: 'window' | 'slider' | 'door' }
export type PlanCrop = { x: number; y: number; w: number; h: number }

export type FlatType = {
  key: PlanType
  code: string
  name: string
  short: string
  beds: string
  area: string
  balcony: string
  aspect: string
  basePrice: number
  plan: string
  planCrop: PlanCrop
  planAspect: number
  rooms: RoomRect[]
  hotspots: Hotspot[]
  walls: WallSeg[]
  glazing: GlazingSeg[]
}

export type Flat = {
  number: string
  type: FlatType
  price: string
}

export type Level = {
  level: number
  title: string
  label: string
  price: number
  flats: Flat[]
}

/* ------------------------------------------------------------------ */
/*  the four residences — one 2 BHK plan, mirrored around the core      */
/* ------------------------------------------------------------------ */

const W = 13.4 // overall width of one residence, in metres
const D = 10.2 // overall depth, in metres (balcony projects beyond)

/* the canonical type-A plan, drawn from the supplied 10th-floor plate */
const A_ROOMS: RoomRect[] = [
  { key: 'bed1', name: 'Bedroom 1', label: 'BEDROOM 01', x: 0, y: 0, w: 4.6, h: 4.0, kind: 'bed', dims: '4.2 × 3.7 M' },
  { key: 'bath1', name: 'Bathroom 1', label: 'BATH 01', x: 0, y: 4.0, w: 2.6, h: 2.0, kind: 'bath', dims: '2.0 × 1.8 M' },
  { key: 'bath2', name: 'Bathroom 2', label: 'BATH 02', x: 0, y: 6.0, w: 2.6, h: 2.2, kind: 'bath', dims: '2.0 × 2.2 M' },
  { key: 'utility', name: 'Utility', label: 'UTILITY', x: 0, y: 8.2, w: 2.6, h: 2.0, kind: 'hall', dims: '2.0 × 2.0 M' },
  { key: 'bed2', name: 'Bedroom 2', label: 'BEDROOM 02', x: 2.6, y: 4.2, w: 4.0, h: 6.0, kind: 'bed', dims: '3.6 × 4.0 M' },
  { key: 'living', name: 'Living Room', label: 'LIVING', x: 4.6, y: 0, w: 5.2, h: 4.2, kind: 'living', dims: '4.0 × 3.6 M' },
  { key: 'kitchen', name: 'Kitchen', label: 'KITCHEN', x: 9.8, y: 0, w: 3.6, h: 4.2, kind: 'kitchen', dims: '3.0 × 2.9 M' },
  { key: 'dining', name: 'Dining', label: 'DINING', x: 6.6, y: 4.2, w: 3.2, h: 4.2, kind: 'dining', dims: '3.2 × 3.2 M' },
  { key: 'hall', name: 'Hallway', label: 'HALL', x: 6.6, y: 8.4, w: 3.2, h: 1.8, kind: 'hall', dims: '3.2 × 1.8 M' },
  { key: 'entry', name: 'Entry Foyer', label: 'ENTRY', x: 9.8, y: 4.2, w: 3.6, h: 6.0, kind: 'hall', dims: '1.6 × 2.6 M' },
  { key: 'balcony', name: 'Balcony', label: 'BALCONY', x: 4.6, y: -1.5, w: 5.2, h: 1.5, kind: 'balcony', dims: '5.8 × 1.4 M' },
]

/* exterior + interior wall centre-lines, with real door and window gaps */
const A_WALLS: WallSeg[] = [
  /* north elevation — bedroom and kitchen windows, sliding doors to balcony */
  { x1: 0, z1: 0, x2: 0.9, z2: 0 },
  { x1: 3.7, z1: 0, x2: 4.6, z2: 0 },
  { x1: 9.8, z1: 0, x2: 10.7, z2: 0 },
  { x1: 12.6, z1: 0, x2: 13.4, z2: 0 },
  /* west elevation — bedroom and bathroom windows */
  { x1: 0, z1: 0, x2: 0, z2: 1.2 },
  { x1: 0, z1: 2.8, x2: 0, z2: 4.6 },
  { x1: 0, z1: 5.4, x2: 0, z2: 6.8 },
  { x1: 0, z1: 7.6, x2: 0, z2: 10.2 },
  /* south elevation — bedroom and dining windows */
  { x1: 0, z1: 10.2, x2: 3.8, z2: 10.2 },
  { x1: 5.6, z1: 10.2, x2: 10.9, z2: 10.2 },
  { x1: 12.5, z1: 10.2, x2: 13.4, z2: 10.2 },
  /* east elevation — kitchen window and the entrance door from the lobby */
  { x1: 13.4, z1: 0, x2: 13.4, z2: 1.0 },
  { x1: 13.4, z1: 2.4, x2: 13.4, z2: 8.1 },
  { x1: 13.4, z1: 9.3, x2: 13.4, z2: 10.2 },
  /* bedroom 1 */
  { x1: 4.6, z1: 0, x2: 4.6, z2: 2.5 },
  { x1: 4.6, z1: 3.5, x2: 4.6, z2: 4.2 },
  { x1: 0, z1: 4.0, x2: 2.6, z2: 4.0 },
  /* bedroom 2 */
  { x1: 2.6, z1: 4.2, x2: 5.5, z2: 4.2 },
  { x1: 2.6, z1: 4.2, x2: 2.6, z2: 4.8 },
  { x1: 2.6, z1: 5.6, x2: 2.6, z2: 6.8 },
  { x1: 2.6, z1: 7.6, x2: 2.6, z2: 8.8 },
  { x1: 2.6, z1: 9.5, x2: 2.6, z2: 10.2 },
  { x1: 6.6, z1: 4.2, x2: 6.6, z2: 4.7 },
  { x1: 6.6, z1: 5.6, x2: 6.6, z2: 10.2 },
  /* kitchen */
  { x1: 9.8, z1: 0, x2: 9.8, z2: 1.4 },
  { x1: 9.8, z1: 3.0, x2: 9.8, z2: 4.2 },
  { x1: 9.8, z1: 4.2, x2: 10.3, z2: 4.2 },
  { x1: 11.3, z1: 4.2, x2: 13.4, z2: 4.2 },
  { x1: 9.8, z1: 4.2, x2: 9.8, z2: 5.4 },
]

/* room hotspots, in the pixel space of the supplied ten-floor plate */
const A_HOTSPOTS: Hotspot[] = [
  { key: 'bed1', name: 'Bedroom 1', label: 'BEDROOM 01', x: 28, y: 52, w: 180, h: 170, kind: 'bed', dims: '4.2 × 3.7 M' },
  { key: 'balcony', name: 'Balcony', label: 'BALCONY', x: 290, y: 28, w: 225, h: 105, kind: 'balcony', dims: '5.8 × 1.4 M' },
  { key: 'kitchen', name: 'Kitchen', label: 'KITCHEN', x: 405, y: 132, w: 138, h: 95, kind: 'kitchen', dims: '3.0 × 2.9 M' },
  { key: 'living', name: 'Living Room', label: 'LIVING', x: 280, y: 138, w: 125, h: 128, kind: 'living', dims: '4.0 × 3.6 M' },
  { key: 'dining', name: 'Dining', label: 'DINING', x: 280, y: 268, w: 130, h: 88, kind: 'dining', dims: '3.2 × 3.2 M' },
  { key: 'bath1', name: 'Bathroom 1', label: 'BATH 01', x: 25, y: 222, w: 95, h: 68, kind: 'bath', dims: '2.0 × 1.8 M' },
  { key: 'bath2', name: 'Bathroom 2', label: 'BATH 02', x: 25, y: 298, w: 95, h: 80, kind: 'bath', dims: '2.0 × 2.2 M' },
  { key: 'bed2', name: 'Bedroom 2', label: 'BEDROOM 02', x: 142, y: 243, w: 145, h: 200, kind: 'bed', dims: '3.6 × 4.0 M' },
  { key: 'entry', name: 'Entry Foyer', label: 'ENTRY', x: 438, y: 278, w: 106, h: 158, kind: 'hall', dims: '1.6 × 2.6 M' },
]

/* window, slider and entrance zones, matching the gaps in the walls above */
const A_GLAZING: GlazingSeg[] = [
  { x1: 0.9, z1: 0, x2: 3.7, z2: 0, kind: 'window' },
  { x1: 4.6, z1: 0, x2: 9.8, z2: 0, kind: 'slider' },
  { x1: 10.7, z1: 0, x2: 12.6, z2: 0, kind: 'window' },
  { x1: 0, z1: 1.2, x2: 0, z2: 2.8, kind: 'window' },
  { x1: 0, z1: 4.6, x2: 0, z2: 5.4, kind: 'window' },
  { x1: 0, z1: 6.8, x2: 0, z2: 7.6, kind: 'window' },
  { x1: 3.8, z1: 10.2, x2: 5.6, z2: 10.2, kind: 'window' },
  { x1: 10.9, z1: 10.2, x2: 12.5, z2: 10.2, kind: 'window' },
  { x1: 13.4, z1: 1.0, x2: 13.4, z2: 2.4, kind: 'window' },
  { x1: 13.4, z1: 8.1, x2: 13.4, z2: 9.3, kind: 'door' },
]

const PLAN_CROPS: Record<PlanType, PlanCrop> = {
  a: { x: 8, y: 8, w: 544, h: 438 },
  b: { x: 984, y: 8, w: 544, h: 438 },
  c: { x: 8, y: 494, w: 544, h: 464 },
  d: { x: 984, y: 494, w: 544, h: 464 },
}

const PLAN_FILES: Record<PlanType, string> = {
  a: '/images/plans/flat-a.jpg',
  b: '/images/plans/flat-b.jpg',
  c: '/images/plans/flat-c.jpg',
  d: '/images/plans/flat-d.jpg',
}

function mirrorRoomX(room: RoomRect): RoomRect {
  return { ...room, x: W - room.x - room.w }
}
function mirrorRoomY(room: RoomRect): RoomRect {
  return { ...room, y: D - room.y - room.h }
}
function mirrorWallX(w: WallSeg): WallSeg {
  return { x1: W - w.x1, z1: w.z1, x2: W - w.x2, z2: w.z2 }
}
function mirrorWallY(w: WallSeg): WallSeg {
  return { x1: w.x1, z1: D - w.z1, x2: w.x2, z2: D - w.z2 }
}
function mirrorGlazingX(g: GlazingSeg): GlazingSeg {
  return { ...mirrorWallX(g), kind: g.kind }
}
function mirrorGlazingY(g: GlazingSeg): GlazingSeg {
  return { ...mirrorWallY(g), kind: g.kind }
}
function localHotspot(h: Hotspot, crop: PlanCrop, mx: boolean, mz: boolean): Hotspot {
  const x = mx ? 1536 - (h.x + h.w) : h.x
  const y = mz ? 971 - (h.y + h.h) : h.y
  return {
    ...h,
    x: Math.max(0, Math.min(1, (x - crop.x) / crop.w)),
    y: Math.max(0, Math.min(1, (y - crop.y) / crop.h)),
    w: Math.min(1, h.w / crop.w),
    h: Math.min(1, h.h / crop.h),
  }
}

type TypeDef = Pick<FlatType, 'key' | 'code' | 'name' | 'short' | 'beds' | 'area' | 'balcony' | 'aspect' | 'basePrice'>

const TYPE_DEFS: TypeDef[] = [
  { key: 'a', code: 'TYPE A', name: '2 BHK · Type A', short: 'Two-bedroom garden residence', beds: '2 Bed + 2 Bath', area: '1,180', balcony: '118', aspect: 'Community green', basePrice: 1.38 },
  { key: 'b', code: 'TYPE B', name: '2 BHK · Type B', short: 'Two-bedroom courtyard residence', beds: '2 Bed + 2 Bath', area: '1,180', balcony: '118', aspect: 'Central courtyard', basePrice: 1.44 },
  { key: 'c', code: 'TYPE C', name: '2 BHK · Type C', short: 'Two-bedroom morning residence', beds: '2 Bed + 2 Bath', area: '1,164', balcony: '114', aspect: 'Morning light', basePrice: 1.34 },
  { key: 'd', code: 'TYPE D', name: '2 BHK · Type D', short: 'Two-bedroom corner residence', beds: '2 Bed + 2 Bath', area: '1,196', balcony: '124', aspect: 'Corner · two aspects', basePrice: 1.48 },
]

export const FLAT_TYPES: FlatType[] = TYPE_DEFS.map((def) => {
  const mx = def.key === 'b' || def.key === 'd'
  const mz = def.key === 'c' || def.key === 'd'
  const rooms = A_ROOMS.map((room) => {
    let out = { ...room }
    if (mx) out = mirrorRoomX(out)
    if (mz) out = mirrorRoomY(out)
    return out
  })
  const walls = A_WALLS.map((wall) => {
    let out = { ...wall }
    if (mx) out = mirrorWallX(out)
    if (mz) out = mirrorWallY(out)
    return out
  })
  const glazing = A_GLAZING.map((g) => {
    let out = { ...g }
    if (mx) out = mirrorGlazingX(out)
    if (mz) out = mirrorGlazingY(out)
    return out
  })
  const crop = PLAN_CROPS[def.key]
  return {
    ...def,
    plan: PLAN_FILES[def.key],
    planCrop: crop,
    planAspect: crop.w / crop.h,
    rooms,
    hotspots: A_HOTSPOTS.map((h) => localHotspot(h, crop, mx, mz)),
    walls,
    glazing,
  }
})


const FLAT_ORDER: PlanType[] = ['a', 'b', 'c', 'd']

function priceFor(level: number, base: number) {
  const uplift = (level - 1) * 0.035
  return `₹ ${(base + uplift).toFixed(2)} Cr`
}

function ordinal(n: number) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}TH`
  const suffix = ['TH', 'ST', 'ND', 'RD'][n % 10] ?? 'TH'
  return `${n}${suffix}`
}

export const LEVELS: Level[] = Array.from({ length: 15 }, (_, i) => {
  const level = i + 1
  return {
    level,
    title: level === 15 ? 'The Asterion Penthouse' : level === 1 ? 'The Garden Level' : level > 11 ? 'The Sky Residence' : 'The Courtyard Residence',
    label: level === 1 ? 'GROUND LEVEL' : `${ordinal(level - 1)} LEVEL`,
    price: 1.38 + (level - 1) * 0.035,
    flats: FLAT_ORDER.map((key, idx) => {
      const type = FLAT_TYPES.find((t) => t.key === key)!
      return {
        number: `${String(level).padStart(2, '0')}0${idx + 1}`,
        type,
        price: priceFor(level, type.basePrice),
      }
    }),
  }
})

export const LEVEL_TAGS = LEVELS.map((l) => ({
  level: l.level,
  label: l.label,
  price: `₹ ${(1.38 + (l.level - 1) * 0.035).toFixed(2)} Cr`,
}))

/* ------------------------------------------------------------------ */
/*  decor ideas — four per flat, same set across all levels             */
/* ------------------------------------------------------------------ */

export type DecorIdea = {
  key: string
  name: string
  note: string
  palette: string[]
  floor: string
  wall: string
  fabric: string
  wood: string
  light: string
}

export const DECOR_IDEAS: DecorIdea[] = [
  {
    key: 'warm-minimal',
    name: 'Warm Minimal',
    note: 'Bone linen, pale oak and a low evening light.',
    palette: ['#E8DFD2', '#C9B79F', '#8C6E52', '#F3EFE7'],
    floor: '#C8B69F',
    wall: '#EEE8DD',
    fabric: '#D9CBB8',
    wood: '#9A7A58',
    light: '#FFD7A4',
  },
  {
    key: 'quiet-luxe',
    name: 'Quiet Luxe',
    note: 'Greige plaster, walnut and honed marble.',
    palette: ['#D9D2C6', '#8B7D6B', '#3F3A33', '#F0EDE6'],
    floor: '#B9AE9D',
    wall: '#DFD8CC',
    fabric: '#B8A992',
    wood: '#5E4733',
    light: '#FFE2B8',
  },
  {
    key: 'desert-modern',
    name: 'Desert Modern',
    note: 'Clay, travertine and a warmer, sunlit palette.',
    palette: ['#D8B89E', '#B07D58', '#6C4A36', '#F2E4D4'],
    floor: '#C9A78B',
    wall: '#EBD8C5',
    fabric: '#C99C79',
    wood: '#7D563B',
    light: '#FFC58A',
  },
  {
    key: 'gallery-white',
    name: 'Gallery White',
    note: 'Chalk white, blackened metal and daylight.',
    palette: ['#F4F1EA', '#E3DED4', '#2F2E2B', '#FAF8F2'],
    floor: '#DED8CC',
    wall: '#F7F4ED',
    fabric: '#E9E4DA',
    wood: '#C7B9A4',
    light: '#FFF4DE',
  },
  {
    key: 'forest-retreat',
    name: 'Forest Retreat',
    note: 'Olive limewash, deep oak and a green view.',
    palette: ['#8C9A7E', '#4D5C45', '#2C3329', '#EDE9DC'],
    floor: '#B3A68C',
    wall: '#E4E2D3',
    fabric: '#A9B29A',
    wood: '#6B5236',
    light: '#FFE3B0',
  },
  {
    key: 'terracotta-sun',
    name: 'Terracotta Sun',
    note: 'Burnt sienna, cream plaster and teak.',
    palette: ['#C4704F', '#E2B79C', '#7F4631', '#F6EBDD'],
    floor: '#C39A7B',
    wall: '#F0DCC8',
    fabric: '#D69C7C',
    wood: '#85583A',
    light: '#FFC98D',
  },
  {
    key: 'coastal-linen',
    name: 'Coastal Linen',
    note: 'Chalk plaster, driftwood and soft sea air.',
    palette: ['#DCE4E3', '#A9BCBD', '#6F8284', '#F7F4EC'],
    floor: '#CFC4AF',
    wall: '#F1F1E8',
    fabric: '#C6D2CE',
    wood: '#A08B6E',
    light: '#FFF4E0',
  },
  {
    key: 'noir-suite',
    name: 'Noir Suite',
    note: 'Charcoal walls, smoked oak and aged brass.',
    palette: ['#3A3B37', '#6E6A60', '#B49B72', '#E7E2D6'],
    floor: '#8C7860',
    wall: '#C9C4B8',
    fabric: '#6E6A60',
    wood: '#4C3A29',
    light: '#FFD9A0',
  },
  {
    key: 'olive-grove',
    name: 'Olive Grove',
    note: 'Silvery olive, cane and warm limestone.',
    palette: ['#A8A582', '#7B7C5C', '#D8CBAF', '#F4F0E3'],
    floor: '#C6B99D',
    wall: '#ECE8D8',
    fabric: '#B7B79A',
    wood: '#8B7148',
    light: '#FFE7BC',
  },
  {
    key: 'rosewood-salon',
    name: 'Rosewood Salon',
    note: 'Dusty rose, walnut and pale travertine.',
    palette: ['#C9A79F', '#8F6157', '#4E3A33', '#F4ECE3'],
    floor: '#BFA48A',
    wall: '#EDDFD5',
    fabric: '#C9A79F',
    wood: '#66412F',
    light: '#FFD8B4',
  },
  {
    key: 'monsoon-grey',
    name: 'Monsoon Grey',
    note: 'Cool ash, pewter and a rain-washed light.',
    palette: ['#A9B0B0', '#7C8588', '#D7D9D4', '#F2F2EC'],
    floor: '#BDB8AC',
    wall: '#E7E7DF',
    fabric: '#AAB2B1',
    wood: '#8E8578',
    light: '#F3F0E2',
  },
  {
    key: 'amber-study',
    name: 'Amber Study',
    note: 'Cognac leather, amber light and cream plaster.',
    palette: ['#B5813F', '#8A5C2E', '#E4C48F', '#F6EFE0'],
    floor: '#B89A6F',
    wall: '#F0E7D4',
    fabric: '#C39A62',
    wood: '#6E4A2A',
    light: '#FFCA7A',
  },
  {
    key: 'indigo-court',
    name: 'Indigo Court',
    note: 'Indigo, pale plaster and woven cane.',
    palette: ['#3D4B63', '#6A7A93', '#C8BFA8', '#F1EDE2'],
    floor: '#B9AB91',
    wall: '#EEE9DB',
    fabric: '#8C9AAE',
    wood: '#7A5A3B',
    light: '#FFE5B8',
  },
  {
    key: 'sandstone-calm',
    name: 'Sandstone Calm',
    note: 'Sandstone, ivory and quiet bronze.',
    palette: ['#D3BE9E', '#B79B74', '#7A6248', '#F7F1E3'],
    floor: '#C8B394',
    wall: '#F2EADA',
    fabric: '#D8C7AC',
    wood: '#8D6F4D',
    light: '#FFE3B6',
  },
  {
    key: 'ivory-deco',
    name: 'Ivory Deco',
    note: 'Ivory, black marble and a champagne edge.',
    palette: ['#F2ECDF', '#1F2020', '#C9AE7D', '#FBFAF4'],
    floor: '#DCD2C1',
    wall: '#F7F3E8',
    fabric: '#E8E0D1',
    wood: '#3A3330',
    light: '#FFEAC2',
  },
  {
    key: 'midnight-garden',
    name: 'Midnight Garden',
    note: 'Deep teal, dark oak and muted gold.',
    palette: ['#23403E', '#3F5C55', '#A98C57', '#E9E4D4'],
    floor: '#9A8264',
    wall: '#DAD8C8',
    fabric: '#4E6A63',
    wood: '#453324',
    light: '#FFD79A',
  },
]

/* ------------------------------------------------------------------ */
/*  2D story content                                                    */
/* ------------------------------------------------------------------ */

export type Room = {
  key: string
  name: string
  label: string
  index: string
  image: string
  description: string
  materials: string
  aspect: string
}

export const ROOMS: Room[] = [
  {
    key: 'living',
    name: 'The Living Room',
    label: 'Living',
    index: '01',
    image: '/images/interior_living.jpg',
    description:
      'A room drawn around the last hour of light. Limewash walls, a low linen sofa, and a travertine table that holds the whole horizon. Nothing shouts; everything is considered.',
    materials: 'Limewash · European oak · Travertine · Bouclé',
    aspect: 'South-west · 6.4 m glazing',
  },
  {
    key: 'dining',
    name: 'Kitchen & Dining',
    label: 'Kitchen',
    index: '02',
    image: '/images/interior_dining.jpg',
    description:
      'The table sits at the centre of the home, beneath three opal globes. A kitchen in smoked oak and cream marble is quiet enough to cook in, generous enough to gather around.',
    materials: 'Smoked oak · Cream marble · Brushed bronze',
    aspect: 'South · 6.6 m glazing',
  },
  {
    key: 'bedroom',
    name: 'The Principal Suite',
    label: 'Bedroom',
    index: '03',
    image: '/images/interior_bedroom.jpg',
    description:
      'A suite that behaves like a small apartment: a sleeping room, a dressing room, a bath in stone, and a window that gives the city back to you at night.',
    materials: 'Wool bouclé · Oak · Bronze · Linen',
    aspect: 'East · Garden outlook',
  },
  {
    key: 'bath',
    name: 'The Bath House',
    label: 'Bathroom',
    index: '04',
    image: '/images/interior_bath.jpg',
    description:
      'A freestanding tub set against the skyline, a round mirror lit from behind, and stone underfoot. A private ritual at the end of the day, and again at the beginning.',
    materials: 'Honed travertine · Stone · Polished bronze',
    aspect: 'South · Skyline outlook',
  },
]

export type Amenity = {
  name: string
  desc: string
  image: string
  meta: string
}

export const AMENITIES: Amenity[] = [
  { name: 'Zen Garden', desc: 'A shaded courtyard planted for stillness, screened from the city.', image: '/images/garden.jpg', meta: 'Podium level' },
  { name: 'Yoga Studio', desc: 'A quiet room for morning practice, with light from the east.', image: '/images/yoga.jpg', meta: 'Level 01' },
  { name: 'Modern Well Equipped Gym', desc: 'Technogym equipment behind floor-to-ceiling glass.', image: '/images/gym.jpg', meta: 'Level 01' },
  { name: 'Walking Trail', desc: 'A landscaped loop through the podium gardens and palms.', image: '/images/trail.jpg', meta: 'Podium' },
  { name: 'Adults Swimming Pool', desc: 'A 25-metre pool with an infinity edge and shaded cabanas.', image: '/images/pool.jpg', meta: 'Podium roof' },
  { name: 'Steam Room With Personal Lockers', desc: 'Warm stone, eucalyptus, and a locker of your own.', image: '/images/spa.jpg', meta: 'Wellness' },
  { name: 'Adults Outdoor Gym', desc: 'Train in the open air, above the palms and the traffic.', image: '/images/outdoor-gym.jpg', meta: 'Podium roof' },
  { name: 'Kids Play Area', desc: 'A soft-landscaped world of their own, within sight.', image: '/images/kids.jpg', meta: 'Podium' },
  { name: 'Padel Court', desc: 'Floodlit and framed by greenery, for the last game of the day.', image: '/images/padel.jpg', meta: 'Podium' },
  { name: 'Cricket Simulator', desc: 'A private pitch, whatever the weather outside.', image: '/images/cricket.jpg', meta: 'Level 01' },
  { name: "Residents' Lounge", desc: 'A library, a bar, and one very long table.', image: '/images/lounge.jpg', meta: 'Ground floor' },
  { name: 'Private Cinema', desc: 'Twelve seats, blackout velvet, and a very good screen.', image: '/images/cinema.jpg', meta: 'Ground floor' },
]

export const AMENITY_IMAGES = AMENITIES.map((a) => a.image)

export const DISTANCES = [
  { time: '08', label: 'Noida Sector 137 Metro', sub: 'The Aqua Line, close by' },
  { time: '12', label: 'Jewar Airport', sub: 'The new gateway' },
  { time: '25', label: 'Connaught Place', sub: 'Delhi, non-stop' },
  { time: '35', label: 'IGI Airport', sub: 'Terminal 3' },
]

export const STATS = [
  { value: 15, suffix: '', label: 'Levels above Noida' },
  { value: 60, suffix: '', label: 'Residences, four per floor' },
  { value: 4, suffix: '', label: 'Plan types, drawn in detail' },
  { value: 360, suffix: '°', label: 'Of uninterrupted outlook' },
]

export const SPECS = [
  { name: 'Podium', note: 'Lobby, lounge, gardens, pool' },
  { name: 'Residences', note: 'Fifteen levels · four homes each' },
  { name: 'Crown', note: 'Penthouse and roof terrace' },
]

export const SITE = {
  name: 'Asterion Residence',
  builder: 'Asterion Builders',
  city: 'Noida',
  region: 'near Delhi, India',
  lat: '28.53° N',
  lng: '77.39° E',
  address: 'Sector 137, Noida Expressway, Noida, Uttar Pradesh',
  phone: '+91 120 000 0000',
  email: 'living@asterion.in',
}
