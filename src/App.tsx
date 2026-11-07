import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { setLenis } from './lib/scroll'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Cinematic from './sections/Cinematic'
import Residences from './sections/Residences'
import Entry from './sections/Entry'
import Rooms from './sections/Rooms'
import Amenities from './sections/Amenities'
import Pool from './sections/Pool'
import TopView from './sections/TopView'
import Closing from './sections/Closing'
import {
  Arches,
  Gallery,
  SideWipe,
  SlowLiving,
  UpwardFade,
} from './sections/Story'

export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [loading])

  useEffect(() => {
    if (loading) return
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })
    setLenis(lenis)
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [loading])

  return (
    <>
      <AnimatePresence>
        {loading && <Preloader onDone={() => setLoading(false)} />}
      </AnimatePresence>

      <Cursor />
      <div className="grain" aria-hidden />
      <Nav />

      <main>
        <Cinematic />
        <Residences />
        <Entry />
        <Arches />
        <Rooms />
        <Amenities />
        <SlowLiving />
        <Pool />
        <Gallery />
        <SideWipe />
        <UpwardFade />
        <TopView />
        <Closing />
      </main>
    </>
  )
}
