import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(6000)

const door = await page.evaluate(() => {
  const el = document.querySelector('#door-exit')
  return { top: Math.round(el.getBoundingClientRect().top + window.scrollY), height: Math.round(el.offsetHeight) }
})
console.log('door', door)

const navState = () =>
  page.evaluate(() => {
    const h = document.querySelector('header')
    if (!h) return null
    const cs = getComputedStyle(h)
    return {
      opacity: +(+cs.opacity).toFixed(2),
      transform: cs.transform,
      pointer: cs.pointerEvents,
      y: Math.round(h.getBoundingClientRect().top),
    }
  })

const marks = [0, 0.2, 0.45, 0.55, 0.68, 0.8, 0.9, 0.975]
for (const p of marks) {
  const y = door.top + p * (door.height - 900)
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(p === 0 ? 1400 : 1800)
  const name = `c${String(Math.round(p * 100)).padStart(3, '0')}`
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), quality: 84, type: 'jpeg' })
  console.log(name, await navState())
}

/* wait for arm then scroll once to replay */
await wait(1600)
const before = await page.evaluate(() => Math.round(window.scrollY))
await page.mouse.move(720, 450)
await page.mouse.wheel({ deltaY: 240 })
await wait(1600)
const after = await page.evaluate(() => Math.round(window.scrollY))
console.log('replay scrollY', before, '->', after)
await page.screenshot({ path: path.join(OUT, 'c999-replay.jpg'), quality: 84, type: 'jpeg' })
await wait(500)
console.log('nav after replay', await navState())

console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
