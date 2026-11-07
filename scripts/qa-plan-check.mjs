import fs from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const URL = 'http://localhost:5173/'
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
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 120000 })
await fs.mkdir(OUT, { recursive: true })
await wait(5000)

const clickVisible = (text) =>
  page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((el) => {
      if (el.offsetParent === null) return false
      return (el.textContent || '').replace(/\s+/g, ' ').trim().includes(t)
    })
    b?.click()
    return Boolean(b)
  }, text)

const resTop = await page.evaluate(
  () => document.querySelector('#residences').getBoundingClientRect().top + window.scrollY
)
await page.evaluate((y) => window.scrollTo(0, y), resTop + 300)
await wait(2400)
await page.screenshot({ path: `${OUT}/n1-tower.png` })

const levelOpen = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#residences button[aria-label]')].find((el) =>
    (el.getAttribute('aria-label') || '').startsWith('8TH LEVEL')
  )
  b?.click()
  return Boolean(b)
})
console.log('level', levelOpen)
await wait(1400)
await page.screenshot({ path: `${OUT}/n2-level.png` })

await clickVisible('0901')
await wait(1200)
await page.screenshot({ path: `${OUT}/n3-flat.png` })

await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) =>
    (b.textContent || '').toLowerCase().includes('living')
  )
  el?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
  el?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
})
await wait(500)
await page.screenshot({ path: `${OUT}/n4-flat-active.png` })

await clickVisible('View in 3D')
await wait(4200)
await page.screenshot({ path: `${OUT}/n5-3d.png` })

await clickVisible('Home decor')
await wait(1000)
await page.screenshot({ path: `${OUT}/n6-decor.png` })

console.log('errors', errors)
await browser.close()
