import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const shots = async (label, viewport, out) => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
    defaultViewport: viewport,
  })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text())
  })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
  await fs.mkdir(out, { recursive: true })
  await wait(6000)

  const whyY = await page.evaluate(() => {
    const el = document.querySelector('#top')
    return Math.round(0.935 * (el.getBoundingClientRect().height - innerHeight))
  })
  await page.evaluate((y) => scrollTo(0, y), whyY)
  await wait(2600)
  await page.screenshot({ path: path.join(out, label + '-why.jpg'), quality: 86, type: 'jpeg' })

  const flashY = await page.evaluate(() => {
    const el = document.querySelector('#door-exit')
    const r = el.getBoundingClientRect()
    return Math.round(r.top + scrollY + 0.7 * (r.height - innerHeight))
  })
  await page.evaluate((y) => scrollTo(0, y), flashY)
  await wait(2400)
  await page.screenshot({ path: path.join(out, label + '-builders.jpg'), quality: 86, type: 'jpeg' })

  const bounds = await page.evaluate(() => {
    const title = [...document.querySelectorAll('h2')].find((el) => (el.textContent || '').includes('Why Asterion'))
    const flash = [...document.querySelectorAll('div')].find(
      (el) => (el.textContent || '').replace(/\s+/g, ' ').trim() === 'Asterion Builders'
    )
    return {
      why: title ? title.getBoundingClientRect().toJSON() : null,
      flash: flash ? flash.getBoundingClientRect().toJSON() : null,
      doc: { w: document.documentElement.scrollWidth, iw: innerWidth },
      nav: (() => {
        const nav = document.querySelector('header')
        return nav ? { opacity: getComputedStyle(nav).opacity, pe: getComputedStyle(nav).pointerEvents } : null
      })(),
    }
  })
  console.log(label, JSON.stringify(bounds))
  console.log(label, 'errors', errors.slice(0, 10))
  await browser.close()
}

await shots('desk', { width: 1440, height: 900 }, 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa')
await shots(
  'mob',
  { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile'
)
