import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
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
const top = await page.evaluate(() => {
  const el = document.querySelector('#residences')
  return el.getBoundingClientRect().top + window.scrollY
})
await page.evaluate((y) => window.scrollTo(0, y), top)
await wait(2800)
await page.screenshot({ path: path.join(OUT, '17-tower-new.jpg'), quality: 82, type: 'jpeg' })

const clickByText = (text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find(
      (b) => b.offsetParent !== null && (b.textContent || '').replace(/\s+/g, ' ').trim() === t
    )
    if (!el) return false
    el.click()
    return true
  }, text)

console.log('open 5th level', await page.evaluate(() => {
  const el = [...document.querySelectorAll('button[aria-label]')].find(
    (b) => b.offsetParent !== null && (b.getAttribute('aria-label') || '').startsWith('5TH LEVEL,')
  )
  if (!el) return null
  el.click()
  return el.getAttribute('aria-label')
}))
await wait(1400)
await page.screenshot({ path: path.join(OUT, '17b-level5.jpg'), quality: 82, type: 'jpeg' })

console.log('first flat', await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const raw = (b.textContent || '').replace(/\s+/g, '').toUpperCase()
    return b.offsetParent !== null && /^\d{4}TYPE/.test(raw)
  })
  if (!el) return null
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
  el.click()
  return t
}))
await wait(1400)
await page.screenshot({ path: path.join(OUT, '17c-flat5.jpg'), quality: 82, type: 'jpeg' })

console.log('view 3d', await clickByText('View in 3D'))
await wait(2800)
await page.screenshot({ path: path.join(OUT, '17d-3d.jpg'), quality: 82, type: 'jpeg' })

console.log('back to 2d', await clickByText('Back to 2D'))
await wait(1500)
await page.screenshot({ path: path.join(OUT, '17e-flat-return.jpg'), quality: 82, type: 'jpeg' })

console.log('back to level', await clickByText('Back to level'))
await wait(1100)
console.log('back to tower?', await page.evaluate(() => (document.body.innerText || '').includes('Back to the tower')))
await page.screenshot({ path: path.join(OUT, '17f-level5-return.jpg'), quality: 82, type: 'jpeg' })

// mobile
const mob = await browser.newPage()
mob.on('console', (m) => {
  if (m.type() === 'error') errors.push('mobile console: ' + m.text())
})
mob.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message))
await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await mob.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(6000)
const mtop = await mob.evaluate(() => {
  const el = document.querySelector('#residences')
  return el.getBoundingClientRect().top + window.scrollY
})
await mob.evaluate((y) => window.scrollTo(0, y), mtop)
await wait(2800)
await mob.screenshot({ path: path.join(OUT, '18-tower-new-mobile.jpg'), quality: 82, type: 'jpeg' })

const isOpen = () => mob.evaluate(() => (document.body.innerText || '').includes('BACK TO THE TOWER'))

/* empty sky to the left of the tower — should read as a canvas miss */
const blankTarget = await mob.evaluate(() => {
  const el = document.elementFromPoint(20, 300)
  return { tag: el?.tagName, cls: String(el?.className).slice(0, 90) }
})
console.log('blank target', blankTarget)
await mob.touchscreen.tap(20, 300)
await wait(1400)
console.log('blank tap opened', await isOpen())
await mob.screenshot({ path: path.join(OUT, '18a-blank-tap.jpg'), quality: 82, type: 'jpeg' })
if (await isOpen()) {
  await mob.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').toUpperCase().includes('BACK TO THE TOWER'))
    b?.click()
  })
  await wait(1000)
}

console.log('mobile open 5th', await mob.evaluate(() => {
  const el = [...document.querySelectorAll('button[aria-label]')].find(
    (b) => b.offsetParent !== null && (b.getAttribute('aria-label') || '').startsWith('5TH LEVEL,')
  )
  if (!el) return null
  el.click()
  return el.getAttribute('aria-label')
}))
await wait(1400)
await mob.screenshot({ path: path.join(OUT, '18b-level5.jpg'), quality: 82, type: 'jpeg' })

console.log('mobile first flat', await mob.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const raw = (b.textContent || '').replace(/\s+/g, '').toUpperCase()
    return b.offsetParent !== null && /^\d{4}TYPE/.test(raw)
  })
  if (!el) return null
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
  el.click()
  return t
}))
await wait(1400)
await mob.screenshot({ path: path.join(OUT, '18c-flat5.jpg'), quality: 82, type: 'jpeg' })

console.log('mobile view 3d', await mob.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find(
    (b) => b.offsetParent !== null && (b.textContent || '').trim() === 'View in 3D'
  )
  if (!el) return null
  el.click()
  return true
}))
await wait(3000)
await mob.screenshot({ path: path.join(OUT, '19-3d-new-mobile.jpg'), quality: 82, type: 'jpeg' })

console.log('mobile back 2d', await mob.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find(
    (b) => b.offsetParent !== null && (b.textContent || '').trim() === 'Back to 2D'
  )
  if (!el) return null
  el.click()
  return true
}))
await wait(1600)
await mob.screenshot({ path: path.join(OUT, '20-flat-new-mobile.jpg'), quality: 82, type: 'jpeg' })

console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
