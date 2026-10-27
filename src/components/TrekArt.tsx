/**
 * Pastel mountain illustration used as a cover whenever a trek or event has
 * no cover_image_url. Deterministic per `seed` so a trek always looks the same.
 */
const PALETTES = [
  { sky: ["#dbedf8", "#f6f3fc"], far: "#c3b4e6", mid: "#9480cf", near: "#5f4a9e", sun: "#fde4d3" },
  { sky: ["#fde4d3", "#fbf1c9"], far: "#f6bd9a", mid: "#e8956a", near: "#a75a31", sun: "#ffffff" },
  { sky: ["#dcede3", "#f1f8fd"], far: "#a8d5ba", mid: "#6fa98a", near: "#3e6b55", sun: "#fbf1c9" },
  { sky: ["#e9e2f7", "#fde4d3"], far: "#a3cfea", mid: "#5fa4cf", near: "#2d6890", sun: "#fff6f0" },
  { sky: ["#f1f8fd", "#dcede3"], far: "#c3e2cf", mid: "#a3cfea", near: "#3e6b55", sun: "#fde4d3" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ridge(seed: number, base: number, amp: number, peaks: number) {
  const pts: string[] = [`0,${base + amp}`];
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * 400;
    const r = ((seed >> (i % 16)) & 7) / 7;
    const y = base + (i % 2 === 0 ? amp * (0.6 + r * 0.4) : -amp * (0.3 + r * 0.7));
    pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  pts.push("400,300", "0,300");
  return pts.join(" ");
}

export default function TrekArt({
  seed,
  snow = false,
  className = "",
}: {
  seed: string;
  snow?: boolean;
  className?: string;
}) {
  const h = hash(seed);
  const p = PALETTES[h % PALETTES.length];
  const id = `g${h}`;
  const sunX = 60 + (h % 280);
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="100%" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <circle cx={sunX} cy={70} r={26} fill={p.sun} opacity={0.9} />
      <polygon points={ridge(h, 140, 40, 5)} fill={p.far} opacity={0.75} />
      {snow && <polygon points={ridge(h, 140, 40, 5)} fill="#ffffff" opacity={0.25} />}
      <polygon points={ridge(h >> 3, 190, 35, 7)} fill={p.mid} opacity={0.85} />
      <polygon points={ridge(h >> 5, 240, 25, 9)} fill={p.near} />
    </svg>
  );
}
