import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LETTERS = 'ASTERION'.split('')

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const dur = 1900
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setReady(true)
    }
    raf = requestAnimationFrame(tick)

    const img = new Image()
    img.src = '/images/hero_clouds.jpg'
    const timeout = window.setTimeout(() => setReady(true), 3200)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(onDone, 420)
    return () => clearTimeout(t)
  }, [ready, onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col justify-between bg-forest-deep px-gutter py-8 text-bone"
      exit={{ y: '-100%' }}
      transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex items-start justify-between">
        <span className="eyebrow text-bone/70">ASTERION PROPERTIES</span>
        <span className="eyebrow text-bone/70">SECTOR 137 · NOIDA</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6 flex gap-[0.04em] font-display text-[clamp(2.6rem,9vw,7rem)] font-light uppercase leading-none tracking-[0.02em]"
        >
          {LETTERS.map((l, i) => (
            <motion.span
              key={l}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15 + i * 0.06,
              }}
            >
              {l}
            </motion.span>
          ))}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="eyebrow text-bone/65"
        >
          A LUXURIOUS LIFESTYLE AWAITS YOU
        </motion.p>
      </div>

      <div className="flex items-end justify-between">
        <div className="w-[28vw] max-w-[240px]">
          <div className="mb-3 h-px w-full bg-bone/15">
            <motion.div
              className="h-px bg-bone/80"
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.1 }}
            />
          </div>
          <span className="micro text-bone/60">EST. 2026</span>
        </div>
        <span className="font-display text-4xl font-light tabular-nums text-bone/80">
          {String(pct).padStart(3, '0')}
        </span>
      </div>
    </motion.div>
  )
}
