import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
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

const goResidences = async () => {
  const top = await page.evaluate(() => Math.round(document.querySelector('#residences').getBoundingClientRect().top + window.scrollY))
  await page.evaluate((y) => window.scrollTo(0, y), top)
  await wait(3200)
}
const bodyText = () => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
const isLevel = () => page.evaluate(() => (document.body.innerText || '').includes('BACK TO THE TOWER'))
const clickText = (text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find(
      (b) => b.offsetParent !== null && (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === t.toLowerCase()
    )
    if (!el) return false
    el.click()
    return true
  }, text)
const clickIncludes = (text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find(
      (b) => b.offsetParent !== null && (b.textContent || '').toUpperCase().includes(t.toUpperCase())
    )
    if (!el) return false
    el.click()
    return true
  }, text)

await goResidences()
console.log('fresh hint', (await bodyText()).includes('TAP A LEVEL TO VIEW THE FLOOR'))
await page.screenshot({ path: path.join(OUT, 'f1-tower-hint.jpg'), quality: 84, type: 'jpeg' })

/* tap left-edge sky, which should open the default level */
await page.touchscreen.tap(20, 300)
await wait(1300)
console.log('blank tap level', await isLevel())
await page.screenshot({ path: path.join(OUT, 'f2-level-ground.jpg'), quality: 84, type: 'jpeg' })
console.log('hint after open', (await bodyText()).includes('TAP A LEVEL TO VIEW THE FLOOR'))

/* first flat */
console.log('flat', await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const raw = (b.textContent || '').replace(/\s+/g, '').toUpperCase()
    return b.offsetParent !== null && /^\d{4}TYPE/.test(raw)
  })
  if (!el) return null
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
  el.click()
  return t
}))
await wait(1300)
await page.screenshot({ path: path.join(OUT, 'f3-flat.jpg'), quality: 84, type: 'jpeg' })

/* room tag through the plan button */
console.log('room', await page.evaluate(() => {
  const el = [...document.querySelectorAll('[role="button"][aria-label]')].find((b) => {
    const l = (b.getAttribute('aria-label') || '').toUpperCase()
    return b.offsetParent !== null && l.startsWith('BEDROOM')
  })
  if (!el) return null
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return el.getAttribute('aria-label')
}))
await wait(800)
await page.screenshot({ path: path.join(OUT, 'f4-room-tag.jpg'), quality: 84, type: 'jpeg' })

console.log('view 3d', await clickText('View in 3D'))
await wait(2800)
await page.screenshot({ path: path.join(OUT, 'f5-3d-unfurnished.jpg'), quality: 84, type: 'jpeg' })

console.log('furnished', await clickIncludes('View furnished'))
await wait(2600)
await page.screenshot({ path: path.join(OUT, 'f6-3d-furnished.jpg'), quality: 84, type: 'jpeg' })

console.log('decor drawer', await clickIncludes('Home decor ideas'))
await wait(900)
await page.screenshot({ path: path.join(OUT, 'f7-decor.jpg'), quality: 84, type: 'jpeg' })
console.log('decor pick', await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const t = (b.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase()
    return b.offsetParent !== null && t.includes('QUIET LUXE')
  })
  if (!el) return null
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50)
  el.click()
  return t
}))
await wait(2600)
await page.screenshot({ path: path.join(OUT, 'f8-decor-applied.jpg'), quality: 84, type: 'jpeg' })

console.log('back 2d', await clickText('Back to 2D'))
await wait(1200)
console.log('is level after 2d', await isLevel())
await page.screenshot({ path: path.join(OUT, 'f9-flat-return.jpg'), quality: 84, type: 'jpeg' })

console.log('back to level', await clickIncludes('Back to level'))
await wait(1000)
await page.screenshot({ path: path.join(OUT, 'f10-level-return.jpg'), quality: 84, type: 'jpeg' })

console.log('back to tower', await clickIncludes('Back to the tower'))
await wait(1200)
console.log('tower hint after', (await bodyText()).includes('TAP A LEVEL TO VIEW THE FLOOR'))
console.log('stored', await page.evaluate(() => window.localStorage.getItem('asterion-level-hint')))
await page.screenshot({ path: path.join(OUT, 'f11-tower-return.jpg'), quality: 84, type: 'jpeg' })

/* reload: hint suppressed */
await page.reload({ waitUntil: 'networkidle2', timeout: 120000 })
await wait(5200)
await goResidences()
console.log('reload hint', (await bodyText()).includes('TAP A LEVEL TO VIEW THE FLOOR'))
await page.screenshot({ path: path.join(OUT, 'f12-reload.jpg'), quality: 84, type: 'jpeg' })

/* continue to site */
await page.touchscreen.tap(20, 300)
await wait(1200)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const raw = (b.textContent || '').replace(/\s+/g, '').toUpperCase()
    return b.offsetParent !== null && /^\d{4}TYPE/.test(raw)
  })
  el?.click()
})
await wait(1000)
console.log('view 3d 2', await clickText('View in 3D'))
await wait(2600)
console.log('continue', await clickText('Continue to site'))
await wait(2600)
const land = await page.evaluate(() => {
  const entry = document.querySelector('#entry')
  return {
    scrollY: Math.round(window.scrollY),
    entryTop: Math.round(entry.getBoundingClientRect().top + window.scrollY),
    levelOpen: (document.body.innerText || '').includes('BACK TO THE TOWER'),
    bodyOverflow: getComputedStyle(document.body).overflow,
  }
})
console.log('land', land)
await page.screenshot({ path: path.join(OUT, 'f13-continue-entry.jpg'), quality: 84, type: 'jpeg' })

console.log('overflow', await page.evaluate(() => ({ w: innerWidth, sw: document.documentElement.scrollWidth })))
console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
