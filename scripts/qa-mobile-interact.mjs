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

const towerTop = await page.evaluate(() => Math.round(document.querySelector('#residences').getBoundingClientRect().top + window.scrollY))
await page.evaluate((y) => window.scrollTo(0, y), towerTop)
await wait(3200)

const isOpen = () => page.evaluate(() => (document.body.innerText || '').includes('BACK TO THE TOWER'))
const visibleText = () => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300))

console.log('hint visible', await page.evaluate(() => (document.body.innerText || '').includes('TAP A LEVEL TO VIEW THE FLOOR')))

/* true touch tap on the tower */
await page.touchscreen.tap(150, 360)
await wait(1100)
let opened = await isOpen()
console.log('touch tower tap opened', opened)
if (!opened) {
  await page.touchscreen.tap(120, 300)
  await wait(1000)
  opened = await isOpen()
  console.log('touch tower tap retry', opened)
}
if (opened) {
  const heading = await page.evaluate(() => {
    const t = (document.body.innerText || '').replace(/\s+/g, ' ')
    const m = t.match(/BACK TO THE TOWER THE RESIDENCE · ASTERION ([A-Z0-9 ]+ LEVEL)/)
    return m?.[1] ?? t.slice(0, 160)
  })
  console.log('opened level heading', heading)
}
await page.screenshot({ path: path.join(OUT, 't2b-level-touch.jpg'), quality: 84, type: 'jpeg' })

/* open a flat from the level overlay */
const flatOpened = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => /^\d{4}\b/.test((el.innerText || '').replace(/\s+/g, ' ').trim()))
  if (!b) return null
  const label = (b.innerText || '').replace(/\s+/g, ' ').trim()
  b.click()
  return label
})
console.log('flat opened', flatOpened)
await wait(1200)
await page.screenshot({ path: path.join(OUT, 't3b-flat-sheet.jpg'), quality: 84, type: 'jpeg' })

/* room tag via room list (text now uppercase) */
const roomClicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').trim().toUpperCase().startsWith('BEDROOM 1'))
  if (!b) return false
  b.scrollIntoView({ block: 'center' })
  b.click()
  return true
})
await wait(900)
await page.screenshot({ path: path.join(OUT, 't4b-room-tag.jpg'), quality: 84, type: 'jpeg' })
console.log('room clicked', roomClicked)

/* 3d */
const view3d = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').trim().toUpperCase() === 'VIEW IN 3D')
  if (!b) return false
  b.click()
  return true
})
console.log('view 3d', view3d)
await wait(1800)
await page.screenshot({ path: path.join(OUT, 't5b-3d-unfurnished.jpg'), quality: 84, type: 'jpeg' })

/* drag orbit */
await page.mouse.move(195, 430)
await page.mouse.down()
for (let i = 1; i <= 12; i += 1) {
  await page.mouse.move(195 + i * 6, 430 + i * 2)
  await wait(20)
}
await page.mouse.up()
await wait(800)
await page.screenshot({ path: path.join(OUT, 't6b-3d-orbit.jpg'), quality: 84, type: 'jpeg' })

/* furnished */
const furnished = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('VIEW FURNISHED'))
  if (!b) return false
  b.click()
  return true
})
console.log('furnished', furnished)
await wait(1100)
await page.screenshot({ path: path.join(OUT, 't7b-3d-furnished.jpg'), quality: 84, type: 'jpeg' })

/* decor drawer */
const decor = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('HOME DECOR IDEAS'))
  if (!b) return false
  b.click()
  return true
})
console.log('decor opened', decor)
await wait(1000)
await page.screenshot({ path: path.join(OUT, 't8b-decor-drawer.jpg'), quality: 84, type: 'jpeg' })
const decorPick = await page.evaluate(() => {
  const names = ['Warm Minimal', 'Quiet Luxe', 'Desert Modern', 'Gallery White']
  const b = [...document.querySelectorAll('button')].find((el) => {
    const t = (el.innerText || '').toUpperCase()
    return names.some((n) => t.includes(n.toUpperCase()))
  })
  if (!b) return null
  const t = (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80)
  b.click()
  return t
})
console.log('decor picked', decorPick)
await wait(1100)
await page.screenshot({ path: path.join(OUT, 't9b-decor-applied.jpg'), quality: 84, type: 'jpeg' })

/* back to 2d */
const back2d = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().toUpperCase() === 'BACK TO 2D')
  if (!b) return false
  b.click()
  return true
})
console.log('back to 2d', back2d)
await wait(1100)
await page.screenshot({ path: path.join(OUT, 't10b-flat-return.jpg'), quality: 84, type: 'jpeg' })

/* back to level, then tower */
const backLevel = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('BACK TO LEVEL'))
  if (!b) return false
  b.click()
  return true
})
console.log('back to level', backLevel)
await wait(1000)
await page.screenshot({ path: path.join(OUT, 't11b-level-return.jpg'), quality: 84, type: 'jpeg' })
const backTower = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('BACK TO THE TOWER'))
  if (!b) return false
  b.click()
  return true
})
console.log('back to tower', backTower)
await wait(1100)
await page.screenshot({ path: path.join(OUT, 't12b-tower-return.jpg'), quality: 84, type: 'jpeg' })
console.log('after tower return', await page.evaluate(() => ({
  hint: (document.body.innerText || '').includes('TAP A LEVEL TO VIEW THE FLOOR'),
  stored: window.localStorage.getItem('asterion-level-hint'),
})))

/* switch level by tapping a price tag (touch, not DOM) */
const tagBox = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#residences button[aria-label]')].find((el) => (el.getAttribute('aria-label') || '').startsWith('4TH LEVEL'))
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: b.getAttribute('aria-label') }
})
console.log('tag box', tagBox)
if (tagBox) {
  await page.touchscreen.tap(tagBox.x, tagBox.y)
  await wait(1100)
  console.log('tag tap opened', await isOpen())
  await page.screenshot({ path: path.join(OUT, 't13b-level-4th.jpg'), quality: 84, type: 'jpeg' })
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('BACK TO THE TOWER'))
    b?.click()
  })
  await wait(800)
}

/* tap outside the tower on the canvas: should not open (background) */
await page.touchscreen.tap(16, 780)
await wait(700)
console.log('outside tap opened', await isOpen())

/* reload: hint should not show again */
await page.reload({ waitUntil: 'networkidle2', timeout: 120000 })
await wait(5200)
const towerTop2 = await page.evaluate(() => Math.round(document.querySelector('#residences').getBoundingClientRect().top + window.scrollY))
await page.evaluate((y) => window.scrollTo(0, y), towerTop2)
await wait(3300)
console.log('reload state', await page.evaluate(() => ({
  hint: (document.body.innerText || '').includes('TAP A LEVEL TO VIEW THE FLOOR'),
  stored: window.localStorage.getItem('asterion-level-hint'),
  has4: (document.querySelector('#residences')?.innerText || '').includes('4TH LEVEL'),
  has14: (document.querySelector('#residences')?.innerText || '').includes('14TH LEVEL'),
})))
await page.screenshot({ path: path.join(OUT, 't14b-reload.jpg'), quality: 84, type: 'jpeg' })

console.log('overflow', await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth })))
console.log('ERRORS:', errors.slice(0, 30))
await browser.close()
