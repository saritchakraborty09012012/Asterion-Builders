import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(6000)
await page.evaluate(() => {
  const el = document.querySelector('#amenities')
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
})
await wait(2600)
const state = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#amenities button')].filter((b) => /Zen Garden|Yoga Studio|Padel|Kids Play/.test(b.innerText))
  return rows.map((b) => ({
    text: (b.innerText || '').split('\n')[0],
    cls: b.className,
    nameColor: getComputedStyle(b.querySelector('.relative span')).color,
    numColor: getComputedStyle(b.querySelector('span')).color,
    firstNumColor: getComputedStyle(b.querySelector('span.text-\\[0\\.46rem\\]') || b.querySelector('span')).color,
  }))
})
console.log(JSON.stringify(state, null, 2))
// hover row 1 then inspect
await page.mouse.move(200, 444)
await wait(800)
const hover = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#amenities button')].filter((b) => /Zen Garden|Padel|Kids Play/.test(b.innerText))
  return rows.map((b) => ({
    text: (b.innerText || '').split('\n')[0],
    cls: b.className,
    nameColor: getComputedStyle(b.querySelector('.relative span')).color,
  }))
})
console.log('HOVER', JSON.stringify(hover, null, 2))
await browser.close()
