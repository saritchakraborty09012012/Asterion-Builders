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

const towerTop = await page.evaluate(() =>
  Math.round(document.querySelector('#residences').getBoundingClientRect().top + window.scrollY)
)
await page.evaluate((y) => window.scrollTo(0, y), towerTop)
await wait(3600)
await page.screenshot({ path: path.join(OUT, 'r1-tower.jpg'), quality: 86, type: 'jpeg' })

const isOpen = () => page.evaluate(() => (document.body.innerText || '').includes('BACK TO THE TOWER'))
const visibleTags = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('#residences button[aria-label]')]
      .map((b) => {
        const r = b.getBoundingClientRect()
        return {
          label: b.getAttribute('aria-label'),
          x: Math.round(r.x + r.width / 2),
          y: Math.round(r.y + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
        }
      })
      .filter((b) => b.w > 1 && b.h > 1 && b.y > 70 && b.y < window.innerHeight - 70)
  )
console.log('visibleTags', JSON.stringify(await visibleTags(), null, 2))

/* canvas blank area on the left — should open the active level */
const blank = await page.evaluate(() => {
  const el = document.elementFromPoint(70, 340)
  return { tag: el?.tagName, cls: String(el?.className).slice(0, 100) }
})
console.log('blank target', blank)
await page.touchscreen.tap(70, 340)
await wait(1100)
console.log('blank tap opened', await isOpen())
await page.screenshot({ path: path.join(OUT, 'r2-blank-tap.jpg'), quality: 86, type: 'jpeg' })
if (await isOpen()) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('BACK TO THE TOWER'))
    b?.click()
  })
  await wait(900)
}

/* visible price tag */
const tags = await visibleTags()
const tag = tags.find((t) => t.label?.startsWith('4TH LEVEL')) ?? tags[Math.floor(tags.length / 2)]
console.log('chosen tag', tag)
if (tag) {
  await page.touchscreen.tap(tag.x, tag.y)
  await wait(1200)
  console.log('tag tap opened', await isOpen())
  await page.screenshot({ path: path.join(OUT, 'r3-tag-tap.jpg'), quality: 86, type: 'jpeg' })
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('BACK TO THE TOWER'))
    b?.click()
  })
  await wait(900)
}

/* tower body tap */
await page.touchscreen.tap(110, 430)
await wait(1100)
console.log('tower tap opened', await isOpen())
await page.screenshot({ path: path.join(OUT, 'r4-tower-tap.jpg'), quality: 86, type: 'jpeg' })

/* if open, open a flat and shoot the sheet top and bottom */
if (await isOpen()) {
  const flat = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => /^\d{4}\s/.test((el.innerText || '').replace(/\s+/g, ' ').trim()))
    if (!b) return null
    const t = (b.innerText || '').replace(/\s+/g, ' ').trim()
    b.click()
    return t
  })
  console.log('flat', flat)
  await wait(1200)
  await page.screenshot({ path: path.join(OUT, 'r5-flat.jpg'), quality: 86, type: 'jpeg' })
}

console.log('overflow', await page.evaluate(() => ({ w: innerWidth, sw: document.documentElement.scrollWidth })))
console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
