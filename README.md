# Asterion Residence — cinematic real-estate experience

A scroll-driven, cinematic property website for **Asterion Residence**, Sector 137,
Noida Expressway, Noida (near Delhi), India.

Built with **React 18 · TypeScript · Vite · Three.js / React Three Fiber · Tailwind CSS ·
GSAP · Lenis · Framer Motion**, plus a small **Express** API for enquiries.

The site opens on a full-screen cinematic hero, then moves through the story of the
building — the rise of the tower, the residences and their floor plans, interiors,
amenities, a rooftop film, an aerial "everything, close" location view with a real
street map, and a contact/footer block. Everything below the hero is tuned for
legibility; the hero's low-contrast labels are intentional.

---

## Quick start

```bash
npm install
npm run dev
```

- **Web:** http://localhost:5173
- **API:** http://localhost:8787 (proxied from Vite as `/api`)

`npm run dev` runs Vite and the Express API together via `concurrently`.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server + Express API together |
| `npm run client` | Vite dev server only |
| `npm run build` | Type-check (`tsc -b`) then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm start` | Run the Express server (serves `dist/` + API, port `8787`) |

### Production

```bash
npm run build
npm start
```

The Express server serves the built `dist/` folder and the API on port `8787`
(`PORT` env var overrides it).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 + TypeScript, Vite 5 |
| Styling | Tailwind CSS + custom classes in `src/index.css` (`.display`, `.eyebrow`, `.micro`, `.body-copy`) |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` |
| Motion | GSAP (scroll timelines), Framer Motion (layout/entrance), Lenis (smooth scroll) |
| Fonts | Jost, Fraunces, Cormorant Garamond (`@fontsource/*`) |
| API | Express + CORS, JSON file storage, rate limiting |
| Tooling | `puppeteer-core` for QA screenshots, Blender/Python for asset generation |

---

## Project structure

```
index.html                  Vite entry, font + meta tags
vite.config.ts              dev server, /api proxy → :8787
tailwind.config.js          design tokens (colours, typography)
tsconfig.json               TS project references (tsc -b)

src/
  main.tsx / App.tsx        page composition, Lenis smooth scroll, preloader gate
  index.css                 base type scale, grain, custom utilities
  lib/scroll.ts             shared Lenis instance (sections subscribe to it)

  sections/                 one file per chapter of the page, in order:
    Cinematic.tsx           HERO — deliberately low-contrast labels (do not "fix")
    Residences.tsx          tower explorer: floor tags, level/flat hash routes, pricing
    Entry.tsx               arrival / entrance story
    Story.tsx               Arches, Gallery, SlowLiving, SideWipe, UpwardFade blocks
    Rooms.tsx               interiors chapter
    Amenities.tsx           amenity grid
    Pool.tsx                rooftop pool film section
    TopView.tsx             "Everything, close." aerial + real street map + address card
    Closing.tsx             contact (#contact) + footer, SAMPLE watermarks

  components/
    Preloader.tsx           asset/scene warm-up curtain
    Nav.tsx                 fixed navigation
    Cursor.tsx              custom cursor
    FlatViewer.tsx          interactive 3D floor plan (shell ↔ furnished, room labels)
    FloorPlan.tsx           2D plan rendering
    Tower.tsx / World.tsx   tower scene, world lighting, community models
    AmenityArt.tsx          amenity illustrations
    ui.tsx                  Label, Arrow and other primitives
    SitePlan.tsx            legacy drawn plan (superseded by the real map image)

  three/                    scroll.ts helpers, camera rigs, tower assembly
  data/site.ts              ALL copy + data: flat types, levels, rooms, amenities,
                            distances, stats, specs, site contact details

public/
  models/asterion.glb       procedural tower (15 floors + crown + podium)
  images/                   renders, cloud plates, amenity photos,
                            map-location.png (real street map of Sector 137)
  video/pool-new.mp4        rooftop pool film + poster

server/
  index.js                  Express API (enquiries + health), rate limited
  data/enquiries.json       created at runtime

blender/                    asset pipeline (Python)
  build_tower.py            procedural tower, site, cameras, GLB export
  build_rooms.py            four interior scenes
  build_rooftop.py          rooftop scene
  build_interiors.py        shared interior helpers
  render_views.py           CLI still renderer
  probe_models.py           scene inspection helpers

reference/                  working material, never shipped to the browser
  source/                   stock/aerial plates + model/texture library
  frames/  keyframes/       film frames and selected stills (git-ignored where disposable)
  sheets/  renders/         contact sheets and preview renders
  archive/  generated/  qa/ (git-ignored)
```

---

## How the page works

1. **Preloader** warms the GLB and hero plates, then releases the scroll.
2. **Lenis** drives smooth scrolling; GSAP timelines and per-frame damping in the
   Three.js components read the shared scroll instance (`src/lib/scroll.ts`).
3. **Sections** mount lazily — 3D canvases only create their WebGL context when
   an `IntersectionObserver` says they are within ~500px of the viewport, so the
   page never runs more than a couple of live scenes at once.
4. **Hero (`Cinematic.tsx`)** is intentionally atmospheric: labels there are
   low-contrast by design. Every other section is held to a site-wide contrast
   pass (ink opacities ≥ ~75%, text-shadow halos over busy imagery).

### Residences — floors, tags and routes

- The tower in the browser matches the hero: same scale/rotation/lighting, and it
  is perfectly vertical.
- **Level tags** are locked to their floors by projecting the 3D floor position to
  screen space every frame. Labels read `GROUND`, `LEVEL-1` … `LEVEL-14` on a single
  line; clicking a tag jumps straight to that level.
- On **phones**, tag centres are spread apart (min gap, fixed band top/bottom) so
  the text stays readable, while each leader line still angles back to the true
  projected floor. Desktop rails are untouched.
- Deep links: `#/level/13` opens level 13, `#/flat/1401` opens a specific flat.

### Flat viewer

`FlatViewer.tsx` renders a real 3D plan of each flat type — walls, glazing,
furniture (furnished) or bare shell — with floating room labels.

- **Desktop:** chip centred on the room anchor (unchanged).
- **Phone:** the chip is lifted clear above the model with an angled leader line
  drawn back down to the room's floor point, so the plan is never buried under
  its own labels.

### Location — "Everything, close."

- Aerial 3D orbit of the community over a graded gradient plate.
- Annotations and distances use high-contrast ink with light halos — legible on
  phone, laptop and wide screens alike.
- The address card carries a **SAMPLE** watermark (as does `#contact` and the
  footer) — this is a demonstration site, not a live listing.
- The location image is a **real street map** of Sector 137, Noida
  (`public/images/map-location.png`, 1024×768) with a pulsing site marker,
  attributed to its map data source in the UI.

#### Regenerating the map

`public/images/map-location.png` is stitched from raster tiles, centred on
28.509° N / 77.407° E at zoom 15. The build script lives outside the repo (it was
run ad-hoc); the recipe is:

```text
lat/lon → web-mercator global pixel → tile range → download 256px tiles →
stitch → crop 1024×768 centred on the site → save PNG
```

Any tile source that allows static use can be substituted; keep the attribution
string in `TopView.tsx` in sync with whatever source you use.

---

## Data model (`src/data/site.ts`)

Everything copy- and content-related lives in one module:

- `FLAT_TYPES` — four 2 BHK types (A–D): area, balcony, aspect, base price.
- `LEVELS` — 15 levels (Ground + 14 + penthouse), each with title, ordinal label,
  price curve and per-flat units; `LEVEL_TAGS` derives the tag data.
- `ROOMS` / room rectangles — drive both the 2D plans and the 3D room labels.
- `DECOR_IDEAS` — furnish/styling toggle content for the flat viewer.
- `AMENITIES`, `AMENITY_IMAGES`, `DISTANCES`, `STATS`, `SPECS` — section content.
- `SITE` — project name, address, coordinates (`28.51° N`, `77.41° E`), phone, email.

Edit this file to rebrand or re-copy the site; components read from it and do not
hard-code marketing text.

---

## API

`POST /api/enquiry`

```json
{
  "name": "…",
  "email": "…",
  "phone": "…",
  "interest": "Type B",
  "message": "…"
}
```

- JSON body limited to 48 KB.
- Validated server-side, rate limited (6 requests / hour / IP).
- Stored in `server/data/enquiries.json` (created on first run).
- CORS restricted to `localhost` / `127.0.0.1` dev origins; Vite proxies `/api`.

`GET /api/health` → `{ ok, service, time }`

---

## Accessibility & responsiveness

- Type scale is clamp()-based; sections reflow to single column below `lg`.
- Contrast: non-hero copy targets ink/75–ink/90 with shadows where it sits over
  imagery or 3D. Hero excepted by design.
- `prefers-reduced-motion` — animations degrade to static framing where supported.
- Interactive floor/flat selection is keyboard reachable through native buttons.
- 3D canvases are decorative (`aria-hidden` semantics on overlays) and labels are
  presentational; the same information exists as text in the data module.

---

## Deployment

Any static host works for the client; the API needs a Node host.

```bash
npm run build          # → dist/
npm start              # serves dist/ + /api on :8787
```

For a static host (Netlify, Vercel, GitHub Pages, S3…):

- Publish `dist/` as the root.
- Set `VITE`-free config — no env vars are required by the client.
- Point the enquiry form at your own `/api` endpoint, or disable submission.

Ensure the host serves `public/models/asterion.glb` and `public/video/*` with
correct MIME types and long cache headers (they are large and immutable).

---

## Credits & attribution

- **Map data:** map image generated from raster map tiles — see the attribution
  label rendered in `TopView.tsx`; keep it accurate to the source used.
- **Fonts:** Jost, Fraunces, Cormorant Garamond (SIL Open Font License, via Fontsource).
- **3D:** procedural tower and interiors authored in Blender
  (`blender/build_*.py`) and exported to `public/models/asterion.glb`.
- **Reference plates / stock media:** under `reference/source/`, used for grading
  and stills only — not read by the running site.
- **Photography:** demonstration imagery in `public/images/` (amenity, interior
  and facade plates) — placeholder material for a concept site.

---

## License

Licensed under the **Apache License 2.0** — see [LICENSE](./LICENSE).

---

## Notes

- Renderings, floor plans, prices and distances are **artist's impressions and
  sample data** for a concept/demo site. Every page carries a **SAMPLE** watermark
  in the contact/footer and address card.
- The browser tower is the same GLB used for renders, merged per floor by material
  to keep draw calls low; assembly, camera and level highlight are scroll- and
  pointer-driven, damped per frame.
- `reference/` is working material and is never bundled; `reference/frames/` and
  other disposable output directories are git-ignored.
- Known build warning: one chunk exceeds 500 kB (the Three.js bundle). It is
  expected and not an error.
