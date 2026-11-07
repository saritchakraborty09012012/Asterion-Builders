import puppeteer from 'puppeteer-core'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(5000)
const top = await page.evaluate(() => Math.round(document.querySelector('#residences').getBoundingClientRect().top + scrollY))
await page.evaluate((y) => scrollTo(0, y), top)
await wait(2500)
await page.touchscreen.tap(20, 300)
await wait(1200)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const raw = (b.textContent || '').replace(/\s+/g, '').toUpperCase()
    return b.offsetParent !== null && /^\d{4}TYPE/.test(raw)
  })
  el?.click()
})
await wait(1200)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('[role="button"][aria-label]')].find((b) => (b.getAttribute('aria-label') || '').toUpperCase().startsWith('BEDROOM'))
  el?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await wait(700)
await page.screenshot({
  path: 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile\\tag-fixed.jpg',
  quality: 86,
  type: 'jpeg',
})
console.log(
  await page.evaluate(() => {
    const tag = [...document.querySelectorAll('div')].find(
      (d) => (d.textContent || '').includes('Wide') && (d.className || '').toString().includes('bg-forest-deep')
    )
    if (!tag) return null
    const r = tag.getBoundingClientRect()
    const p = tag.parentElement.getBoundingClientRect()
    return {
      tag: { x: r.x, y: r.y, w: r.width, h: r.height },
      parent: { x: p.x, y: p.y, w: p.width, h: p.height },
      style: tag.getAttribute('style'),
    }
  })
)
await browser.close()
