import fs from 'node:fs/promises'
import path from 'node:path'
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
await wait(6000)

const clickVisible = (text, exact = false) =>
  page.evaluate(
    (t, ex) => {
      const b = [...document.querySelectorAll('button')].find((el) => {
        if (el.offsetParent === null) return false
        const s = (el.textContent || '').replace(/\s+/g, ' ').trim()
        return ex ? s === t : s.includes(t)
      })
      b?.click()
      return Boolean(b)
    },
    text,
    exact
  )

const residenceTop = await page.evaluate(
  () => document.querySelector('#residences').getBoundingClientRect().top + window.scrollY
)
await page.evaluate((y) => window.scrollTo(0, y), residenceTop + 200)
await wait(2200)

const levelOpen = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#residences button[aria-label]')].find((el) =>
    (el.getAttribute('aria-label') || '').startsWith('8TH LEVEL')
  )
  b?.click()
  return Boolean(b)
})
console.log('level open', levelOpen)
await wait(1400)

for (const idx of [0, 1, 2, 3]) {
  const number = `09${String(idx + 1).padStart(2, '0')}`
  const opened = await page.evaluate((n) => {
    const b = [...document.querySelectorAll('button')].find((el) => {
      if (el.offsetParent === null) return false
      const s = (el.innerText || '').replace(/\s+/g, ' ').trim()
      return s.startsWith(n + ' ')
    })
    b?.click()
    return b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : null
  }, number)
  console.log('flat', number, opened)
  await wait(1300)
  await page.screenshot({ path: path.join(OUT, `a${idx + 1}-${number}-plan.jpg`), quality: 86, type: 'jpeg' })

  const rooms = await page.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].find(
      (el) => el.getAttribute('viewBox') === '-12 -26 684 530' && el.getBoundingClientRect().width > 300
    )
    if (!svg) return null
    return [...svg.querySelectorAll('text')]
      .map((t) => (t.textContent || '').trim())
      .filter((t) => t.length > 2)
  })
  console.log('plan text', rooms?.slice(0, 24))

  const three = await clickVisible('View in 3D')
  console.log('3d', number, three)
  await wait(2600)
  await page.screenshot({ path: path.join(OUT, `b${idx + 1}-${number}-3d.jpg`), quality: 86, type: 'jpeg' })

  console.log('back 2d', await clickVisible('Back to 2D', true))
  await wait(900)
  console.log('back level', await clickVisible('Back to level', true))
  await wait(900)
}

console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
