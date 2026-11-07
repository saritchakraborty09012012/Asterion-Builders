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
const interiors = find('the interiors')
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

const shootAt = async (name, y, delay = 1600) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(delay)
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 82, type: 'jpeg' })
  console.log('shot', name)
}
const inSection = (s, p) => s.top + p * (s.height - VH)
const plain = (s, p) => s.top + p * Math.min(s.height, VH)

await shootAt('m46-arches-cards', plain(interiors, 0.42), 1700)

await shootAt('m48-rooms-top', inSection(rooms, 0.04), 1800)
await page.evaluate(() => document.querySelector('#rooms button[aria-label^="Open The"]')?.click())
await wait(1200)
await page.screenshot({ path: path.join(OUT, 'm49-room-modal.jpg'), quality: 82, type: 'jpeg' })
const modalOpen = await page.evaluate(() => (document.body.innerText || '').includes('BACK TO THE ROOMS'))
console.log('room modal open', modalOpen)
await page.keyboard.press('Escape')
await wait(700)

await shootAt('m50-amenities', plain(amen, 0.02), 1800)
await shootAt('m51-amenities-art', amen.top + Math.min(amen.height, VH) * 0.8, 1600)
await shootAt('m52-slow', inSection(slow, 0.08), 1800)
await shootAt('m53-slow-b', inSection(slow, 0.62), 1800)
await shootAt('m54-pool', plain(pool, 0.02), 2800)
await shootAt('m55-gallery', plain(gallery, 0.06), 1800)
await shootAt('m56-gallery-luxury', plain(gallery, 0.64), 1800)
await shootAt('m57-sidewipe', inSection(wipe, 0.55), 1800)
await shootAt('m58-upward', inSection(upward, 0.55), 1800)
await shootAt('m59-topview', plain(topview, 0.14), 3200)
await shootAt('m60-topview-info', topview.top + topview.height * 0.56, 1800)
await shootAt('m61-contact', plain(contact, 0.04), 1800)
await shootAt('m62-contact-form', contact.top + 500, 1600)
await shootAt('m63-door', inSection(door, 0.56), 1800)
await shootAt('m64-xyz', inSection(door, 0.7), 1800)
await shootAt('m65-return', inSection(door, 0.985), 1800)

const overflow = await page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
}))
console.log('overflow', overflow)
console.log('ERRORS:', errors.slice(0, 40))
await browser.close()
