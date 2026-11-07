import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile'
const URL = 'http://localhost:5173/'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const VH = 844

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 390, height: VH, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(6000)

const list = await page.evaluate(() => {
  return [...document.querySelectorAll('main > section')].map((el, i) => {
    const r = el.getBoundingClientRect()
    return {
      i,
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
      text: (el.innerText || '').replace(/\s+/g, ' ').toLowerCase().slice(0, 80),
    }
  })
})
const find = (label) => list.find((x) => x.text.includes(label.toLowerCase()))
const entry = find('a private arrival')
const rooms = find('the rooms')
const amen = find('the amenities')
const slow = find('a slower kind of everyday')
const pool = find('the water')
const gallery = find('an assemblage')
const wipe = find('a question of light')
const upward = find('a quiet manifesto')
const topview = find('the address')
const contact = find('register interest')
const door = find('the last door')
console.log(JSON.stringify({ entry, rooms, amen, slow, pool, gallery, wipe, upward, topview, contact, door }, null, 2))

const shootAt = async (name, y, delay = 1600) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(delay)
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 82, type: 'jpeg' })
  console.log('shot', name)
}
const inSection = (s, p) => s.top + p * (s.height - VH)
const plain = (s, p) => s.top + p * Math.min(s.height, VH)

await shootAt('m20-entry-arrival', inSection(entry, 0.02), 2200)
await shootAt('m21-entry-lobby', inSection(entry, 0.28), 1800)
await shootAt('m22-entry-corridor', inSection(entry, 0.52), 1800)
await shootAt('m23-entry-door', inSection(entry, 0.72), 1800)
await shootAt('m24-entry-home', inSection(entry, 0.88), 1800)

await shootAt('m25-arches-top', plain(find('the interiors'), 0.02), 1700)
await shootAt('m26-arches-grid', plain(find('the interiors'), 0.85), 1700)

await shootAt('m27-rooms-top', inSection(rooms, 0.04), 1800)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(inSection(rooms, 0.56)))
await wait(1800)
await page.screenshot({ path: path.join(OUT, 'm28-rooms-stage.jpg'), quality: 82, type: 'jpeg' })
const openRoom = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button[aria-label^="Open "]')).find(
    (e) => e.offsetParent !== null && e.getAttribute('aria-label') !== 'Open menu'
  )
  if (!el) return null
  const label = el.getAttribute('aria-label')
  el.click()
  return label
})
console.log('room opened', openRoom)
await wait(900)
await page.screenshot({ path: path.join(OUT, 'm29-room-modal.jpg'), quality: 82, type: 'jpeg' })
await page.keyboard.press('Escape')
await wait(900)
console.log('menu open after escape', await page.evaluate(() => !!document.querySelector('button[aria-label="Close menu"]')))

await shootAt('m30-amenities', plain(amen, 0.02), 1800)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(amen.top + Math.min(amen.height, VH) * 0.8))
await wait(1400)
await page.screenshot({ path: path.join(OUT, 'm31-amenities-art.jpg'), quality: 82, type: 'jpeg' })

await shootAt('m32-slow', inSection(slow, 0.08), 1800)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(inSection(slow, 0.6)))
await wait(1700)
await page.screenshot({ path: path.join(OUT, 'm33-slow-b.jpg'), quality: 82, type: 'jpeg' })

await shootAt('m34-pool', plain(pool, 0.02), 2600)

await shootAt('m35-gallery', plain(gallery, 0.06), 1700)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(plain(gallery, 0.62)))
await wait(1600)
await page.screenshot({ path: path.join(OUT, 'm36-gallery-luxury.jpg'), quality: 82, type: 'jpeg' })

await shootAt('m37-sidewipe', inSection(wipe, 0.55), 1700)
await shootAt('m38-upward', inSection(upward, 0.55), 1700)
await shootAt('m39-topview', plain(topview, 0.16), 3000)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(topview.top + topview.height * 0.55))
await wait(1400)
await page.screenshot({ path: path.join(OUT, 'm40-topview-info.jpg'), quality: 82, type: 'jpeg' })

await shootAt('m41-contact', plain(contact, 0.05), 1700)
await page.evaluate(() => document.querySelector('#name')?.scrollIntoView({ block: 'center' }))
await wait(600)
await page.screenshot({ path: path.join(OUT, 'm42-contact-form.jpg'), quality: 82, type: 'jpeg' })

await shootAt('m43-door', inSection(door, 0.56), 1800)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(inSection(door, 0.7)))
await wait(1800)
await page.screenshot({ path: path.join(OUT, 'm44-xyz.jpg'), quality: 82, type: 'jpeg' })
await page.evaluate((y) => window.scrollTo(0, y), Math.round(inSection(door, 0.985)))
await wait(1800)
await page.screenshot({ path: path.join(OUT, 'm45-return.jpg'), quality: 82, type: 'jpeg' })

const overflow = await page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
}))
console.log('overflow', overflow)
console.log('ERRORS:', errors.slice(0, 40))
await browser.close()
