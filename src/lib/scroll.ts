import Lenis from 'lenis'

let instance: Lenis | null = null

export function setLenis(l: Lenis | null) {
  instance = l
}

export function scrollToId(id: string) {
  const target = document.querySelector(id)
  if (!target) return
  if (instance) {
    instance.scrollTo(target as HTMLElement, {
      offset: 0,
      duration: 1.7,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    })
  } else {
    ;(target as HTMLElement).scrollIntoView({ behavior: 'smooth' })
  }
}

export function lockScroll() {
  instance?.stop()
}

export function unlockScroll() {
  instance?.start()
}

export function scrollToTop(immediate = false) {
  if (instance) {
    instance.scrollTo(0, {
      immediate,
      duration: immediate ? 0 : 1.8,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    })
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' })
  }
}
