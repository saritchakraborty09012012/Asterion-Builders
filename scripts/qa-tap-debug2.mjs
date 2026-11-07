import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--hide-scrollbars'], defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } })
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 120000 })
await wait(6000)
const top = await page.evaluate(() => document.querySelector('#residences').getBoundingClientRect().top + window.scrollY)
await page.evaluate((y) => window.scrollTo(0, y), top)
await wait(3000)
await page.mouse.click(150, 360)
await wait(1200)
console.log(await page.evaluate(() => ({
  hasLevel: document.body.innerText.toUpperCase().includes('BACK TO THE TOWER'),
  hasFlat: document.body.innerText.toUpperCase().includes('THE PLAN'),
  text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 400),
})))
await page.screenshot({ path: 'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa-mobile\\debug-after-tap.jpg', quality: 82, type: 'jpeg' })
await browser.close()
