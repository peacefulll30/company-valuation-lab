"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero's dominant right-column object (V1.4 — simplified again after
 * the EV/Equity bridge version read as a technical diagram rather than a
 * premium hero object). One idea, instantly readable: historical revenue
 * extends into a forecast. Muted bars for the real past, restrained brass
 * for the projected future, one continuous trend line drawn across both,
 * two labels total. No numbers, nothing implying a real company.
 */

const BASELINE = 270;
const BAR_WIDTH = 28;

const HISTORICAL_HEIGHTS = [64, 88, 76, 104, 96];
const FORECAST_HEIGHTS = [112, 124, 136, 148, 160];

const HISTORICAL_X = [30, 72, 114, 156, 198];
const FORECAST_X = [254, 296, 338, 380, 422];

const historicalPoints = HISTORICAL_X.map((x, i) => ({ x: x + BAR_WIDTH / 2, y: BASELINE - HISTORICAL_HEIGHTS[i] }));
const forecastPoints = FORECAST_X.map((x, i) => ({ x: x + BAR_WIDTH / 2, y: BASELINE - FORECAST_HEIGHTS[i] }));

function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

// The forecast line starts at the last historical point so the two
// segments join with no visible seam, even though they're stroked in
// different colors.
const historicalLine = linePath(historicalPoints);
const forecastLine = linePath([historicalPoints[historicalPoints.length - 1], ...forecastPoints]);

export function ValuationEngineVisual({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const settle = prefersReducedMotion;

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 480 340" className="h-full w-full overflow-visible" fill="none">
        <defs>
          <radialGradient id="vev-glow-forecast" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--brand-glow)" stopOpacity="0" />
          </radialGradient>
          <filter id="vev-depth" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#000000" floodOpacity="0.32" />
          </filter>
        </defs>

        <circle cx="338" cy="190" r="190" fill="url(#vev-glow-forecast)" />

        {/* Two labels total — the whole point of the visual should read in one second. */}
        <motion.text
          x={114}
          y={26}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[12px] tracking-[0.1em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ duration: 0.5, delay: settle ? 0 : 0.1 }}
        >
          Historical
        </motion.text>
        <motion.text
          x={338}
          y={26}
          textAnchor="middle"
          className="fill-brand-accent font-mono text-[12px] tracking-[0.1em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.5, delay: settle ? 0 : 0.8 }}
        >
          Forecast
        </motion.text>

        <line x1={8} y1={BASELINE} x2={472} y2={BASELINE} stroke="var(--border)" strokeWidth={1} />
        <line
          x1={240}
          y1={44}
          x2={240}
          y2={BASELINE}
          stroke="var(--border)"
          strokeDasharray="2 5"
          strokeWidth={1}
          opacity={0.6}
        />

        <g filter="url(#vev-depth)">
          {HISTORICAL_X.map((x, i) => (
            <motion.rect
              key={`h-${x}`}
              x={x}
              width={BAR_WIDTH}
              rx={5}
              fill="var(--muted-foreground)"
              fillOpacity={0.32}
              initial={{ height: 0, y: BASELINE }}
              animate={{ height: HISTORICAL_HEIGHTS[i], y: BASELINE - HISTORICAL_HEIGHTS[i] }}
              transition={{ duration: 0.7, delay: settle ? 0 : 0.1 + i * 0.07, ease: "easeOut" }}
            />
          ))}

          {FORECAST_X.map((x, i) => (
            <motion.rect
              key={`f-${x}`}
              x={x}
              width={BAR_WIDTH}
              rx={5}
              fill="var(--brand-accent)"
              fillOpacity={0.2}
              initial={{ height: 0, y: BASELINE }}
              animate={{ height: FORECAST_HEIGHTS[i], y: BASELINE - FORECAST_HEIGHTS[i] }}
              transition={{ duration: 0.7, delay: settle ? 0 : 0.55 + i * 0.07, ease: "easeOut" }}
            />
          ))}

          {/* One continuous trend line — the "we analyze the past and forecast the future" idea, made literal. */}
          <motion.path
            d={historicalLine}
            stroke="var(--foreground)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={settle ? { pathLength: 1, opacity: 0.85 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 0.9, delay: settle ? 0 : 0.15, ease: "easeOut" }}
          />
          <motion.path
            d={forecastLine}
            stroke="var(--brand-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 0"
            initial={settle ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: settle ? 0 : 1, ease: "easeOut" }}
          />

          {[...historicalPoints, ...forecastPoints].map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill={i < historicalPoints.length ? "var(--foreground)" : "var(--brand-accent)"}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: settle ? 0 : (i < historicalPoints.length ? 0.15 + i * 0.14 : 1 + (i - historicalPoints.length) * 0.14) + 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
