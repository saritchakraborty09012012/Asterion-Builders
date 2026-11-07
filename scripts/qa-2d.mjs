import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const URL = 'http://localhost:5173/'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 1440, height: 900 },
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
  const get = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) }
  }
  return {
    docHeight: document.documentElement.scrollHeight,
    sections: [...document.querySelectorAll('main > section')].map((el, i) => {
      const r = el.getBoundingClientRect()
      return {
        i,
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 70),
      }
    }),
    entry: get('#entry'),
    rooms: get('#rooms'),
    amenities: get('#amenities'),
    pool: get('#pool'),
    location: get('#location'),
    contact: get('#contact'),
  }
})
console.log(JSON.stringify(list, null, 2))

const shoot = async (name, y, delay = 1500) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(delay)
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 82, type: 'jpeg' })
  console.log('shot', name, Math.round(y))
}

const find = (label) => {
  const s = list.sections.find((x) => x.text.includes(label))
  return s || null
}

/* entry sequence */
await shoot('21-entry-arrival', list.entry.top + 20, 2200)
await shoot('22-entry-lobby', list.entry.top + list.entry.height * 0.33, 2000)
await shoot('23-entry-corridor', list.entry.top + list.entry.height * 0.6, 2000)
await shoot('24-entry-door', list.entry.top + list.entry.height * 0.8, 2000)
await shoot('25-entry-home', list.entry.top + list.entry.height * 0.97, 2200)

/* arches */
const interiors = await page.evaluate(() => {
  const el = document.querySelector('#interiors')
  const r = el.getBoundingClientRect()
  return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) }
})
await shoot('26-arches-top', interiors.top + 40, 1600)
await shoot('27-arches-grid', interiors.top + interiors.height * 0.46, 1600)

/* rooms stage + modal */
await shoot('28-rooms-top', list.rooms.top + 40, 1800)
await page.evaluate((y) => window.scrollTo(0, y), Math.round(list.rooms.top + list.rooms.height * 0.28))
await wait(1600)
await page.screenshot({ path: path.join(OUT, '29-rooms-stage2.jpg'), quality: 82, type: 'jpeg' })
const openRoom = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button[aria-label^="Open "]')).find((e) => e.offsetParent !== null)
  if (!el) return false
  el.click()
  return true
})
console.log('room opened', openRoom)
await wait(1000)
await page.screenshot({ path: path.join(OUT, '30-room-modal.jpg'), quality: 82, type: 'jpeg' })
await page.keyboard.press('Escape')
await wait(600)

/* amenities auto + lightbox */
await shoot('31-amenities-a', list.amenities.top + 30, 1700)
await wait(5200)
await page.screenshot({ path: path.join(OUT, '32-amenities-b.jpg'), quality: 82, type: 'jpeg' })
const openAmenity = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button[aria-label^="View "]')).find((e) => e.offsetParent !== null)
  if (!el) return false
  el.click()
  return true
})
console.log('amenity opened', openAmenity)
await wait(1000)
await page.screenshot({ path: path.join(OUT, '33-amenity-lightbox.jpg'), quality: 82, type: 'jpeg' })
await page.keyboard.press('Escape')
await wait(600)

/* slow living */
const slow = find('A slower kind of everyday')
if (slow) {
  await shoot('34-slow-a', slow.top + slow.height * 0.12, 1600)
  await shoot('35-slow-b', slow.top + slow.height * 0.62, 1600)
}

/* pool */
await shoot('36-pool', list.pool.top + 20, 2500)
const videoState = await page.evaluate(() => {
  const v = document.querySelector('#pool video')
  return v ? { readyState: v.readyState, paused: v.paused, currentTime: v.currentTime, w: v.videoWidth } : null
})
console.log('video', videoState)
await wait(1500)
await page.screenshot({ path: path.join(OUT, '37-pool-later.jpg'), quality: 82, type: 'jpeg' })

/* gallery */
const gallery = find('An assemblage')
if (gallery) {
  await shoot('38-gallery-a', gallery.top + gallery.height * 0.12, 1600)
  await shoot('39-gallery-b', gallery.top + gallery.height * 0.56, 1600)
}

/* side wipe */
const wipe = find('A private gallery') || find('The city, edited') || find('side')
console.log('wipe section', wipe)
const byIndex = (i) => list.sections[i]
const wipes = list.sections.filter((s) => s.i > (gallery?.i ?? 0) && s.height > 900)
console.log('after gallery', wipes)
if (wipes[0]) await shoot('40-sidewipe', wipes[0].top + wipes[0].height * 0.5, 1600)
if (wipes[1]) await shoot('41-upwardfade', wipes[1].top + wipes[1].height * 0.5, 1600)

/* top view */
await shoot('42-topview', list.location.top + 260, 3000)

/* contact + form */
await shoot('43-contact', list.contact.top + 30, 1600)
await page.evaluate(() => document.querySelector('#name')?.scrollIntoView({ block: 'center' }))
await wait(500)
await page.type('#name', 'QA Visitor')
await page.type('#email', 'qa@asterion.test')
await page.type('#phone', '+91 98100 00000')
await page.click('button[type="submit"]')
await wait(1500)
await page.screenshot({ path: path.join(OUT, '44-form-sent.jpg'), quality: 82, type: 'jpeg' })
const sent = await page.evaluate(() => (document.body.innerText || '').includes('Thank you, QA'))
console.log('form sent', sent)

/* door exit + flash + replay */
const door = find('The last door')
console.log('door section', door)
if (door) {
  await shoot('45-door-closing', door.top + door.height * 0.5, 1800)
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(door.top + door.height * 0.66))
  await wait(1800)
  await page.screenshot({ path: path.join(OUT, '46-xyz-flash.jpg'), quality: 82, type: 'jpeg' })
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(door.top + door.height * 0.985))
  await wait(1800)
  await page.screenshot({ path: path.join(OUT, '47-return-cue.jpg'), quality: 82, type: 'jpeg' })
  await wait(1200)
  await page.mouse.wheel({ deltaY: 240 })
  await wait(400)
  await page.screenshot({ path: path.join(OUT, '48-replay-flash.jpg'), quality: 82, type: 'jpeg' })
  await wait(2200)
  const after = await page.evaluate(() => window.scrollY)
  console.log('scroll after replay', after)
  await page.screenshot({ path: path.join(OUT, '49-after-replay.jpg'), quality: 82, type: 'jpeg' })
}

console.log('ERRORS:', errors.slice(0, 40))
await browser.close()
