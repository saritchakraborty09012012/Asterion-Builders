import express from 'express'
import cors from 'cors'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'enquiries.json')
const PORT = Number(process.env.PORT || 8787)

const app = express()
app.use(cors({ origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/ }))
app.use(express.json({ limit: '48kb' }))

const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  const entry = hits.get(ip) || { count: 0, start: now }
  if (now - entry.start > windowMs) {
    entry.count = 0
    entry.start = now
  }
  entry.count += 1
  hits.set(ip, entry)
  return entry.count > 6
}

await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'asterion-api', time: new Date().toISOString() })
})

app.post('/api/enquiry', async (req, res) => {
  try {
    const ip = req.ip || 'unknown'
    if (rateLimited(ip)) {
      return res
        .status(429)
        .json({ error: 'Too many enquiries. Please try again later.' })
    }

    const clean = (v, max = 400) =>
      String(v ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .trim()
        .slice(0, max)

    const name = clean(req.body?.name, 120)
    const email = clean(req.body?.email, 180)
    const phone = clean(req.body?.phone, 40)
    const interest = clean(req.body?.interest, 80) || 'General enquiry'
    const message = clean(req.body?.message, 1200)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)

    if (name.length < 2) {
      return res.status(400).json({ error: 'Please enter your name.' })
    }
    if (!emailOk) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }

    let entries = []
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) entries = parsed
    } catch {
      entries = []
    }

    const enquiry = {
      id: `AST-${Date.now().toString(36).toUpperCase()}`,
      name,
      email,
      phone,
      interest,
      message,
      receivedAt: new Date().toISOString(),
      source: 'asterion.in',
    }

    entries.push(enquiry)
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8')

    console.log(
      `[enquiry] ${enquiry.id} · ${name} · ${email} · ${interest}`
    )
    return res.status(201).json({ ok: true, id: enquiry.id })
  } catch (err) {
    console.error('[enquiry] failed', err)
    return res.status(500).json({
      error: 'We could not send your enquiry. Please try again.',
    })
  }
})

// Serve the built site when running `npm start` after `npm run build`.
const DIST = path.join(ROOT, 'dist')
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(DIST, 'index.html'))
  })
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`ASTERION API listening on http://localhost:${PORT}`)
})
