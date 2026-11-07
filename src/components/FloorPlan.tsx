import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FLAT_TYPES,
  LEVELS,
  type Flat,
  type Hotspot,
  type PlanType,
  type RoomKind,
} from '../data/site'

/* ------------------------------------------------------------------ */
/*  plan palette                                                       */
/* ------------------------------------------------------------------ */
const TINT: Record<RoomKind, string> = {
  living: 'rgba(165,126,86,0.16)',
  bed: 'rgba(165,126,86,0.14)',
  bath: 'rgba(58,92,86,0.16)',
  kitchen: 'rgba(140,96,58,0.14)',
  dining: 'rgba(165,126,86,0.12)',
  terrace: 'rgba(67,94,62,0.14)',
  balcony: 'rgba(67,94,62,0.14)',
  hall: 'rgba(120,104,80,0.12)',
  study: 'rgba(120,104,80,0.12)',
  family: 'rgba(165,126,86,0.12)',
  maid: 'rgba(120,104,80,0.12)',
  pool: 'rgba(48,96,102,0.16)',
  core: 'rgba(90,80,64,0.16)',
}

export function NorthArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 52" className={`h-11 w-8 ${className}`} aria-hidden>
      <path d="M17 4 23 30 17 26 11 30 17 4Z" fill="currentColor" opacity="0.85" />
      <path d="M17 48V30" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <text
        x="17"
        y="51"
        textAnchor="middle"
        fontSize="6"
        letterSpacing="1"
        fill="currentColor"
        opacity="0.8"
      >
        N
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  detailed floor plan — the supplied plate, with live room tags       */
/* ------------------------------------------------------------------ */
export default function FloorPlan({
  type,
  flatNumber,
  activeRoom,
  onRoom,
  className = '',
  compact = false,
}: {
  type: PlanType
  flatNumber: string
  activeRoom?: string | null
  onRoom?: (key: string | null) => void
  className?: string
  compact?: boolean
}) {
  const flat = FLAT_TYPES.find((f) => f.key === type)!
  const [hover, setHover] = useState<string | null>(null)
  const activeKey = activeRoom ?? hover
  const active = flat.hotspots.find((h) => h.key === activeKey) ?? null
  // the printed plates all say (1001)-(1004); our live number replaces that
  // baked text with an opaque chip so 13th never shows a 10th-floor number
  const FLAT_LABEL_POS: Record<PlanType, [number, number]> = {
    a: [0.825, 0.71],
    b: [0.1, 0.7],
    c: [0.81, 0.41],
    d: [0.075, 0.4],
  }
  const [lx, ly] = FLAT_LABEL_POS[type]

  const enter = (h: Hotspot) => {
    setHover(h.key)
    onRoom?.(h.key)
  }
  const leave = () => {
    setHover(null)
    onRoom?.(null)
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#f7f3ea] ${className}`}
      style={{ aspectRatio: `${flat.planAspect}` }}
    >
      <img
        src={flat.plan}
        alt={`${flat.code} floor plan, ${flat.name}`}
        className="absolute inset-0 h-full w-full select-none object-cover"
        draggable={false}
      />
      {/* cover the plate's printed (1001)-sheet number with the live one */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[5] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center border border-ink/10 bg-[#EDE5D5] px-2 py-1.5 text-center uppercase leading-tight tracking-[0.08em] text-ink shadow-sm"
        style={{
          left: `${lx * 100}%`,
          top: `${ly * 100}%`,
          minWidth: '24%',
        }}
      >
        <span className="text-[clamp(0.6rem,1.05vw,0.85rem)] font-semibold">
          Flat {flat.code.replace('TYPE ', '')}
        </span>
        <span className="text-[clamp(0.6rem,1.05vw,0.85rem)] font-semibold">
          ({flatNumber})
        </span>
      </div>

      {/* soft wash so tags stay legible over the drawing */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(248,245,238,0.06)_0%,rgba(248,245,238,0.2)_78%,rgba(248,245,238,0.34)_100%)]" />

      <div className="absolute inset-0">
        {flat.hotspots.map((h) => {
          const isActive = activeKey === h.key
          const index = flat.hotspots.indexOf(h) + 1
          return (
            <button
              key={h.key}
              type="button"
              aria-label={`${h.name}, ${h.dims}`}
              aria-pressed={isActive}
              onMouseEnter={() => enter(h)}
              onMouseLeave={leave}
              onFocus={() => enter(h)}
              onBlur={leave}
              onClick={() => (isActive ? onRoom?.(null) : enter(h))}
              className={`group absolute cursor-pointer touch-manipulation rounded-[3px] outline-none transition-all duration-200 ${
                isActive ? 'z-30' : 'z-10 hover:z-20'
              }`}
              style={{
                left: `${h.x * 100}%`,
                top: `${h.y * 100}%`,
                width: `${h.w * 100}%`,
                height: `${h.h * 100}%`,
                background: isActive ? TINT[h.kind] : 'transparent',
                boxShadow: isActive
                  ? 'inset 0 0 0 2px rgba(23,37,28,0.9), 0 10px 30px rgba(23,37,28,0.18)'
                  : undefined,
              }}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 rounded-[3px] border transition-all duration-200 ${
                  isActive
                    ? 'border-forest'
                    : 'border-forest/0 group-hover:border-forest/45 group-focus-visible:border-forest/70'
                }`}
              />

              <span
                className={`pointer-events-none absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-[#faf7f0]/90 text-[0.54rem] font-medium tabular-nums tracking-[0.04em] text-ink/70 shadow-[0_2px_8px_rgba(26,27,24,0.2)] transition-all duration-200 group-hover:scale-110 group-hover:border-clay group-hover:bg-paper group-hover:text-ink ${
                  isActive ? 'scale-0 opacity-0' : 'border-ink/20 opacity-100'
                }`}
              >
                {String(index).padStart(2, '0')}
              </span>
            </button>
          )
        })}
      </div>

      {/* the raised tag */}
      <AnimatePresence>
        {active && (
          <div
            key={active.key}
            className="pointer-events-none absolute z-40"
            style={{
              left: `${(active.x + active.w / 2) * 100}%`,
              top: `${active.y * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-2 flex flex-col items-center gap-1">
                <span className="whitespace-nowrap rounded-full bg-forest px-4 py-2 text-[clamp(0.6rem,0.78vw,0.8rem)] font-medium uppercase tracking-[0.18em] text-bone shadow-[0_14px_34px_rgba(23,37,28,0.38)]">
                  {active.name}
                </span>
                <span className="whitespace-nowrap rounded-full border border-forest/20 bg-paper px-3 py-1 text-[clamp(0.5rem,0.66vw,0.66rem)] tracking-[0.16em] text-ink/80 shadow-sm">
                  {active.dims} · {active.kind === 'balcony' ? 'open to sky' : 'carpet'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  thumbnail                                                          */
/* ------------------------------------------------------------------ */
export function MiniPlan({
  type,
  className = '',
}: {
  type: PlanType
  className?: string
}) {
  const flat = FLAT_TYPES.find((f) => f.key === type)!
  return (
    <img
      src={flat.plan}
      alt={`${flat.code} plan`}
      className={`select-none object-cover ${className}`}
      draggable={false}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  level plate — the real tenth-floor sheet, four live residences      */
/* ------------------------------------------------------------------ */
const LEVEL_SPOTS = [
  { x: 0.006, y: 0.018, w: 0.351, h: 0.43 },
  { x: 0.636, y: 0.018, w: 0.356, h: 0.43 },
  { x: 0.006, y: 0.475, w: 0.351, h: 0.465 },
  { x: 0.636, y: 0.475, w: 0.356, h: 0.465 },
]

export function LevelPlate({
  flats,
  levelNo,
  active,
  onActive,
  onSelect,
}: {
  flats: Flat[]
  levelNo: number
  active: number | null
  onActive: (i: number | null) => void
  onSelect: (i: number) => void
}) {
  const levelLabel = LEVELS[levelNo - 1]?.label ?? 'GROUND LEVEL'
  const short = levelLabel.replace(' LEVEL', '')
  // covered plates' baked print sits at these fractions of the sheet
  const LABEL_SPOTS: [number, number][] = [
    [0.305, 0.325],
    [0.662, 0.325],
    [0.305, 0.65],
    [0.662, 0.65],
  ]
  return (
    <div className="relative w-full overflow-hidden border border-ink/15 bg-[#f7f3ea]">
      <img
        src="/images/plans/level-10.jpg"
        alt={`${short.toLowerCase()} floor plate with four residences around the central lift and stair core`}
        className="block w-full select-none object-cover"
        draggable={false}
      />

      {/* cover the plate's printed 10th-floor text with live level copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[0.5%] bottom-[0.5%] min-w-[28%] rounded-sm border border-ink/10 bg-[#F8F5EE] px-4 py-3 text-right font-display text-[clamp(0.85rem,1.6vw,1.6rem)] leading-none text-ink shadow-sm"
      >
        {short.toLowerCase()} Floor Plan
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-ink/10 bg-[#EEE7D8] px-[1.2%] py-[0.6%] text-center uppercase tracking-[0.18em] text-ink/85 shadow-sm"
      >
        <span className="block text-[clamp(0.5rem,0.85vw,0.78rem)] font-semibold">
          {short} Floor
        </span>
        <span className="block text-[clamp(0.5rem,0.85vw,0.78rem)] font-semibold">
          Lobby
        </span>
      </div>
      {flats.map((f, i) => {
        const [fx, fy] = LABEL_SPOTS[i]
        return (
          <div
            key={`patch-${f.number}`}
            aria-hidden
            className="pointer-events-none absolute z-[5] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center border border-ink/10 bg-[#EDE5D5]/95 px-1 py-1 text-center uppercase leading-tight tracking-[0.06em] text-ink/80 shadow-sm"
            style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, minWidth: '13%' }}
          >
            <span className="text-[clamp(0.52rem,0.9vw,0.8rem)] font-semibold">
              Flat {f.type.code.replace('TYPE ', '')}
            </span>
            <span className="text-[clamp(0.52rem,0.9vw,0.8rem)] font-semibold">
              ({f.number})
            </span>
          </div>
        )
      })}

      {flats.map((f, i) => {
        const spot = LEVEL_SPOTS[i]
        const isActive = active === i
        return (
          <button
            key={f.number}
            type="button"
            aria-label={`${f.number} ${f.type.code} ${f.price}`}
            onMouseEnter={() => onActive(i)}
            onMouseLeave={() => onActive(null)}
            onFocus={() => onActive(i)}
            onBlur={() => onActive(null)}
            onClick={() => onSelect(i)}
            className={`group absolute touch-manipulation rounded-sm outline-none transition-all duration-300 ${
              isActive ? 'z-20' : 'z-10'
            }`}
            style={{
              left: `${spot.x * 100}%`,
              top: `${spot.y * 100}%`,
              width: `${spot.w * 100}%`,
              height: `${spot.h * 100}%`,
              background: isActive ? 'rgba(165,126,86,0.18)' : 'transparent',
            }}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 border-2 transition-all duration-300 ${
                isActive
                  ? 'border-clay shadow-[inset_0_0_0_3px_rgba(248,245,238,0.75)]'
                  : 'border-transparent group-hover:border-clay/60 group-focus-visible:border-clay'
              }`}
            />
            <span
              className={`absolute bottom-2 left-2 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[clamp(0.56rem,0.7vw,0.72rem)] uppercase tracking-[0.16em] shadow-sm transition-colors ${
                isActive
                  ? 'border-forest bg-forest text-bone'
                  : 'border-ink/16 bg-paper/95 text-ink/80 group-hover:border-clay/50 group-hover:text-ink'
              }`}
            >
              <span className="font-medium">{f.number}</span>
              <span className="opacity-60">{f.type.code.replace('TYPE ', '')}</span>
            </span>
          </button>
        )
      })}

      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-ink/12 bg-paper/90 px-3 py-1.5 text-[0.52rem] uppercase tracking-[0.2em] text-ink/70 shadow-sm">
        {short.toLowerCase()} floor plate
      </div>
    </div>
  )
}
