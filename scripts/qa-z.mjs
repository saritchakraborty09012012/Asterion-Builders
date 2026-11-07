import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(4000)
const top = await page.evaluate(
  () => document.querySelector('#residences').getBoundingClientRect().top + window.scrollY
)
await page.evaluate((y) => window.scrollTo(0, y), top + 300)
await wait(1800)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('#residences button[aria-label]')].find((el) =>
    (el.getAttribute('aria-label') || '').startsWith('8TH LEVEL')
  )
  b?.click()
})
await wait(1200)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) =>
    (el.textContent || '').includes('0901')
  )
  b?.click()
})
await wait(1000)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) =>
    (el.textContent || '').includes('View in 3D')
  )
  b?.click()
})
await wait(3500)
const info = await page.evaluate(() => {
  const els = document.elementsFromPoint(720, 20).map((e) => ({
    tag: e.tagName,
    cls: String(e.className).slice(0, 90),
    z: getComputedStyle(e).zIndex,
    pos: getComputedStyle(e).position,
  }))
  const viewer = document.querySelector('.fixed.inset-0.z-\\[140\\]')
  return { els, viewer: viewer ? getComputedStyle(viewer).zIndex : null }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
