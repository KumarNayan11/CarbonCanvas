/**
 * @file ecosystem-canvas.tsx
 * @description Static SVG ecosystem visualization driven purely by health metric props.
 *
 * Server-compatible: no state, no hooks, no browser APIs, no data fetching.
 * All visual decisions are derived deterministically from the four health values.
 */

// ============================================================
// Public interface
// ============================================================

export interface EcosystemCanvasProps {
  /** Maps to `forest_health`  (0–100) */
  forestHealth: number
  /** Maps to `water_quality`  (0–100) */
  waterQuality: number
  /** Maps to `air_quality`    (0–100) */
  airQuality: number
  /** Maps to `biodiversity`   (0–100) */
  biodiversity: number
}

// ============================================================
// Internal types & pure helpers
// ============================================================

type Tier = 'healthy' | 'moderate' | 'poor'

/** Classify a 0–100 health value into a visual tier. */
function tier(value: number): Tier {
  if (value >= 80) return 'healthy'
  if (value >= 50) return 'moderate'
  return 'poor'
}

/** Build an accessible prose description of the current ecosystem state. */
function buildDescription(
  airTier: Tier,
  forestTier: Tier,
  waterTier: Tier,
  biodiversityTier: Tier,
): string {
  const parts: string[] = []
  if (airTier === 'healthy') parts.push('clear sky with bright sunshine')
  else if (airTier === 'moderate') parts.push('partly cloudy sky')
  else parts.push('heavy overcast sky')

  if (forestTier === 'healthy') parts.push('a dense green forest')
  else if (forestTier === 'moderate') parts.push('a sparse woodland')
  else parts.push('a few dying trees')

  if (waterTier === 'healthy') parts.push('a flowing blue river')
  else if (waterTier === 'moderate') parts.push('a shallow stream')
  else parts.push('a dry riverbed')

  if (biodiversityTier === 'healthy') parts.push('lush ground flora')
  else if (biodiversityTier === 'moderate') parts.push('sparse vegetation')
  else parts.push('barren ground')

  return `Ecosystem scene showing ${parts.join(', ')}.`
}

// ============================================================
// SVG constants
// ============================================================

const W = 800      // viewBox width
const H = 380      // viewBox height
const GROUND_Y = 245  // horizon / ground line

// ── Sky gradients by air quality tier ──────────────────────
const SKY_TOP: Record<Tier, string> = {
  healthy: '#4AACDC',
  moderate: '#7A9EAF',
  poor: '#5E6E7D',
}
const SKY_BOTTOM: Record<Tier, string> = {
  healthy: '#C8EEFA',
  moderate: '#BDD0DC',
  poor: '#9AAAB8',
}

// ── Ground / grass colors ───────────────────────────────────
const GROUND_FILL: Record<Tier, string> = {
  healthy: '#4A7C3F',
  moderate: '#5E7848',
  poor: '#887055',
}
const GROUND_HIGHLIGHT: Record<Tier, string> = {
  healthy: '#5A9A4C',
  moderate: '#6E8A52',
  poor: '#9A8060',
}

// ── Tree foliage & trunk colors ─────────────────────────────
const FOLIAGE_FILL: Record<Tier, string> = {
  healthy: '#1E6641',
  moderate: '#4A7A52',
  poor: '#7A6A3A',
}
const FOLIAGE_MID: Record<Tier, string> = {
  healthy: '#2A8050',
  moderate: '#5A8A60',
  poor: '#8A7844',
}
const TRUNK_FILL: Record<Tier, string> = {
  healthy: '#6B4226',
  moderate: '#7A5A38',
  poor: '#8A7048',
}

// ── River colors ────────────────────────────────────────────
const RIVER_FILL: Record<Tier, string> = {
  healthy: '#3B9BC4',
  moderate: '#5A7F98',
  poor: '#8A7250',
}
const RIVER_HIGHLIGHT: Record<Tier, string> = {
  healthy: '#6CC4E8',
  moderate: '#7A9FB8',
  poor: '#AA9870',
}

// ── Mountain colors (fixed accent, depth effect) ────────────
const MOUNTAIN_BACK = '#9BAABF'
const MOUNTAIN_FRONT = '#B0BFCE'

// ── Cloud fill by air quality tier ──────────────────────────
const CLOUD_FILL: Record<Tier, string> = {
  healthy: '#FFFFFF',
  moderate: '#DDE6EE',
  poor: '#B0BCC8',
}

// ============================================================
// SVG sub-component helpers (plain functions returning JSX)
// ============================================================

interface PineTreeProps {
  x: number
  groundY: number
  foliageH: number
  foliageW: number
  trunkH: number
  fill: string
  midFill: string
  trunkFill: string
}

/**
 * Layered pine tree built from three overlapping triangles.
 * The layers give a classic silhouetted-evergreen appearance.
 */
function PineTree({
  x, groundY, foliageH, foliageW, trunkH,
  fill, midFill, trunkFill,
}: PineTreeProps) {
  const trunkW = Math.max(5, Math.round(foliageW * 0.2))
  const trunkTop = groundY - trunkH
  const tipY = trunkTop - foliageH

  // Three triangle layers — each progressively smaller, sitting higher
  const layer1 = `${x},${tipY} ${x - foliageW},${trunkTop} ${x + foliageW},${trunkTop}`
  const ly2 = trunkTop - foliageH * 0.12
  const layer2 = `${x},${tipY + foliageH * 0.3} ${x - foliageW * 0.78},${ly2} ${x + foliageW * 0.78},${ly2}`
  const ly3 = trunkTop - foliageH * 0.28
  const layer3 = `${x},${tipY + foliageH * 0.56} ${x - foliageW * 0.55},${ly3} ${x + foliageW * 0.55},${ly3}`

  return (
    <g>
      <rect x={x - trunkW / 2} y={trunkTop} width={trunkW} height={trunkH} fill={trunkFill} rx={1} />
      <polygon points={layer1} fill={fill} />
      <polygon points={layer2} fill={midFill} opacity={0.88} />
      <polygon points={layer3} fill={midFill} opacity={0.72} />
    </g>
  )
}

interface CloudProps {
  cx: number
  cy: number
  scale: number
  fill: string
}

/** A cloud made from four overlapping ellipses. */
function Cloud({ cx, cy, scale, fill }: CloudProps) {
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={32} ry={19} fill={fill} />
      <ellipse cx={24} cy={-10} rx={24} ry={17} fill={fill} />
      <ellipse cx={-20} cy={-8} rx={22} ry={15} fill={fill} />
      <ellipse cx={8} cy={-20} rx={18} ry={14} fill={fill} />
    </g>
  )
}

/** Sun with radiating lines. */
function Sun({ cx, cy }: { cx: number; cy: number }) {
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <g>
      {rayAngles.map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * 42}
            y1={cy + Math.sin(rad) * 42}
            x2={cx + Math.cos(rad) * 55}
            y2={cy + Math.sin(rad) * 55}
            stroke="#FFC200"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )
      })}
      <circle cx={cx} cy={cy} r={34} fill="#FFD740" />
      <circle cx={cx} cy={cy} r={27} fill="#FFEA00" />
    </g>
  )
}

// ============================================================
// Per-tier scene data tables
// ============================================================

interface TreeDef { x: number; h: number; w: number; trunkH: number }

const TREE_SETS: Record<Tier, TreeDef[]> = {
  healthy: [
    { x: 48,  h: 88,  w: 27, trunkH: 22 },
    { x: 100, h: 108, w: 32, trunkH: 26 },
    { x: 152, h: 78,  w: 23, trunkH: 19 },
    { x: 202, h: 98,  w: 29, trunkH: 24 },
    { x: 548, h: 94,  w: 28, trunkH: 22 },
    { x: 612, h: 112, w: 33, trunkH: 28 },
    { x: 670, h: 82,  w: 25, trunkH: 20 },
    { x: 730, h: 100, w: 30, trunkH: 24 },
  ],
  moderate: [
    { x: 68,  h: 78,  w: 23, trunkH: 19 },
    { x: 178, h: 88,  w: 26, trunkH: 21 },
    { x: 570, h: 82,  w: 24, trunkH: 20 },
    { x: 680, h: 74,  w: 22, trunkH: 18 },
  ],
  poor: [
    { x: 92,  h: 62,  w: 16, trunkH: 15 },
    { x: 650, h: 58,  w: 15, trunkH: 14 },
  ],
}

// River path data — winding polygon from ground line to bottom edge
const RIVER_PATHS: Record<Tier, string> = {
  healthy: 'M 318,245 C 308,280 325,315 310,380 L 395,380 C 410,315 393,280 408,245 Z',
  moderate: 'M 338,245 C 330,280 342,315 330,380 L 375,380 C 384,315 374,280 382,245 Z',
  poor: 'M 354,245 C 350,290 355,330 348,380 L 363,380 C 368,330 366,290 366,245 Z',
}

// Grass tuft positions (biodiversity-driven vegetation)
interface Tuft { x: number; y: number }

const GRASS_TUFTS_HEALTHY: Tuft[] = [
  { x: 22, y: 250 }, { x: 46, y: 247 }, { x: 80, y: 251 }, { x: 126, y: 248 },
  { x: 175, y: 252 }, { x: 228, y: 249 }, { x: 265, y: 251 }, { x: 300, y: 248 },
  { x: 460, y: 250 }, { x: 505, y: 247 }, { x: 542, y: 252 }, { x: 595, y: 249 },
  { x: 645, y: 251 }, { x: 700, y: 248 }, { x: 745, y: 252 }, { x: 778, y: 250 },
]
const GRASS_TUFTS_MODERATE: Tuft[] = [
  { x: 40, y: 249 }, { x: 160, y: 251 }, { x: 270, y: 250 },
  { x: 500, y: 251 }, { x: 640, y: 249 }, { x: 760, y: 252 },
]

// Flower / flora dot positions
interface FloraDot { x: number; y: number; r: number; color: string }

const FLORA_HEALTHY: FloraDot[] = [
  { x: 28,  y: 257, r: 4, color: '#FFD700' },
  { x: 88,  y: 261, r: 3, color: '#FF69B4' },
  { x: 140, y: 255, r: 4, color: '#FF9800' },
  { x: 196, y: 260, r: 3, color: '#FF69B4' },
  { x: 248, y: 257, r: 4, color: '#FFD700' },
  { x: 502, y: 258, r: 3, color: '#FF9800' },
  { x: 560, y: 261, r: 4, color: '#FFD700' },
  { x: 618, y: 256, r: 3, color: '#FF69B4' },
  { x: 668, y: 259, r: 4, color: '#FF9800' },
  { x: 736, y: 258, r: 3, color: '#FFD700' },
  { x: 768, y: 262, r: 4, color: '#FF69B4' },
]
const FLORA_MODERATE: FloraDot[] = [
  { x: 58,  y: 259, r: 3, color: '#C8A840' },
  { x: 200, y: 257, r: 3, color: '#B09040' },
  { x: 586, y: 260, r: 3, color: '#C8A840' },
  { x: 718, y: 258, r: 3, color: '#B09040' },
]

// ============================================================
// Main component
// ============================================================

/**
 * Static SVG ecosystem scene driven purely by four health metrics.
 * Server-compatible — no client state, no hooks, no browser APIs.
 */
export function EcosystemCanvas({
  forestHealth,
  waterQuality,
  airQuality,
  biodiversity,
}: EcosystemCanvasProps) {
  // Classify each metric into a visual tier
  const airTier = tier(airQuality)
  const forestTier = tier(forestHealth)
  const waterTier = tier(waterQuality)
  const bioDivTier = tier(biodiversity)

  // Resolve per-tier visuals
  const skyTop = SKY_TOP[airTier]
  const skyBottom = SKY_BOTTOM[airTier]
  const groundFill = GROUND_FILL[bioDivTier]
  const groundHighlight = GROUND_HIGHLIGHT[bioDivTier]
  const foliageFill = FOLIAGE_FILL[forestTier]
  const foliageMid = FOLIAGE_MID[forestTier]
  const trunkFill = TRUNK_FILL[forestTier]
  const riverFill = RIVER_FILL[waterTier]
  const riverHighlight = RIVER_HIGHLIGHT[waterTier]
  const cloudFill = CLOUD_FILL[airTier]
  const trees = TREE_SETS[forestTier]
  const riverPath = RIVER_PATHS[waterTier]
  const grassTufts = bioDivTier === 'healthy'
    ? GRASS_TUFTS_HEALTHY
    : bioDivTier === 'moderate'
      ? GRASS_TUFTS_MODERATE
      : []
  const flora = bioDivTier === 'healthy'
    ? FLORA_HEALTHY
    : bioDivTier === 'moderate'
      ? FLORA_MODERATE
      : []

  // Accessibility description
  const ariaLabel = buildDescription(airTier, forestTier, waterTier, bioDivTier)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className="w-full h-auto rounded-xl overflow-hidden"
      style={{ display: 'block' }}
    >
      <title>Ecosystem visualization</title>

      {/* ── Gradient definitions ─────────────────────────── */}
      <defs>
        <linearGradient id="ec-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id="ec-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={groundHighlight} />
          <stop offset="100%" stopColor={groundFill} />
        </linearGradient>
        <linearGradient id="ec-river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={riverFill} />
          <stop offset="50%" stopColor={riverHighlight} />
          <stop offset="100%" stopColor={riverFill} />
        </linearGradient>
      </defs>

      {/* ── Sky ─────────────────────────────────────────── */}
      <rect x={0} y={0} width={W} height={GROUND_Y} fill="url(#ec-sky)" />

      {/* ── Sun (healthy/moderate air) ───────────────────── */}
      {airTier !== 'poor' && <Sun cx={680} cy={68} />}

      {/* ── Clouds ──────────────────────────────────────── */}
      {airTier === 'healthy' && (
        <Cloud cx={120} cy={60} scale={0.7} fill={cloudFill} />
      )}
      {airTier === 'moderate' && (
        <>
          <Cloud cx={130} cy={55} scale={0.9} fill={cloudFill} />
          <Cloud cx={400} cy={45} scale={0.75} fill={cloudFill} />
          <Cloud cx={600} cy={65} scale={0.65} fill={cloudFill} />
        </>
      )}
      {airTier === 'poor' && (
        <>
          <Cloud cx={80}  cy={50} scale={1.1}  fill={cloudFill} />
          <Cloud cx={250} cy={35} scale={0.95} fill={cloudFill} />
          <Cloud cx={440} cy={55} scale={1.0}  fill={cloudFill} />
          <Cloud cx={620} cy={38} scale={0.88} fill={cloudFill} />
          <Cloud cx={760} cy={60} scale={0.78} fill={cloudFill} />
        </>
      )}

      {/* ── Background mountains (depth) ────────────────── */}
      {/* Far peak — left */}
      <polygon
        points={`0,${GROUND_Y} 160,${GROUND_Y - 95} 320,${GROUND_Y}`}
        fill={MOUNTAIN_BACK}
        opacity={0.55}
      />
      {/* Far peak — center (tallest) */}
      <polygon
        points={`210,${GROUND_Y} 400,${GROUND_Y - 130} 590,${GROUND_Y}`}
        fill={MOUNTAIN_BACK}
        opacity={0.45}
      />
      {/* Far peak — right */}
      <polygon
        points={`520,${GROUND_Y} 680,${GROUND_Y - 100} 800,${GROUND_Y}`}
        fill={MOUNTAIN_BACK}
        opacity={0.50}
      />
      {/* Closer foothills */}
      <polygon
        points={`0,${GROUND_Y} 100,${GROUND_Y - 55} 240,${GROUND_Y}`}
        fill={MOUNTAIN_FRONT}
        opacity={0.40}
      />
      <polygon
        points={`580,${GROUND_Y} 700,${GROUND_Y - 60} 800,${GROUND_Y}`}
        fill={MOUNTAIN_FRONT}
        opacity={0.38}
      />

      {/* ── Ground ──────────────────────────────────────── */}
      <rect x={0} y={GROUND_Y} width={W} height={H - GROUND_Y} fill="url(#ec-ground)" />

      {/* ── River ───────────────────────────────────────── */}
      <path d={riverPath} fill="url(#ec-river)" opacity={waterTier === 'poor' ? 0.7 : 0.9} />
      {/* Ripple highlights on river (healthy/moderate only) */}
      {waterTier !== 'poor' && (
        <ellipse
          cx={363}
          cy={310}
          rx={waterTier === 'healthy' ? 18 : 10}
          ry={4}
          fill="white"
          opacity={0.25}
        />
      )}

      {/* ── Grass tufts ─────────────────────────────────── */}
      {grassTufts.map((t, i) => (
        <g key={`tuft-${i}`}>
          <line x1={t.x}     y1={t.y}     x2={t.x - 4}  y2={t.y - 9}  stroke={groundHighlight} strokeWidth={1.5} strokeLinecap="round" />
          <line x1={t.x + 3} y1={t.y + 1} x2={t.x + 1}  y2={t.y - 8}  stroke={groundHighlight} strokeWidth={1.5} strokeLinecap="round" />
          <line x1={t.x - 3} y1={t.y}     x2={t.x - 6}  y2={t.y - 7}  stroke={groundHighlight} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      ))}

      {/* ── Flora / flowers ─────────────────────────────── */}
      {flora.map((f, i) => (
        <circle key={`flora-${i}`} cx={f.x} cy={f.y} r={f.r} fill={f.color} opacity={0.9} />
      ))}

      {/* ── Trees ───────────────────────────────────────── */}
      {trees.map((t, i) => (
        <PineTree
          key={`tree-${i}`}
          x={t.x}
          groundY={GROUND_Y}
          foliageH={t.h}
          foliageW={t.w}
          trunkH={t.trunkH}
          fill={foliageFill}
          midFill={foliageMid}
          trunkFill={trunkFill}
        />
      ))}

      {/* ── Horizon line (subtle depth separator) ───────── */}
      <line
        x1={0} y1={GROUND_Y}
        x2={W} y2={GROUND_Y}
        stroke={groundHighlight}
        strokeWidth={1.5}
        opacity={0.6}
      />
    </svg>
  )
}
