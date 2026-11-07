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

const click = (text, exact = false) =>
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

const openFlat = async () => {
  const resTop = await page.evaluate(
    () => document.querySelector('#residences').getBoundingClientRect().top + window.scrollY
  )
  await page.evaluate((y) => window.scrollTo(0, y), resTop + 200)
  await wait(1600)
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('#residences button[aria-label]')].find((el) =>
      (el.getAttribute('aria-label') || '').startsWith('5TH LEVEL')
    )
    b?.click()
  })
  await wait(1300)
  const flat = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(
      (el) => el.offsetParent !== null && /(^|\s)0601(\s|$)/.test((el.innerText || '').replace(/\s+/g, ' ').trim())
    )
    b?.click()
    return b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : null
  })
  console.log('flat open', flat)
  await wait(1200)
}

const state = () =>
  page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    entryTop: Math.round(
      document.querySelector('#entry').getBoundingClientRect().top + window.scrollY
    ),
    overflow: document.body.style.overflow,
    viewer: [...document.querySelectorAll('button')].some(
      (el) => el.offsetParent !== null && (el.textContent || '').trim() === 'Back to 2D'
    ),
    sheet: [...document.querySelectorAll('button')].some(
      (el) => el.offsetParent !== null && (el.textContent || '').trim() === 'Back to level'
    ),
  }))

// path 1: 3D viewer -> continue to site
await openFlat()
console.log('view 3d', await click('View in 3D'))
await wait(2200)
console.log('continue 3d', await click('Continue to site'))
await wait(2200)
console.log('after 3d continue', await state())
await page.screenshot({ path: path.join(OUT, '70-continue-3d.jpg'), quality: 84, type: 'jpeg' })

// path 2: 2D plan -> continue to site
await openFlat()
console.log('continue 2d', await click('Continue to site'))
await wait(2200)
console.log('after 2d continue', await state())
await page.screenshot({ path: path.join(OUT, '71-continue-2d.jpg'), quality: 84, type: 'jpeg' })

console.log('ERRORS:', errors.slice(0, 20))
await browser.close()
