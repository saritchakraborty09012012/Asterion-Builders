# ASTERION — cinematic real-estate experience

A scroll-driven, cinematic property website for **Asterion Residence**, Al Furjan, Dubai.
Built with React 18, TypeScript, Vite, Three.js / React Three Fiber, Tailwind, GSAP and Lenis.

## Run it

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:8787

`npm run dev` starts Vite and the Express API together.

Production:

```bash
npm run build
npm start
```

The Express server serves `dist/` and the API on port `8787`.

## Structure

```
src/
  App.tsx                 page composition, Lenis smooth scroll
  components/             preloader, cursor, nav, floor plans, site plan, UI primitives
  sections/               hero, rise, city, architecture, residences, interiors, amenities,
                          editorial, philosophy, wellness, rooftop, location, wordmark, contact, footer
  three/Tower.tsx         GLB loading + per-floor merge, scroll assembly, level highlight, camera rigs
  data/site.ts            residences, amenities, rooms, distances, copy
public/
  models/asterion.glb     procedural tower (15 floors + crown + podium)
  images/                 final renders and graded aerial/cloud plates
server/
  index.js                Express API + enquiry storage
  data/enquiries.json     created at runtime
reference/                working material (not shipped)
  frames/                 reference film frames at 30 fps
  keyframes/              selected stills
  sheets/                 contact sheets
  source/                 stock/aerial plates + model/texture library
  renders/                preview renders
blender/
  build_tower.py          procedural tower, site, cameras, GLB export
  build_rooms.py          four interior scenes
  build_interiors.py      shared interior helpers
  render_views.py         CLI still renderer
```

## API

`POST /api/enquiry`

```json
{
  "name": "…",
  "email": "…",
  "phone": "…",
  "interest": "Penthouse",
  "message": "…"
}
```

Validated, rate limited, stored in `server/data/enquiries.json`.

`GET /api/health`

## Notes

- The tower in the browser is the same GLB used for the renders, merged by
  material per floor to keep draw calls low.
- The assembly, camera and level highlight are driven by scroll and pointer,
  damped per frame for smoothness.
- Reference footage and source plates live under `reference/` and are not part
  of the built site.
- Renderings and floor plans are artist's impressions.
