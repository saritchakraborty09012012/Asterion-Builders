import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args:['--no-sandbox','--hide-scrollbars'], defaultViewport:{width:1440,height:900} })
const page = await browser.newPage()
await page.goto('http://localhost:5173/', { waitUntil:'networkidle2', timeout:120000 })
await wait(4500)
const info = await page.evaluate(() => {
  const el = document.querySelector('#residences')
  const r = el.getBoundingClientRect()
  return { top: r.top + scrollY, height: r.height, vh: innerHeight, docH: document.documentElement.scrollHeight }
})
console.log(info)
await page.evaluate((y) => window.scrollTo(0,y), info.top + 10)
await wait(1500)
const btns = await page.evaluate(() => Array.from(document.querySelectorAll('#residences button')).map(b => ({ t:(b.textContent||'').trim().slice(0,40), aria:b.getAttribute('aria-label'), vis: b.offsetParent !== null, rect:(()=>{const r=b.getBoundingClientRect(); return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]})() })).filter(b=>b.vis))
console.log(btns)
await page.screenshot({path:'C:\\Users\\sarit\\AppData\\Local\\Temp\\opencode\\asterion-qa\\dbg-res.jpg', quality:80, type:'jpeg'})
await browser.close()
