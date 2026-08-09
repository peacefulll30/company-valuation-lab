"use client";

import { motion, useReducedMotion } from "framer-motion";

export type StageVisualKey = "historicals" | "forecast" | "dcf" | "scenarios" | "analyst";

/**
 * The small supporting visual beside each active scroll-story stage
 * (Design spec §2 brief): illustrative UI motion only, not a second
 * financial engine — abstract shapes, no real numbers, no implied output.
 * `active` gates the animation (paused/settled when a stage isn't the
 * focused one, so five of these aren't all animating at once).
 */
export function StageVisual({ variant, active, className }: { variant: StageVisualKey; active: boolean; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const play = active && !prefersReducedMotion;

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 220 160" className="h-full w-full overflow-visible" fill="none">
        {variant === "historicals" && <HistoricalsVisual play={play} />}
        {variant === "forecast" && <ForecastVisual play={play} />}
        {variant === "dcf" && <DcfVisual play={play} />}
        {variant === "scenarios" && <ScenariosVisual play={play} />}
        {variant === "analyst" && <AnalystVisual play={play} />}
      </svg>
    </div>
  );
}

const BARS = [
  { x: 20, h: 40 },
  { x: 56, h: 62 },
  { x: 92, h: 50 },
  { x: 128, h: 80 },
  { x: 164, h: 96 },
];

function HistoricalsVisual({ play }: { play: boolean }) {
  return (
    <g>
      <line x1={10} y1={130} x2={210} y2={130} stroke="var(--border)" strokeWidth={1} />
      {BARS.map((bar, i) => (
        <motion.rect
          key={bar.x}
          x={bar.x}
          width={20}
          rx={2}
          fill={i === BARS.length - 1 ? "var(--brand-accent)" : "var(--muted-foreground)"}
          fillOpacity={i === BARS.length - 1 ? 0.9 : 0.35}
          initial={{ height: 0, y: 130 }}
          animate={play ? { height: bar.h, y: 130 - bar.h } : { height: bar.h * 0.15, y: 130 - bar.h * 0.15 }}
          transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </g>
  );
}

function ForecastVisual({ play }: { play: boolean }) {
  const historyPath = "M10,110 L55,95 L100,75";
  const forecastPath = "M100,75 L145,55 L190,30";

  return (
    <g>
      <motion.path
        d={historyPath}
        stroke="var(--foreground)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <motion.path
        d={forecastPath}
        stroke="var(--brand-accent)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={play ? { pathLength: 1 } : { pathLength: 0.3 }}
        transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
      />
      <line x1={100} y1={20} x2={100} y2={135} stroke="var(--border)" strokeDasharray="2 3" strokeWidth={1} />
      <text x={104} y={148} className="fill-muted-foreground font-mono text-[9px] uppercase">
        forecast &rarr;
      </text>
    </g>
  );
}

function DcfVisual({ play }: { play: boolean }) {
  const marks = [
    { x: 190, delay: 0 },
    { x: 155, delay: 0.15 },
    { x: 120, delay: 0.3 },
    { x: 85, delay: 0.45 },
    { x: 50, delay: 0.6 },
  ];

  return (
    <g>
      <circle cx={30} cy={90} r={5} fill="var(--brand-accent)" fillOpacity={0.9} />
      <text x={12} y={116} className="fill-muted-foreground font-mono text-[9px] uppercase">
        pv
      </text>
      {marks.map((mark) => (
        <motion.circle
          key={mark.x}
          cy={90}
          r={3}
          fill="var(--muted-foreground)"
          initial={{ cx: mark.x, opacity: 0.7 }}
          animate={play ? { cx: [mark.x, 34], opacity: [0.7, 0.7, 0] } : { cx: mark.x, opacity: 0.5 }}
          transition={play ? { duration: 1.6, delay: mark.delay, repeat: Infinity, repeatDelay: 1.2, ease: "easeIn" } : { duration: 0 }}
        />
      ))}
    </g>
  );
}

function ScenariosVisual({ play }: { play: boolean }) {
  const rows = [
    { y: 40, w: 60, x: 100, color: "var(--chart-5)", label: "Bull" },
    { y: 80, w: 90, x: 60, color: "var(--brand-accent)", label: "Base" },
    { y: 120, w: 50, x: 30, color: "var(--chart-4)", label: "Bear" },
  ];

  return (
    <g>
      {rows.map((row, i) => (
        <motion.rect
          key={row.label}
          x={row.x}
          y={row.y - 6}
          height={12}
          rx={6}
          fill={row.color}
          fillOpacity={0.75}
          initial={{ width: 0 }}
          animate={{ width: play ? row.w : row.w * 0.3 }}
          transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </g>
  );
}

function AnalystVisual({ play }: { play: boolean }) {
  const tokens = [
    { x: 30, y: 30 },
    { x: 170, y: 40 },
    { x: 50, y: 120 },
    { x: 180, y: 110 },
    { x: 20, y: 80 },
    { x: 190, y: 75 },
  ];

  return (
    <g>
      {tokens.map((t, i) => (
        <motion.circle
          key={i}
          r={2.5}
          fill="var(--muted-foreground)"
          initial={{ cx: t.x, cy: t.y, opacity: 0.6 }}
          animate={play ? { cx: 60 + (i % 3) * 40, cy: 80, opacity: 0 } : { cx: t.x, cy: t.y, opacity: 0.4 }}
          transition={{ duration: 1, delay: 0.15 * i, ease: "easeIn" }}
        />
      ))}
      <motion.rect
        x={40}
        y={72}
        height={16}
        rx={8}
        fill="var(--brand-accent)"
        fillOpacity={0.85}
        initial={{ width: 0 }}
        animate={{ width: play ? 140 : 40 }}
        transition={{ duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </g>
  );
}
