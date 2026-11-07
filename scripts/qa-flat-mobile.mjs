import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(6500)

const top = await page.evaluate(() =>
  Math.round(document.querySelector('#residences').getBoundingClientRect().top + window.scrollY)
)
await page.evaluate((y) => window.scrollTo(0, y), top)
await wait(2600)

const levelOpen = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#residences button[aria-label]')].find((el) =>
    (el.getAttribute('aria-label') || '').startsWith('5TH LEVEL')
  )
  b?.click()
  return Boolean(b)
})
console.log('level open', levelOpen)
await wait(1400)

const flatOpen = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#residences button')].find((el) =>
    /^\d{4}\s/.test((el.innerText || '').replace(/\s+/g, ' ').trim())
  )
  const t = (b?.innerText || '').replace(/\s+/g, ' ').trim()
  b?.click()
  return t
})
console.log('flat open', flatOpen)
await wait(1200)
await page.screenshot({ path: path.join(OUT, 'f1-plan.jpg'), quality: 86, type: 'jpeg' })

// tap the living room on the plan (map SVG coordinates into CSS pixels)
const livingPoint = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find(
    (el) => el.getAttribute('viewBox') === '-12 -26 684 530' && el.getBoundingClientRect().width > 200
  )
  if (!svg) return null
  const r = svg.getBoundingClientRect()
  return {
    x: r.x + ((157 + 12) / 684) * r.width,
    y: r.y + ((145 + 26) / 530) * r.height,
  }
})
console.log('living point', livingPoint)
if (livingPoint) await page.touchscreen.tap(livingPoint.x, livingPoint.y)
await wait(700)
const tagText = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div,span,p')].find(
    (e) => e.offsetParent !== null && /LIVING · DINING|Living \/ Dining/.test(e.textContent || '')
  )
  return el ? (el.textContent || '').trim().slice(0, 80) : null
})
console.log('room tag', tagText)
await page.screenshot({ path: path.join(OUT, 'f2-roomtag.jpg'), quality: 86, type: 'jpeg' })

// fixed bottom bar should be visible
const bar = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (el) => el.offsetParent !== null && (el.textContent || '').includes('View in 3D')
  )
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { text: (b.textContent || '').trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
})
console.log('bar', bar)

const open3d = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (el) => el.offsetParent !== null && (el.textContent || '').includes('View in 3D')
  )
  b?.click()
  return Boolean(b)
})
console.log('open 3d', open3d)
await wait(2800)
await page.screenshot({ path: path.join(OUT, 'f3-3d.jpg'), quality: 86, type: 'jpeg' })

const decor = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (el) => el.offsetParent !== null && (el.textContent || '').includes('Home decor')
  )
  b?.click()
  return Boolean(b)
})
console.log('decor open', decor)
await wait(1200)
await page.screenshot({ path: path.join(OUT, 'f4-decor.jpg'), quality: 86, type: 'jpeg' })

const pick = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (el) => el.offsetParent !== null && (el.textContent || '').includes('Forest Retreat')
  )
  b?.click()
  return Boolean(b)
})
console.log('pick forest', pick)
await wait(2200)
await page.screenshot({ path: path.join(OUT, 'f5-decor-applied.jpg'), quality: 86, type: 'jpeg' })

const back = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(
    (el) => el.offsetParent !== null && (el.textContent || '').trim() === 'Back to 2D'
  )
  b?.click()
  return Boolean(b)
})
console.log('back to 2d', back)
await wait(1200)
await page.screenshot({ path: path.join(OUT, 'f6-back.jpg'), quality: 86, type: 'jpeg' })

console.log('overflow', await page.evaluate(() => ({ w: innerWidth, sw: document.documentElement.scrollWidth })))
console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
