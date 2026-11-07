import fs from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

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
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(5000)

for (const id of ['amenities', 'pool', 'location', 'contact']) {
  const top = await page.evaluate((x) => {
    const el = document.querySelector('#' + x)
    return el ? el.getBoundingClientRect().top + window.scrollY : null
  }, id)
  console.log(id, top)
  if (top == null) continue
  await page.evaluate((y) => window.scrollTo(0, y + 20), top)
  await wait(1600)
  await page.screenshot({ path: `${OUT}/s-${id}.png` })
}

// manifesto sits just before the address
const story = await page.evaluate(() => {
  const all = [...document.querySelectorAll('section')]
  const s = all.find((el) => (el.textContent || '').includes('A quiet manifesto'))
  return s ? s.getBoundingClientRect().top + window.scrollY : null
})
console.log('manifesto', story)
if (story != null) {
  await page.evaluate((y) => window.scrollTo(0, y - 80), story)
  await wait(1200)
  await page.screenshot({ path: `${OUT}/s-manifesto.png` })
}

console.log('errors', errors)
await browser.close()
