import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile'
const URL = 'http://localhost:5173/'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  await fs.mkdir(OUT, { recursive: true })
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
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 })
  await wait(6000)

  const info = await page.evaluate(() => {
    const rect = (s) => {
      const el = document.querySelector(s)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) }
    }
    return {
      docHeight: document.documentElement.scrollHeight,
      docWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      top: rect('#top'),
      residences: rect('#residences'),
      entry: rect('#entry'),
      rooms: rect('#rooms'),
      amenities: rect('#amenities'),
      pool: rect('#pool'),
      location: rect('#location'),
      contact: rect('#contact'),
    }
  })
  console.log(JSON.stringify(info, null, 2))

  await page.screenshot({ path: path.join(OUT, 'm01-opening.jpg'), quality: 82, type: 'jpeg' })

  await page.evaluate((y) => window.scrollTo(0, y), Math.round(info.top.height * 0.36))
  await wait(1600)
  await page.screenshot({ path: path.join(OUT, 'm02-community.jpg'), quality: 82, type: 'jpeg' })

  await page.evaluate((y) => window.scrollTo(0, y), Math.round(info.residences.top + 10))
  await wait(2000)
  await page.screenshot({ path: path.join(OUT, 'm03-tower.jpg'), quality: 82, type: 'jpeg' })

  // tap a level price tag (Level 5)
  const tapped = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button[aria-label^="Level 5,"]')).find(
      (e) => e.offsetParent !== null
    )
    if (!el) return false
    el.click()
    return true
  })
  console.log('level tapped', tapped)
  await wait(1500)
  await page.screenshot({ path: path.join(OUT, 'm04-level.jpg'), quality: 82, type: 'jpeg' })

  // tap first flat in mobile list (0501)
  const flatTapped = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(
      (e) =>
        e.offsetParent !== null &&
        (e.textContent || '').replace(/\s+/g, ' ').trim().startsWith('0501')
    )
    if (!el) return false
    el.click()
    return true
  })
  console.log('flat tapped', flatTapped)
  await wait(1500)
  await page.screenshot({ path: path.join(OUT, 'm05-flat.jpg'), quality: 82, type: 'jpeg' })

  // view 3d
  const view3d = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(
      (e) => e.offsetParent !== null && (e.textContent || '').trim() === 'View in 3D'
    )
    if (!el) return false
    el.click()
    return true
  })
  console.log('3d tapped', view3d)
  await wait(3000)
  await page.screenshot({ path: path.join(OUT, 'm06-3d.jpg'), quality: 82, type: 'jpeg' })

  // section shots
  const stops = [
    ['m07-arches', info.entry.top + info.entry.height + 40],
    ['m08-rooms', info.rooms.top + 60],
    ['m09-amenities', info.amenities.top + 60],
    ['m10-pool', info.pool.top + 60],
    ['m11-location', info.location.top + 60],
    ['m12-contact', info.contact.top + 60],
  ]
  for (const [name, y] of stops) {
    await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
    await wait(1300)
    await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 82, type: 'jpeg' })
  }

  console.log('ERRORS:', errors.slice(0, 30))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
