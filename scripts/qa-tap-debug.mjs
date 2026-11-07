import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text())
})
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(6000)
const top = await page.evaluate(
  () => document.querySelector('#residences').getBoundingClientRect().top + window.scrollY
)
await page.evaluate((y) => window.scrollTo(0, y), top)
await wait(3000)

console.log(
  await page.evaluate(() => {
    const pts = [
      [150, 360],
      [150, 300],
      [200, 450],
      [100, 500],
      [330, 300],
    ]
    return {
      scrollY,
      canvases: Array.from(document.querySelectorAll('canvas')).map((c) => {
        const r = c.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height, pe: getComputedStyle(c).pointerEvents }
      }),
      points: pts.map(([x, y]) => {
        const el = document.elementFromPoint(x, y)
        return { x, y, tag: el?.tagName, cls: el?.className?.toString?.().slice(0, 120) }
      }),
    }
  })
)

/* try synthetic pointer events on canvas */
const synth = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return 'no canvas'
  const r = c.getBoundingClientRect()
  const x = r.x + 150
  const y = r.y + 360
  const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 }
  c.dispatchEvent(new PointerEvent('pointerdown', opts))
  c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }))
  c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }))
  return { x, y, r: { x: r.x, y: r.y, w: r.width, h: r.height } }
})
console.log('synth', synth)
await wait(1200)
console.log('open after synth', await page.evaluate(() => document.body.innerText.includes('Back to the tower')))

/* touchscreen tap */
if (!(await page.evaluate(() => document.body.innerText.includes('Back to the tower')))) {
  await page.touchscreen.tap(150, 360)
  await wait(1200)
  console.log('open after touch', await page.evaluate(() => document.body.innerText.includes('Back to the tower')))
}

/* click price tag via mouse coordinates */
if (!(await page.evaluate(() => document.body.innerText.includes('Back to the tower')))) {
  const box = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#residences button')).find((el) =>
      (el.getAttribute('aria-label') || '').toLowerCase().startsWith('5th level')
    )
    const r = b?.getBoundingClientRect()
    return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2, label: b.getAttribute('aria-label') } : null
  })
  console.log('tag box', box)
  if (box) {
    await page.mouse.click(box.x, box.y)
    await wait(1200)
    console.log('open after tag mouse', await page.evaluate(() => document.body.innerText.includes('Back to the tower')))
    if (!(await page.evaluate(() => document.body.innerText.includes('Back to the tower')))) {
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('#residences button')).find((el) =>
          (el.getAttribute('aria-label') || '').toLowerCase().startsWith('5th level')
        )
        b?.click()
      })
      await wait(1200)
      console.log('open after tag programmatic', await page.evaluate(() => document.body.innerText.includes('Back to the tower')))
    }
  }
}

await browser.close()
