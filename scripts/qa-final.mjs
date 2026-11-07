import puppeteer from 'puppeteer-core'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
})
const errors = []

const check = async (label, viewport) => {
  const page = await browser.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(label + ' console: ' + m.text())
  })
  page.on('pageerror', (e) => errors.push(label + ' pageerror: ' + e.message))
  await page.setViewport(viewport)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
  await wait(5500)
  const result = await page.evaluate(() => {
    const body = (document.body.innerText || '').replace(/\s+/g, ' ')
    const sheet = document.querySelector('#door-exit')
    return {
      title: document.title,
      hasWhyAsterion: /Why Asterion Builders\?/i.test(body),
      hasBuildersFlash: /Asterion Builders/i.test(body),
      hasXYZ: /XYZ/i.test(body),
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      doorExit: !!sheet,
      nav: !!document.querySelector('header'),
      canvases: document.querySelectorAll('canvas').length,
    }
  })
  await page.close()
  return { label, ...result }
}

console.log(
  await check('desktop', { width: 1440, height: 900 })
)
console.log(
  await check('mobile', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
)
console.log('ERRORS', errors.slice(0, 20))
await browser.close()
