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
  const r = el.getBoundingClientRect()
  return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height), doc: document.documentElement.scrollHeight }
})
console.log(info)

const marks = [0, 0.03, 0.06, 0.1, 0.14, 0.18, 0.24, 0.3, 0.38, 0.44, 0.48, 0.52, 0.6, 0.68, 0.76, 0.82, 0.86, 0.9, 0.95, 0.99]
for (const p of marks) {
  const y = info.top + p * (info.height - VH)
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y))
  await wait(p === 0 ? 1500 : 2400)
  const actual = await page.evaluate(() => {
    const el = document.querySelector('#top')
    return {
      scrollY: Math.round(window.scrollY),
      progress: +(window.scrollY / (el.offsetHeight - window.innerHeight)).toFixed(3),
    }
  })
  const name = `o${String(Math.round(p * 100)).padStart(2, '0')}`
  await page.screenshot({ path: path.join(OUT, name + '.jpg'), quality: 84, type: 'jpeg' })
  console.log('shot', name, actual)
}

console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
