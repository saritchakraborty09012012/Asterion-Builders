import { motion } from 'framer-motion'

export default function SitePlan({ className = '' }: { className?: string }) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 },
        opacity: { duration: 0.3, delay: i * 0.15 },
      },
    }),
  }

  return (
    <svg
      viewBox="0 0 700 560"
      className={className}
      fill="none"
      role="img"
      aria-label="Asterion site plan, Sector 137, Noida"
    >
      <defs>
        <pattern id="siteGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
        </pattern>
        <pattern id="plotHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        </pattern>
      </defs>

      <rect width="700" height="560" fill="url(#siteGrid)" />

      {/* metro line */}
      <motion.path
        d="M0 118 C 120 104, 260 128, 390 114 S 610 96, 700 112"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="5 5"
        opacity="0.45"
        variants={draw}
        custom={0}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10%' }}
      />

      {/* roads */}
      <g stroke="currentColor" fill="none">
        <motion.path
          d="M-20 150 C 120 138, 290 160, 420 150 S 640 132, 720 148"
          strokeWidth="26"
          opacity="0.055"
          variants={draw}
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        />
        <motion.path
          d="M-20 150 C 120 138, 290 160, 420 150 S 640 132, 720 148"
          strokeWidth="0.9"
          opacity="0.4"
          variants={draw}
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        />
        <motion.path
          d="M592 -20 C 580 90, 604 220, 590 330 S 612 490, 600 580"
          strokeWidth="22"
          opacity="0.05"
          variants={draw}
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        />
        <motion.path
          d="M592 -20 C 580 90, 604 220, 590 330 S 612 490, 600 580"
          strokeWidth="0.9"
          opacity="0.35"
          variants={draw}
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        />
        <motion.path
          d="M120 210 C 170 250, 180 330, 210 560"
          strokeWidth="9"
          opacity="0.05"
          variants={draw}
          custom={3}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        />
        <motion.path
          d="M120 210 C 170 250, 180 330, 210 560"
          strokeWidth="0.7"
          opacity="0.3"
          variants={draw}
          custom={3}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        />
      </g>

      {/* metro station */}
      <g>
        <circle cx="330" cy="149" r="4.5" fill="currentColor" opacity="0.7" />
        <circle cx="330" cy="149" r="10" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
        <line x1="330" y1="159" x2="330" y2="196" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
        <text x="330" y="208" textAnchor="middle" fill="currentColor" fontSize="6" letterSpacing="0.2em" opacity="0.55" fontFamily="Jost, sans-serif">
          NOIDA SECTOR 137 METRO
        </text>
      </g>

      {/* plot */}
      <motion.polygon
        points="150,232 520,214 560,470 182,492"
        fill="url(#plotHatch)"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.55"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* compound road inside */}
      <path
        d="M150 232 L 520 214 L 560 470 L 182 492 Z"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="4 6"
        opacity="0.35"
      />

      {/* gardens / palms */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.42" fill="none">
        {[
          [196, 260], [236, 250], [450, 240], [490, 236], [196, 448], [236, 460],
          [430, 452], [472, 446], [516, 430], [510, 270], [526, 300], [542, 330],
          [206, 310], [214, 350], [222, 390], [236, 430],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="7" />
            <path d={`M${x - 4} ${y} h8 M${x} ${y - 4} v8`} opacity="0.6" />
            <circle cx={x} cy={y} r="1.2" fill="currentColor" stroke="none" />
          </g>
        ))}
      </g>

      {/* podium + tower */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      >
        <rect x="244" y="300" width="260" height="132" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <rect x="258" y="314" width="232" height="104" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <rect x="312" y="292" width="124" height="92" fill="currentColor" opacity="0.14" stroke="currentColor" strokeWidth="1.2" />
        <rect x="322" y="302" width="104" height="72" fill="currentColor" opacity="0.12" />
        <line x1="322" y1="326" x2="426" y2="326" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        <line x1="322" y1="350" x2="426" y2="350" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        {/* pool */}
        <rect x="270" y="388" width="78" height="22" rx="10" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
        <path d="M278 398 q 8 -3 16 0 t 16 0 t 16 0" stroke="currentColor" strokeWidth="0.4" opacity="0.45" />
        {/* entrance */}
        <path d="M352 384 h44 v14 h-44 z" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
        <text x="374" y="393" textAnchor="middle" fill="currentColor" fontSize="3.4" letterSpacing="0.15em" opacity="0.6" fontFamily="Jost, sans-serif">
          LOBBY
        </text>
      </motion.g>

      {/* labels */}
      <g fill="currentColor" fontFamily="Jost, sans-serif">
        <line x1="436" y1="288" x2="482" y2="244" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        <circle cx="482" cy="244" r="1.6" fill="currentColor" />
        <text x="488" y="240" fontSize="7" letterSpacing="0.26em">ASTERION</text>
        <text x="488" y="250" fontSize="4.6" letterSpacing="0.18em" opacity="0.5">SECTOR 137 · NOIDA</text>

        <line x1="210" y1="490" x2="150" y2="516" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        <text x="24" y="536" fontSize="5" letterSpacing="0.18em" opacity="0.5">PLOT 04 · 18,400 SQ M</text>

        <text x="26" y="140" fontSize="5.2" letterSpacing="0.22em" opacity="0.5">NOIDA EXPRESSWAY</text>
        <text x="606" y="90" fontSize="5.2" letterSpacing="0.22em" opacity="0.5" transform="rotate(90 606 90)">SECTOR 137</text>
      </g>

      {/* distance rings */}
      <g stroke="currentColor" opacity="0.16">
        <circle cx="374" cy="338" r="86" strokeWidth="0.6" strokeDasharray="2 5" />
        <circle cx="374" cy="338" r="148" strokeWidth="0.5" strokeDasharray="2 7" />
        <circle cx="374" cy="338" r="216" strokeWidth="0.4" strokeDasharray="2 9" />
      </g>

      {/* compass + scale */}
      <g opacity="0.6">
        <circle cx="642" cy="62" r="19" stroke="currentColor" strokeWidth="0.6" />
        <path d="M642 42 l6 12 -6 -3.4 -6 3.4 z" fill="currentColor" />
        <text x="642" y="94" textAnchor="middle" fill="currentColor" fontSize="5" letterSpacing="0.16em" fontFamily="Jost, sans-serif">N</text>
        <line x1="470" y1="536" x2="570" y2="536" stroke="currentColor" strokeWidth="0.8" />
        <line x1="470" y1="532" x2="470" y2="540" stroke="currentColor" strokeWidth="0.6" />
        <line x1="570" y1="532" x2="570" y2="540" stroke="currentColor" strokeWidth="0.6" />
        <text x="520" y="530" textAnchor="middle" fill="currentColor" fontSize="4.6" letterSpacing="0.16em" fontFamily="Jost, sans-serif">100 M</text>
      </g>
    </svg>
  )
}
