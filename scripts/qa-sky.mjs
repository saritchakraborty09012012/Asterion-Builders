import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const VH = 900

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 1440, height: VH },
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(6500)

const info = await page.evaluate(() => {
  const el = document.querySelector('#top')
  return { top: el.getBoundingClientRect().top + window.scrollY, height: el.offsetHeight }
})
for (const p of [0.12, 0.16, 0.2, 0.26, 0.32, 0.44, 0.6, 0.76, 0.9, 0.99]) {
  const y = info.top + p * (info.height - VH)
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(2400)
  const name = `sky${String(Math.round(p * 100)).padStart(2, '0')}`
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 84, type: 'jpeg' })
  console.log('shot', name)
}
console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
