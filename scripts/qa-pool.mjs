import fs from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(5000)
const top = await page.evaluate(() => document.querySelector('#pool').getBoundingClientRect().top + window.scrollY)
await page.evaluate((y) => window.scrollTo(0, y), top + 10)
await wait(3000)
const info = await page.evaluate(() => {
  const v = document.querySelector('#pool video')
  if (!v) return null
  const r = v.getBoundingClientRect()
  const s = getComputedStyle(v)
  const c = document.createElement('canvas')
  c.width = v.videoWidth
  c.height = v.videoHeight
  const ctx = c.getContext('2d')
  try {
    ctx.drawImage(v, 0, 0)
  } catch (e) {
    return { err: String(e) }
  }
  return {
    rect: [r.x, r.y, r.width, r.height],
    opacity: s.opacity,
    display: s.display,
    visibility: s.visibility,
    ready: v.readyState,
    paused: v.paused,
    time: v.currentTime,
    data: c.toDataURL('image/jpeg', 0.8),
  }
})
if (info?.data) {
  await fs.writeFile(OUT + '\\pool-canvas.jpg', Buffer.from(info.data.split(',')[1], 'base64'))
}
console.log({ ...info, data: info?.data ? 'saved' : null })
await page.screenshot({ path: OUT + '\\pool-diag.jpg', quality: 82, type: 'jpeg' })
await browser.close()
