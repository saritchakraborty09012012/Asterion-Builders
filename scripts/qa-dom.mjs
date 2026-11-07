import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(5000)
const resTop = await page.evaluate(() => {
  const el = document.querySelector('#residences')
  return el ? el.getBoundingClientRect().top + window.scrollY : 0
})
await page.evaluate((y) => window.scrollTo(0, y), resTop + 10)
await wait(1500)
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button[aria-label^="Level 5,"]')).find(
    (e) => e.offsetParent !== null
  )
  el?.click()
})
await wait(3000)
const info = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('body *').forEach((el) => {
    const s = getComputedStyle(el)
    if (s.position === 'fixed' && s.display !== 'none' && parseFloat(s.opacity) > 0) {
      const r = el.getBoundingClientRect()
      if (r.width > 200 && r.height > 200) {
        out.push({
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 120),
          z: s.zIndex,
          opacity: s.opacity,
          bg: s.backgroundColor,
          rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        })
      }
    }
  })
  const heading = document.querySelector('#residences h3')
  const overlay = Array.from(document.querySelectorAll('#residences div')).find((d) =>
    (d.className || '').toString().includes('fixed inset-0 z-[120]')
  )
  return {
    fixed: out,
    headingColor: heading ? getComputedStyle(heading).color : null,
    overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null,
    bodyText: getComputedStyle(document.body).color,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
