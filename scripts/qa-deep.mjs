import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const URL = 'http://localhost:5173/'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function clickText(page, text, selector = 'button') {
  const ok = await page.evaluate(
    (t, s) => {
      const els = Array.from(document.querySelectorAll(s))
      const el = els.find(
        (e) => e.offsetParent !== null && (e.textContent || '').trim().includes(t)
      )
      if (!el) return false
      el.scrollIntoView({ block: 'center' })
      el.click()
      return true
    },
    text,
    selector
  )
  if (!ok) console.log('MISS click', text)
  return ok
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text())
  })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 })
  await wait(5000)

  const resTop = await page.evaluate(() => {
    const el = document.querySelector('#residences')
    return el ? el.getBoundingClientRect().top + window.scrollY : 0
  })
  await page.evaluate((y) => window.scrollTo(0, y), resTop + 10)
  await wait(1800)

  // open level 5 through the price tag
  const clicked = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button[aria-label^="5TH LEVEL,"]')).find(
      (e) => e.offsetParent !== null
    )
    if (!el) return false
    el.click()
    return true
  })
  console.log('level tag clicked', clicked)
  await wait(1500)
  await page.screenshot({ path: path.join(OUT, '11-level.jpg'), quality: 82, type: 'jpeg' })

  // open flat 0601 from level plate
  await clickText(page, '0601')
  await wait(1300)
  await page.screenshot({ path: path.join(OUT, '12-flat.jpg'), quality: 82, type: 'jpeg' })

  // hover a room by clicking the room list item
  await clickText(page, 'Living')
  await wait(800)
  await page.screenshot({ path: path.join(OUT, '13-roomtag.jpg'), quality: 82, type: 'jpeg' })

  // 3D opens furnished by default
  await clickText(page, 'View in 3D')
  await wait(2600)
  await page.screenshot({ path: path.join(OUT, '14-3d-furnished.jpg'), quality: 82, type: 'jpeg' })

  const unfurnished = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(
      (e) => e.offsetParent !== null && (e.textContent || '').trim() === 'Unfurnished'
    )
    if (!el) return false
    el.click()
    return true
  })
  console.log('unfurnished clicked', unfurnished)
  await wait(2400)
  await page.screenshot({ path: path.join(OUT, '15-3d-unfurnished.jpg'), quality: 82, type: 'jpeg' })

  const decor = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(
      (e) => e.offsetParent !== null && (e.textContent || '').includes('Home decor')
    )
    if (!el) return false
    el.click()
    return true
  })
  console.log('decor clicked', decor)
  await wait(1500)
  await page.screenshot({ path: path.join(OUT, '16-decor.jpg'), quality: 82, type: 'jpeg' })

  console.log('ERRORS:', errors.slice(0, 30))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
