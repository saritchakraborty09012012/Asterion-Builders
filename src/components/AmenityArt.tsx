import { useId } from 'react'

/* ------------------------------------------------------------------ */
/*  procedural amenity artwork                                          */
/*  Twelve hand-drawn SVG scenes, no photography.                       */
/* ------------------------------------------------------------------ */

type ArtProps = { index: number; className?: string }

const P = {
  ink: '#101a13',
  deep: '#0b130e',
  forest: '#17251c',
  moss: '#41523d',
  sage: '#7c8c72',
  bone: '#f2eee6',
  paper: '#f8f5ee',
  sand: '#d6c8b4',
  clay: '#a57e56',
  clayLight: '#c9a67e',
  water: '#426d68',
  waterLight: '#8fb8ad',
  gold: '#d9b27a',
}

function Grain({ id }: { id: string }) {
  return (
    <>
      <filter id={`${id}-grain`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.16" />
        </feComponentTransfer>
      </filter>
      <rect width="800" height="600" filter={`url(#${id}-grain)`} opacity="0.4" style={{ mixBlendMode: 'overlay' }} />
    </>
  )
}

function Vignette({ id }: { id: string }) {
  return (
    <>
      <radialGradient id={`${id}-vig`} cx="50%" cy="46%" r="72%">
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#050a06" stopOpacity="0.55" />
      </radialGradient>
      <rect width="800" height="600" fill={`url(#${id}-vig)`} />
    </>
  )
}

function Glass({ id, x, y, w, h, tint = '#a9c2ba' }: { id: string; x: number; y: number; w: number; h: number; tint?: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={tint} opacity="0.12" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={P.bone} strokeOpacity="0.22" strokeWidth="1" />
      <line x1={x + w / 3} y1={y} x2={x + w / 3} y2={y + h} stroke={P.bone} strokeOpacity="0.16" />
      <line x1={x + (w * 2) / 3} y1={y} x2={x + (w * 2) / 3} y2={y + h} stroke={P.bone} strokeOpacity="0.16" />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={P.bone} strokeOpacity="0.12" />
    </>
  )
}

function Palm({ x, y, s = 1, color = '#3f5238' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <path d="M0 0 C -4 -26 2 -52 8 -74" />
      {[-1, 1].map((dir) =>
        [0, 1, 2, 3].map((i) => (
          <path
            key={`${dir}-${i}`}
            d={`M8 -74 q ${dir * (18 + i * 4)} ${-10 + i * 6} ${dir * (34 + i * 3)} ${12 + i * 3}`}
            strokeWidth={1.5}
            opacity={0.85}
          />
        ))
      )}
    </g>
  )
}

function Water({ id, x, y, w, h }: { id: string; x: number; y: number; w: number; h: number }) {
  const lines = Array.from({ length: 14 }, (_, i) => {
    const yy = y + 10 + (i * (h - 20)) / 13
    const amp = 4 + (i % 4) * 2
    return (
      <path
        key={i}
        d={`M ${x + 8} ${yy} q ${w / 8} ${-amp} ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0`}
        stroke={P.waterLight}
        strokeWidth={i % 5 === 0 ? 1.4 : 0.7}
        opacity={0.18 + (i % 5) * 0.05}
        fill="none"
      />
    )
  })
  return (
    <>
      <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2f5a56" />
        <stop offset="0.55" stopColor="#3f746d" />
        <stop offset="1" stopColor="#20443f" />
      </linearGradient>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-water)`} />
      {lines}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  scenes                                                             */
/* ------------------------------------------------------------------ */

function ZenGarden({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#d9cdbb" />
      <rect y="350" width="800" height="250" fill="#c8b9a4" />
      <rect x="70" y="70" width="660" height="460" fill="#e6dccb" stroke="#8e7d68" strokeWidth="2" />
      <g stroke="#b4a58f" strokeWidth="1.2" fill="none" opacity="0.8">
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} cx="300" cy="330" rx={40 + i * 17} ry={22 + i * 11} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`p-${i}`} d={`M ${120 + i * 8} ${190 + i * 22} q 120 -26 250 0 t 280 0`} opacity="0.7" />
        ))}
      </g>
      <g fill="#4e5b49">
        <path d="M210 300 q 34 -58 74 -14 q 30 -12 34 34 q -6 42 -52 38 q -50 4 -56 -58Z" />
        <path d="M470 260 q 44 -38 76 10 q 30 26 -4 50 q -38 26 -72 -8Z" opacity="0.86" />
        <path d="M540 372 q 28 -28 52 2 q 18 24 -14 34 q -32 12 -38 -36Z" opacity="0.72" />
      </g>
      <g fill="#6a755f" opacity="0.5">
        <circle cx="238" cy="266" r="26" />
        <circle cx="512" cy="294" r="20" />
      </g>
      <Palm x={678} y={300} s={1.3} color="#5c6652" />
      <rect x="70" y="70" width="660" height="16" fill="#9d8a72" opacity="0.5" />
      <Vignette id={id} />
    </>
  )
}

function Yoga({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#c8b9a7" />
      <rect x="120" y="0" width="560" height="600" fill="#d9cebd" />
      <path d="M260 520 L260 160 Q400 20 540 160 L540 520Z" fill="#efe7d9" stroke="#a99377" strokeWidth="2" />
      <path d="M260 160 Q400 20 540 160" fill="none" stroke="#b29d82" strokeWidth="8" opacity="0.4" />
      <g opacity="0.35" fill="#fff5e2">
        <path d="M285 160 L390 520 L440 520 L330 160Z" />
        <path d="M515 160 L470 520 L500 520 L540 170Z" />
      </g>
      <rect x="250" y="500" width="300" height="24" fill="#b9a180" />
      <rect x="290" y="480" width="220" height="20" rx="8" fill="#a57e56" opacity="0.85" />
      <g transform="translate(400 430)" fill="#2a3428">
        <circle cx="0" cy="-96" r="18" />
        <path d="M-6 -76 q 24 6 26 42 l -8 38 l 14 46 l -28 6 l -14 -46 l -6 46 l -28 -4 l 12 -58 q -2 -34 14 -52Z" />
        <path d="M-2 -34 q -34 10 -44 -26" stroke="#2a3428" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M14 -34 q 32 12 42 -22" stroke="#2a3428" strokeWidth="10" fill="none" strokeLinecap="round" />
      </g>
      <g stroke="#8a9a7e" fill="none" strokeWidth="2">
        <path d="M640 420 q -24 -70 8 -120" />
        <path d="M648 300 q -26 -18 -36 -46 M648 300 q 28 -14 38 -44 M648 300 q 2 -34 -14 -54" />
      </g>
      <rect x="626" y="420" width="54" height="48" fill="#9a8065" />
      <Vignette id={id} />
    </>
  )
}

function Gym({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#1a241d" />
      <Glass id={id} x={70} y={80} w={420} h={360} tint="#a9c2ba" />
      <g opacity="0.5" fill="#7d9184">
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={90 + i * 68} y={100 + (i % 3) * 14} width="40" height={60 + (i % 4) * 26} />
        ))}
      </g>
      <rect x="540" y="90" width="190" height="350" fill="#2b362c" />
      <rect x="556" y="110" width="158" height="310" fill="#3c4a3d" opacity="0.5" />
      <g stroke="#b59a72" strokeWidth="5" fill="none">
        <line x1="120" y1="470" x2="380" y2="470" />
        <line x1="160" y1="470" x2="160" y2="510" />
        <line x1="340" y1="470" x2="340" y2="510" />
        <line x1="200" y1="430" x2="300" y2="430" />
      </g>
      <g fill="#20281f">
        <rect x="560" y="420" width="150" height="14" rx="3" />
        <rect x="570" y="434" width="12" height="70" />
        <rect x="688" y="434" width="12" height="70" />
        <rect x="600" y="392" width="60" height="28" rx="4" />
      </g>
      <g stroke="#8fa18f" strokeWidth="3" fill="none" opacity="0.9">
        <path d="M500 300 q 30 -30 0 -60 q -30 -30 0 -60" />
      </g>
      <circle cx="500" cy="420" r="26" fill="#d9b27a" opacity="0.24" />
      <Vignette id={id} />
    </>
  )
}

function Trail({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d7b492" />
        <stop offset="0.55" stopColor="#e6c8a8" />
        <stop offset="1" stopColor="#b89674" />
      </linearGradient>
      <rect width="800" height="600" fill={`url(#${id}-sky)`} />
      <circle cx="620" cy="180" r="66" fill="#f3d7ac" opacity="0.8" />
      <path d="M0 380 Q 200 320 400 380 T 800 360 L800 600 L0 600Z" fill="#5d6c4e" />
      <path d="M0 460 Q 240 380 440 450 T 800 430 L800 600 L0 600Z" fill="#3e4f38" />
      <path d="M340 600 Q 380 470 330 400 Q 300 340 370 310" stroke="#d7c4a7" strokeWidth="64" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M340 600 Q 380 470 330 400 Q 300 340 370 310" stroke="#c2ad8d" strokeWidth="2" fill="none" strokeDasharray="10 16" />
      <g>
        <Palm x={90} y={500} s={1.5} />
        <Palm x={680} y={520} s={1.8} />
        <Palm x={560} y={400} s={1.1} />
        <Palm x={210} y={390} s={0.9} />
      </g>
      <g fill="#2c3529">
        <circle cx="357" cy="392" r="9" />
        <path d="M352 402 q 12 4 14 22 l -4 26 l 10 24 l -12 4 l -10 -24 l -4 24 l -12 -2 l 6 -28 q -2 -22 12 -46Z" />
      </g>
      <Vignette id={id} />
    </>
  )
}

function Pool({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#d9cdba" />
      <rect x="50" y="70" width="700" height="460" fill="#c9b9a2" />
      <Water id={id} x={110} y={130} w={580} h={350} />
      <rect x="110" y="130" width="580" height="350" fill="none" stroke="#efe6d6" strokeWidth="8" opacity="0.65" />
      <g stroke="#9ab8ae" strokeWidth="1" opacity="0.35">
        {Array.from({ length: 5 }, (_, i) => (
          <line key={i} x1={130 + i * 120} y1="130" x2={130 + i * 120} y2="480" />
        ))}
      </g>
      <g fill="#efe6d6" opacity="0.85">
        {[-120, 120].map((offset) => (
          <g key={offset} transform={`translate(${400 + offset} 480)`}>
            <rect x="-44" y="0" width="88" height="10" />
            <rect x="-38" y="-54" width="6" height="54" />
            <rect x="32" y="-54" width="6" height="54" />
            <path d="M-52 -54 L52 -54 L40 -72 L-40 -72Z" fill="#e3d4be" />
          </g>
        ))}
      </g>
      <g stroke="#f0e7d7" strokeWidth="3" fill="none" opacity="0.9">
        <path d="M260 330 q 30 -18 62 0 t 62 0 t 62 0" />
        <path d="M240 360 q 30 -18 62 0 t 62 0 t 62 0" opacity="0.6" />
      </g>
      <g fill="#2c3933">
        <circle cx="472" cy="300" r="10" />
        <path d="M464 312 q 24 4 30 22 l 4 28 l -16 6 l -8 -26 l -22 20 l -10 -10 l 24 -24 q -10 -14 -2 -16Z" />
      </g>
      <g fill="#f6efe2" opacity="0.7">
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={500 + i * 14} cy={246 + i * 8} r={3 + i} />
        ))}
      </g>
      <Palm x={690} y={470} s={1.4} color="#5a6550" />
      <Palm x={95} y={480} s={1.1} color="#5a6550" />
      <Vignette id={id} />
    </>
  )
}

function Steam({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#171e19" />
      <rect x="60" y="80" width="680" height="450" fill="#2b312a" />
      <rect x="60" y="80" width="680" height="450" fill="none" stroke="#5d655b" strokeWidth="2" />
      <g fill="#3f463d">
        <rect x="100" y="390" width="220" height="20" rx="4" />
        <rect x="100" y="410" width="16" height="70" />
        <rect x="304" y="410" width="16" height="70" />
        <rect x="460" y="340" width="240" height="20" rx="4" />
        <rect x="460" y="360" width="16" height="80" />
        <rect x="684" y="360" width="16" height="80" />
      </g>
      <g fill="none" stroke="#b9c4b8" strokeLinecap="round" opacity="0.3">
        <path d="M160 380 q -40 -60 10 -110 q 46 -50 10 -110" strokeWidth="14" />
        <path d="M400 420 q -30 -80 30 -130 q 50 -46 20 -110" strokeWidth="20" opacity="0.5" />
        <path d="M590 380 q -24 -60 24 -100 q 40 -34 16 -84" strokeWidth="10" />
      </g>
      <g fill="#d9b27a">
        <rect x="350" y="120" width="80" height="6" />
        <rect x="386" y="126" width="6" height="28" />
        <circle cx="389" cy="162" r="7" opacity="0.85" />
      </g>
      <g fill="#efe6d6" opacity="0.55">
        <rect x="120" y="350" width="120" height="8" />
        <rect x="500" y="300" width="80" height="8" />
      </g>
      <Vignette id={id} />
    </>
  )
}

function OutdoorGym({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8c9b98" />
        <stop offset="0.5" stopColor="#d6b391" />
        <stop offset="1" stopColor="#e8cba6" />
      </linearGradient>
      <rect width="800" height="600" fill={`url(#${id}-sky)`} />
      <g fill="#5a635a" opacity="0.4">
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={30 + i * 74} y={250 - (i % 4) * 26} width={46} height={130 + (i % 4) * 26} />
        ))}
      </g>
      <rect y="420" width="800" height="180" fill="#b7a68c" />
      <g stroke="#3d4a3d" strokeWidth="10" fill="none">
        <path d="M180 420 L180 170 L420 170 L420 420" />
        <path d="M180 230 L420 230" />
        <path d="M240 230 L240 420 M360 230 L360 420" strokeWidth="4" />
      </g>
      <g fill="#2d362c">
        <rect x="470" y="380" width="160" height="12" />
        <circle cx="500" cy="392" r="22" />
        <circle cx="600" cy="392" r="22" />
        <rect x="520" y="330" width="60" height="12" />
      </g>
      <Palm x={110} y={500} s={1.8} color="#4d5a45" />
      <Palm x={690} y={480} s={1.5} color="#4d5a45" />
      <g fill="#2d362c">
        <circle cx="420" cy="345" r="9" />
        <path d="M412 356 q 22 2 26 24 l -2 34 l -12 2 l -6 -30 l -14 28 l -10 -6 l 16 -30 q -8 -16 2 -22Z" />
      </g>
      <Vignette id={id} />
    </>
  )
}

function Kids({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#d9cdbb" />
      <rect y="370" width="800" height="230" fill="#c0ae94" />
      <g>
        <path d="M120 370 L120 180 L300 180 L360 370Z" fill="#a57e56" />
        <path d="M150 370 L150 210 L280 210 L330 370Z" fill="#c9a67e" />
        <path d="M330 260 q 60 20 20 110" stroke="#7a8b6c" strokeWidth="36" fill="none" strokeLinecap="round" />
        <g stroke="#5a4a37" strokeWidth="6">
          <line x1="480" y1="200" x2="480" y2="380" />
          <line x1="620" y1="200" x2="620" y2="380" />
          <line x1="480" y1="200" x2="620" y2="240" />
          <line x1="500" y1="330" x2="540" y2="330" />
          <line x1="560" y1="310" x2="600" y2="310" />
        </g>
        <circle cx="520" cy="330" r="5" fill="#17251c" />
        <circle cx="580" cy="310" r="5" fill="#17251c" />
        <g fill="#7c8c72">
          <circle cx="680" cy="350" r="34" />
          <rect x="646" y="350" width="68" height="20" />
          <circle cx="690" cy="350" r="20" fill="#a57e56" />
        </g>
      </g>
      <g fill="#f2eee6" opacity="0.7">
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={200 + i * 42} cy={320 - (i % 2) * 30} r="5" />
        ))}
      </g>
      <Vignette id={id} />
    </>
  )
}

function Padel({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#1b241d" />
      <rect x="80" y="90" width="640" height="420" fill="#2b382f" />
      <path d="M120 470 L240 130 L560 130 L680 470Z" fill="#3e5040" />
      <path d="M120 470 L240 130 L560 130 L680 470Z" fill="none" stroke="#b9c4b2" strokeWidth="2" opacity="0.5" />
      <g stroke="#e6e0d2" strokeWidth="2" opacity="0.7">
        <line x1="190" y1="300" x2="610" y2="300" />
        <line x1="270" y1="130" x2="230" y2="470" />
        <line x1="530" y1="130" x2="570" y2="470" />
      </g>
      <rect x="360" y="230" width="80" height="140" fill="#d9b27a" opacity="0.16" stroke="#d9b27a" strokeWidth="2" />
      <g stroke="#9db09a" strokeWidth="3" fill="none" opacity="0.6">
        <path d="M160 120 L160 60 M640 120 L640 60" />
        <circle cx="160" cy="48" r="10" fill="#f3e4c8" stroke="none" />
        <circle cx="640" cy="48" r="10" fill="#f3e4c8" stroke="none" />
      </g>
      <g fill="#d9b27a" opacity="0.9">
        <circle cx="470" cy="285" r="6" />
      </g>
      <g fill="#0e1611">
        <circle cx="330" cy="300" r="8" />
        <path d="M322 310 q 20 0 24 20 l -2 30 l -12 0 l -4 -26 l -12 24 l -10 -5 l 14 -26 q -6 -14 2 -17Z" />
      </g>
      <Vignette id={id} />
    </>
  )
}

function Cricket({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#151d18" />
      <rect x="60" y="90" width="680" height="430" fill="#222d24" />
      <rect x="100" y="130" width="600" height="260" fill="#4a5a4c" />
      <rect x="100" y="130" width="600" height="260" fill="none" stroke="#8fa08d" strokeWidth="2" />
      <g stroke="#d8cfc0" strokeWidth="2" opacity="0.5">
        <line x1="160" y1="390" x2="300" y2="160" />
        <line x1="640" y1="390" x2="500" y2="160" />
        <line x1="400" y1="390" x2="400" y2="160" strokeDasharray="8 14" />
      </g>
      <g fill="#efe6d6">
        <rect x="390" y="340" width="4" height="40" />
        <rect x="398" y="340" width="4" height="40" />
        <rect x="406" y="340" width="4" height="40" />
        <rect x="394" y="334" width="12" height="4" />
      </g>
      <g fill="#d9b27a">
        <circle cx="330" cy="300" r="5" />
      </g>
      <g stroke="#b7a184" strokeWidth="1" opacity="0.5">
        <path d="M160 420 L640 420" />
        <path d="M160 430 L640 430" />
        <path d="M300 390 L340 370" />
      </g>
      <g fill="#efe6d6" opacity="0.8">
        <rect x="120" y="450" width="120" height="10" />
        <rect x="580" y="450" width="120" height="10" />
      </g>
      <Vignette id={id} />
    </>
  )
}

function Lounge({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#211d17" />
      <rect x="60" y="70" width="680" height="460" fill="#3a3024" />
      <rect x="110" y="120" width="580" height="70" fill="#29231b" />
      <g fill="#a57e56">
        {Array.from({ length: 32 }, (_, i) => (
          <rect key={i} x={126 + (i % 16) * 34} y={i < 16 ? 132 : 160} width="24" height="14" opacity={0.4 + (i % 5) * 0.1} />
        ))}
      </g>
      <g fill="#5a4a36">
        <rect x="260" y="330" width="280" height="12" />
        <rect x="280" y="342" width="14" height="70" />
        <rect x="506" y="342" width="14" height="70" />
      </g>
      <g fill="#6b5a43">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${180 + i * 190} 430)`}>
            <rect x="0" y="0" width="80" height="70" rx="6" />
            <rect x="8" y="8" width="64" height="54" rx="4" fill="#8a7358" />
          </g>
        ))}
      </g>
      <g fill="#d9b27a">
        {[300, 400, 500].map((x) => (
          <g key={x}>
            <line x1={x} y1="70" x2={x} y2="150" stroke="#d9b27a" strokeWidth="1" opacity="0.5" />
            <circle cx={x} cy="160" r="5" fill="#f3e4c8" />
          </g>
        ))}
      </g>
      <Vignette id={id} />
    </>
  )
}

function Cinema({ id }: { id: string }) {
  return (
    <>
      <rect width="800" height="600" fill="#0b0f0c" />
      <rect x="110" y="80" width="580" height="260" fill="#b8a98e" opacity="0.8" />
      <rect x="110" y="80" width="580" height="260" fill="none" stroke="#4e4a3e" strokeWidth="3" />
      <g opacity="0.35" fill="#f6e9cd">
        <circle cx="470" cy="180" r="46" />
        <path d="M0 260 L300 220 L480 340 L0 340Z" />
      </g>
      <g fill="#1a1e19">
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4].map((col) => {
            const x = 120 + col * 140 + row * 12
            const y = 390 + row * 56
            return (
              <g key={`${row}-${col}`}>
                <rect x={x} y={y} width="92" height="42" rx="10" fill="#2a2c25" />
                <rect x={x + 10} y={y - 16} width="72" height="18" rx="6" fill="#34362d" />
              </g>
            )
          })
        )}
      </g>
      <g stroke="#a57e56" strokeWidth="1.4" opacity="0.5">
        <path d="M110 520 L690 520" />
      </g>
      <Vignette id={id} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  picker                                                             */
/* ------------------------------------------------------------------ */
const SCENES = [
  ZenGarden,
  Yoga,
  Gym,
  Trail,
  Pool,
  Steam,
  OutdoorGym,
  Kids,
  Padel,
  Cricket,
  Lounge,
  Cinema,
]

export default function AmenityArt({ index, className = '' }: ArtProps) {
  const uid = useId().replace(/[:]/g, '')
  const id = `am${index}-${uid}`
  const Scene = SCENES[((index % SCENES.length) + SCENES.length) % SCENES.length]
  return (
    <svg
      viewBox="0 0 800 600"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Amenity artwork"
    >
      <Scene id={id} />
      <Grain id={id} />
      <rect x="18" y="18" width="764" height="564" fill="none" stroke={P.bone} strokeOpacity="0.16" />
      <text x="42" y="560" fill={P.bone} fillOpacity="0.5" style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: '0.34em' }}>
        ASTERION · {String(index + 1).padStart(2, '0')}
      </text>
    </svg>
  )
}
