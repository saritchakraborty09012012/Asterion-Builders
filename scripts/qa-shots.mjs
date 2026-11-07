import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const URL = 'http://localhost:5173/'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

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
  await wait(6000)

  const info = await page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    const rect = (s) => {
      const el = q(s)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: r.top + window.scrollY, height: r.height }
    }
    return {
      docHeight: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
      sections: {
        top: rect('#top'),
        residences: rect('#residences'),
        entry: rect('#entry'),
        interiors: rect('#interiors'),
        rooms: rect('#rooms'),
        amenities: rect('#amenities'),
        pool: rect('#pool'),
        location: rect('#location'),
        contact: rect('#contact'),
      },
    }
  })
  console.log(JSON.stringify(info, null, 2))

  const shots = [
    ['01-opening', 0],
    ['02-dive', info.sections.top.height * 0.12],
    ['03-clouds', info.sections.top.height * 0.22],
    ['04-community', info.sections.top.height * 0.36],
    ['05-orbit', info.sections.top.height * 0.5],
    ['06-ready', info.sections.top.height * 0.57],
    ['07-construction', info.sections.top.height * 0.72],
    ['08-builders', info.sections.top.height * 0.83],
    ['09-complete', info.sections.top.height * 0.95],
    ['10-tower', info.sections.residences.top + 50],
  ]
  for (const [name, y] of shots) {
    await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
    await wait(1400)
    await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 82, type: 'jpeg' })
    console.log('shot', name, Math.round(y))
  }

  console.log('ERRORS:', errors.slice(0, 30))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
