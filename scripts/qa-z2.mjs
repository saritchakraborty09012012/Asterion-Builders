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
await wait(1600)
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
await wait(900)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) =>
    (el.textContent || '').includes('View in 3D')
  )
  b?.click()
})
await wait(3000)
const chain = await page.evaluate(() => {
  let el = document.querySelector('.fixed.inset-0.z-\\[140\\]')
  const out = []
  while (el && el !== document.documentElement) {
    const s = getComputedStyle(el)
    out.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 60),
      z: s.zIndex,
      pos: s.position,
      transform: s.transform,
      filter: s.filter,
      opacity: s.opacity,
      overflow: s.overflow,
      isolation: s.isolation,
      willChange: s.willChange,
      contain: s.contain,
    })
    el = el.parentElement
  }
  return out
})
console.log(JSON.stringify(chain, null, 1))
await browser.close()
