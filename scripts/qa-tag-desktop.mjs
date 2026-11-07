import puppeteer from 'puppeteer-core'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(5000)
const top = await page.evaluate(() => Math.round(document.querySelector('#residences').getBoundingClientRect().top + scrollY))
await page.evaluate((y) => scrollTo(0, y), top)
await wait(2600)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button[aria-label]')].find(
    (b) => b.offsetParent !== null && (b.getAttribute('aria-label') || '').startsWith('5TH LEVEL,')
  )
  el?.click()
})
await wait(1200)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => {
    const raw = (b.textContent || '').replace(/\s+/g, '').toUpperCase()
    return b.offsetParent !== null && /^\d{4}TYPE/.test(raw)
  })
  el?.click()
})
await wait(3000)
console.log(
  'sheet opacity',
  await page.evaluate(() => {
    const sheet = [...document.querySelectorAll('div')].find((d) => (d.className || '').toString().includes('z-[130]'))
    return sheet ? getComputedStyle(sheet).opacity : null
  })
)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('[role="button"][aria-label]')].find((b) =>
    (b.getAttribute('aria-label') || '').toUpperCase().startsWith('BEDROOM')
  )
  el?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await wait(1500)
await page.screenshot({
  path: 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa\\tag-desktop-fixed.jpg',
  quality: 84,
  type: 'jpeg',
})
console.log(
  await page.evaluate(() => {
    const tag = [...document.querySelectorAll('div')].find(
      (d) => (d.textContent || '').includes('Wide') && (d.className || '').toString().includes('bg-forest-deep')
    )
    if (!tag) return null
    const r = tag.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, iw: innerWidth, ih: innerHeight }
  })
)
console.log('ERRORS', errors.slice(0, 10))
await browser.close()
