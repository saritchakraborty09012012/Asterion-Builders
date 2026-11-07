import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'video')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"/><style>
html,body{margin:0;background:#08100c;overflow:hidden}canvas{display:block;width:1280px;height:720px}
</style></head><body><canvas id="c" width="1280" height="720"></canvas>
<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = 1280, H = 720;

/* static grain layer */
const grain = document.createElement('canvas');
grain.width = W; grain.height = H;
{
  const g = grain.getContext('2d');
  const img = g.createImageData(W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 80;
    img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v;
    img.data[i+3] = Math.random() * 16;
  }
  g.putImageData(img, 0, 0);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function palmShadow(x, y, s, rot, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(28,38,27,' + alpha + ')';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -78, 13, 82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSwimmer(x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 1.6) * 0.045);

  /* wake */
  for (let i = 0; i < 9; i++) {
    const k = i / 9;
    ctx.beginPath();
    ctx.arc(-52 - i * 17, 0, 10 + i * 7, -0.7, 0.7);
    ctx.strokeStyle = 'rgba(210,235,225,' + (0.22 * (1 - k)) + ')';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const seed = (i * 73 + Math.floor(t * 9) * 17) % 100;
    const bx = -80 - (seed / 100) * 170;
    const by = Math.sin(seed * 0.7 + t * 2) * (14 + (seed % 22));
    ctx.beginPath();
    ctx.arc(bx, by, 1.2 + (seed % 4) * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(225,242,235,' + (0.2 + (seed % 5) * 0.06) + ')';
    ctx.fill();
  }

  /* body */
  ctx.fillStyle = 'rgba(22,38,33,0.92)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  /* head */
  ctx.beginPath();
  ctx.arc(50, 0, 12.5, 0, Math.PI * 2);
  ctx.fill();

  /* legs */
  for (const side of [-1, 1]) {
    const kick = Math.sin(t * 5.2 + (side > 0 ? Math.PI : 0)) * 7;
    ctx.beginPath();
    ctx.moveTo(-38, side * 8);
    ctx.quadraticCurveTo(-62, side * 11 + kick * 0.5, -82, side * 13 + kick);
    ctx.strokeStyle = 'rgba(22,38,33,0.9)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* arms */
  for (const side of [-1, 1]) {
    const phase = side > 0 ? 0 : Math.PI;
    const swing = Math.sin(t * 3.1 + phase);
    const shoulderX = 20;
    const shoulderY = side * 13;
    const ang = -0.55 + swing * 1.15;
    const reach = 42;
    const ex = shoulderX + Math.cos(ang) * reach;
    const ey = shoulderY + Math.sin(ang) * reach * side * 0.6 + side * 6;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.quadraticCurveTo((shoulderX + ex) / 2 + 4, (shoulderY + ey) / 2 - side * 8, ex, ey);
    ctx.strokeStyle = 'rgba(22,38,33,0.86)';
    ctx.lineWidth = 8;
    ctx.stroke();
    if (swing > 0.55) {
      ctx.beginPath();
      ctx.arc(ex + 4, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(226,242,235,0.4)';
      ctx.fill();
    }
  }

  /* highlight along the back */
  ctx.beginPath();
  ctx.ellipse(-4, -4, 42, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,225,215,0.12)';
  ctx.fill();
  ctx.restore();
}

function draw(t) {
  /* deck */
  const dg = ctx.createLinearGradient(0, 0, 0, H);
  dg.addColorStop(0, '#c7b69f');
  dg.addColorStop(0.55, '#d7c7b0');
  dg.addColorStop(1, '#b9a78e');
  ctx.fillStyle = dg;
  ctx.fillRect(0, 0, W, H);

  /* deck tile joints */
  ctx.strokeStyle = 'rgba(74,60,44,0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 118) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 86) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  /* palm shadows on deck */
  palmShadow(80, 80, 1.35, 0.5, 0.14);
  palmShadow(1210, 90, 1.6, -0.7, 0.12);
  palmShadow(1180, 660, 1.1, 2.4, 0.10);

  /* pool shadow */
  ctx.save();
  ctx.shadowColor = 'rgba(20,30,24,0.35)';
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 18;
  roundRect(104, 148, 1072, 464, 8);
  ctx.fillStyle = '#1b4b46';
  ctx.fill();
  ctx.restore();

  /* stone coping */
  roundRect(96, 140, 1088, 480, 12);
  ctx.fillStyle = '#e0d2bc';
  ctx.fill();

  /* water */
  roundRect(112, 156, 1056, 448, 6);
  ctx.save();
  ctx.clip();
  const wg = ctx.createLinearGradient(0, 156, 0, 604);
  wg.addColorStop(0, '#2b5f5a');
  wg.addColorStop(0.4, '#357a72');
  wg.addColorStop(0.75, '#265d57');
  wg.addColorStop(1, '#1b4742');
  ctx.fillStyle = wg;
  ctx.fillRect(112, 156, 1056, 448);

  /* deep end shadow band */
  const sh = ctx.createLinearGradient(0, 156, 0, 604);
  sh.addColorStop(0, 'rgba(6,24,22,0.12)');
  sh.addColorStop(1, 'rgba(6,24,22,0.42)');
  ctx.fillStyle = sh;
  ctx.fillRect(112, 156, 1056, 448);

  /* caustics */
  ctx.globalCompositeOperation = 'screen';
  for (let row = 0; row < 15; row++) {
    const yy = 172 + row * 30;
    ctx.beginPath();
    for (let x = 112; x <= 1168; x += 8) {
      const phase = (x / 1056) * Math.PI * 2.3;
      const y = yy + Math.sin(phase + t * 0.65 + row * 0.5) * (6 + (row % 4) * 2.2);
      if (x === 112) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(172,222,210,' + (0.045 + (row % 5) * 0.012) + ')';
    ctx.lineWidth = row % 4 === 0 ? 2.2 : 1;
    ctx.stroke();
  }

  /* floating light patches */
  for (let i = 0; i < 4; i++) {
    const lx = 240 + i * 240 + Math.sin(t * 0.16 + i * 1.7) * 60;
    const ly = 310 + Math.cos(t * 0.13 + i) * 80;
    const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, 150);
    lg.addColorStop(0, 'rgba(180,232,218,0.11)');
    lg.addColorStop(1, 'rgba(180,232,218,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(lx - 160, ly - 160, 320, 320);
  }
  ctx.globalCompositeOperation = 'source-over';

  /* lane lines */
  ctx.strokeStyle = 'rgba(226,239,231,0.13)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    const y = 156 + (448 / 5) * i;
    ctx.beginPath(); ctx.moveTo(140, y); ctx.lineTo(1140, y); ctx.stroke();
  }
  ctx.setLineDash([10, 22]);
  ctx.strokeStyle = 'rgba(226,239,231,0.10)';
  for (let i = 1; i < 5; i++) {
    const y = 156 + (448 / 5) * i;
    ctx.beginPath(); ctx.moveTo(140, y - 6); ctx.lineTo(1140, y - 6); ctx.stroke();
  }
  ctx.setLineDash([]);

  /* swimmer — loops across and resets off-frame */
  const span = 1500;
  const sx = 1120 - ((t * 46) % span);
  const sy = 380 + Math.sin(t * 0.55) * 22;
  if (sx < 1180) drawSwimmer(sx, sy, t);

  /* waterline highlight */
  const ln = ctx.createLinearGradient(0, 156, 0, 210);
  ln.addColorStop(0, 'rgba(235,245,238,0.18)');
  ln.addColorStop(1, 'rgba(235,245,238,0)');
  ctx.fillStyle = ln;
  ctx.fillRect(112, 156, 1056, 54);

  ctx.restore();

  /* coping highlight */
  ctx.strokeStyle = 'rgba(255,247,232,0.34)';
  ctx.lineWidth = 2;
  roundRect(112, 156, 1056, 448, 6);
  ctx.stroke();

  /* cabanas top right */
  for (let i = 0; i < 4; i++) {
    const x = 880 + i * 82;
    ctx.fillStyle = 'rgba(30,42,33,0.22)';
    ctx.fillRect(x - 6, 44, 64, 46);
    ctx.fillStyle = '#e7dbc8';
    ctx.fillRect(x, 40, 52, 40);
    ctx.fillStyle = '#c7b49a';
    ctx.fillRect(x, 40, 52, 5);
  }

  /* two loungers left */
  for (let i = 0; i < 2; i++) {
    const x = 200 + i * 120;
    ctx.save();
    ctx.translate(x, 640);
    ctx.fillStyle = 'rgba(30,42,33,0.2)';
    ctx.fillRect(-32, 4, 74, 14);
    ctx.fillStyle = '#e6d8c4';
    ctx.fillRect(-36, 0, 62, 12);
    ctx.fillStyle = '#d3c1a8';
    ctx.fillRect(-46, -24, 10, 36);
    ctx.restore();
  }

  /* sun glare */
  const sun = ctx.createLinearGradient(900, 0, 1280, 380);
  sun.addColorStop(0, 'rgba(255,240,210,0.16)');
  sun.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  /* vignette */
  const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 780);
  vg.addColorStop(0, 'rgba(4,10,7,0)');
  vg.addColorStop(1, 'rgba(4,10,7,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  /* grain */
  ctx.drawImage(grain, 0, 0);
}

let start = performance.now();
function loop(now) {
  draw((now - start) / 1000);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.__record = () => new Promise(async (resolve) => {
  const stream = c.captureStream(30);
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = types.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4200000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    const poster = c.toDataURL('image/jpeg', 0.9);
    resolve({ video: btoa(bin), poster });
  };
  rec.start(800);
  setTimeout(() => rec.stop(), 12500);
});
</script></body></html>`

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
    ],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
  page.on('console', (m) => console.log('[page]', m.text()))
  await page.setContent(HTML, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 1200))
  console.log('recording 12.5s...')
  const result = await page.evaluate(() => window.__record())
  await fs.writeFile(path.join(OUT, 'pool.webm'), Buffer.from(result.video, 'base64'))
  const poster = result.poster.replace(/^data:image\/jpeg;base64,/, '')
  await fs.writeFile(path.join(OUT, 'pool-poster.jpg'), Buffer.from(poster, 'base64'))
  console.log('wrote', path.join(OUT, 'pool.webm'))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
