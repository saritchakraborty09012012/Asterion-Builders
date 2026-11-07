import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const OUTM = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile'
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
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(6000)

async function go(sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s)
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
  }, sel)
}

await go('#amenities')
await wait(2600)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('#amenities button')].find((el) => (el.innerText || '').includes('Kids Play Area'))
  b?.click()
})
await wait(1200)
await page.screenshot({ path: path.join(OUT, '70-amenities-active.jpg'), quality: 84, type: 'jpeg' })
const active = await page.evaluate(() =>
  [...document.querySelectorAll('#amenities button')]
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim())
)
console.log('active rows', active)

await go('#pool')
await wait(2600)
await page.screenshot({ path: path.join(OUT, '71-pool-new.jpg'), quality: 84, type: 'jpeg' })

await go('#location')
await wait(3500)
await page.screenshot({ path: path.join(OUT, '72-topview-new.jpg'), quality: 84, type: 'jpeg' })

// mobile
const mob = await browser.newPage()
mob.on('console', (m) => {
  if (m.type() === 'error') errors.push('mobile console: ' + m.text())
})
mob.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message))
await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await mob.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUTM, { recursive: true })
await wait(6000)
async function gom(sel) {
  await mob.evaluate((s) => {
    const el = document.querySelector(s)
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
  }, sel)
}
await gom('#amenities')
await wait(2200)
await mob.screenshot({ path: path.join(OUTM, '70-amenities.jpg'), quality: 84, type: 'jpeg' })
await gom('#pool')
await wait(2400)
await mob.screenshot({ path: path.join(OUTM, '71-pool.jpg'), quality: 84, type: 'jpeg' })
await gom('#location')
await wait(3000)
await mob.screenshot({ path: path.join(OUTM, '72-topview.jpg'), quality: 84, type: 'jpeg' })

console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
