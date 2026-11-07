import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const URL = 'http://localhost:5173/'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const VH = 900

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 1440, height: VH },
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
const slow = find('a slower kind of everyday')
const gallery = find('an assemblage')
const wipe = find('a question of light')
const upward = find('a quiet manifesto')
const topview = find('the address')
const door = find('the last door')
console.log({ entry, slow, gallery, wipe, upward, topview, door })

const shootAt = async (name, y, delay = 1700) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(delay)
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 82, type: 'jpeg' })
  console.log('shot', name)
}
const inSection = (s, p) => s.top + p * (s.height - VH)
const plain = (s, p) => s.top + p * s.height

await shootAt('50-entry-arrival', inSection(entry, 0.02), 2200)
await shootAt('51-entry-lobby', inSection(entry, 0.28), 2000)
await shootAt('52-entry-corridor', inSection(entry, 0.5), 2000)
await shootAt('53-entry-door', inSection(entry, 0.72), 2000)
await shootAt('54-entry-apartment', inSection(entry, 0.88), 2000)
await shootAt('55-entry-handoff', inSection(entry, 0.97), 2000)

if (slow) {
  await shootAt('56-slow-a', inSection(slow, 0.08), 1800)
  await shootAt('57-slow-b', inSection(slow, 0.55), 1800)
}
if (gallery) {
  await shootAt('58-gallery-a', plain(gallery, 0.13), 1800)
  await shootAt('59-gallery-b', plain(gallery, 0.62), 1800)
}
if (wipe) await shootAt('60-sidewipe', inSection(wipe, 0.52), 1800)
if (upward) await shootAt('61-upwardfade', inSection(upward, 0.55), 1800)
await shootAt('62-topview', topview.top + 20, 3200)
await shootAt('63-pool-fallback', find('the water').top + 20, 2600)

if (door) {
  await shootAt('64-door-closing', inSection(door, 0.5), 2000)
  await shootAt('65-xyz-flash', inSection(door, 0.7), 2000)
  await shootAt('66-return-cue', inSection(door, 0.98), 2000)
  await wait(1500)
  await page.mouse.wheel({ deltaY: 240 })
  await wait(450)
  await page.screenshot({ path: path.join(OUT, '67-replay-flash.jpg'), quality: 82, type: 'jpeg' })
  await wait(2400)
  const after = await page.evaluate(() => window.scrollY)
  console.log('scroll after replay', after)
  await page.screenshot({ path: path.join(OUT, '68-after-replay.jpg'), quality: 82, type: 'jpeg' })
}

console.log('ERRORS:', errors.slice(0, 40))
await browser.close()
