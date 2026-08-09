"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero's dominant right-column object — a legible valuation bridge,
 * rebuilt for scale and clarity (V1.3): one obvious left-to-right flow
 * (Historical -> Forecast -> Discount -> Enterprise Value -> Equity
 * Value), five labels total instead of a scatter of tiny technical
 * annotations, bigger bars, a bolder single convergence gesture for
 * "discounting," and a soft depth/glow treatment so it reads as a
 * premium object, not a documentation diagram. Still fully abstract — no
 * numbers, nothing implying a real company.
 */

const BASELINE = 272;
const BAR_WIDTH = 30;

const HISTORICAL_BARS = [
  { x: 26, h: 58 },
  { x: 64, h: 82 },
  { x: 102, h: 70 },
  { x: 140, h: 100 },
];

const FORECAST_BARS = [
  { x: 200, h: 118 },
  { x: 238, h: 132 },
  { x: 276, h: 148 },
  { x: 314, h: 164 },
];

const CONVERGE_POINT = { x: 386, y: 168 };

const STAGES = [
  { label: "Historical", x: 96 },
  { label: "Forecast", x: 262 },
  { label: "Discount", x: 366 },
  { label: "Enterprise value", x: 433 },
  { label: "Equity value", x: 502 },
];

export function ValuationEngineVisual({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const settle = prefersReducedMotion;

  const firstForecast = FORECAST_BARS[0];
  const lastForecast = FORECAST_BARS[FORECAST_BARS.length - 1];
  const src1 = { x: firstForecast.x + BAR_WIDTH / 2, y: BASELINE - firstForecast.h };
  const src2 = { x: lastForecast.x + BAR_WIDTH / 2, y: BASELINE - lastForecast.h };

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 540 320" className="h-full w-full overflow-visible" fill="none">
        <defs>
          <radialGradient id="vev-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--brand-glow)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vev-glow-answer" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--brand-glow)" stopOpacity="0" />
          </radialGradient>
          <filter id="vev-depth" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        <circle cx="300" cy="150" r="230" fill="url(#vev-glow)" />
        <circle cx="495" cy="150" r="110" fill="url(#vev-glow-answer)" />

        {/* Flow labels — the whole point of the visual, so these are the only text in it. */}
        {STAGES.map((stage, i) => (
          <motion.text
            key={stage.label}
            x={stage.x}
            y={22}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase"
            initial={{ opacity: 0, y: settle ? 0 : -4 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ duration: 0.5, delay: settle ? 0 : 0.15 + i * 0.06 }}
          >
            {stage.label}
          </motion.text>
        ))}

        <line x1={8} y1={BASELINE} x2={532} y2={BASELINE} stroke="var(--border)" strokeWidth={1} />
        <line
          x1={174}
          y1={44}
          x2={174}
          y2={BASELINE}
          stroke="var(--border)"
          strokeDasharray="2 5"
          strokeWidth={1}
          opacity={0.7}
        />

        <g filter="url(#vev-depth)">
          {/* Historical — solid, settled */}
          {HISTORICAL_BARS.map((bar, i) => (
            <motion.rect
              key={`h-${bar.x}`}
              x={bar.x}
              width={BAR_WIDTH}
              rx={4}
              fill="var(--muted-foreground)"
              fillOpacity={0.38}
              initial={{ height: 0, y: BASELINE }}
              animate={{ height: bar.h, y: BASELINE - bar.h }}
              transition={{ duration: 0.75, delay: settle ? 0 : 0.1 + i * 0.07, ease: "easeOut" }}
            />
          ))}

          {/* Forecast — the same trend, extended, brass-tinted */}
          {FORECAST_BARS.map((bar, i) => (
            <motion.rect
              key={`f-${bar.x}`}
              x={bar.x}
              width={BAR_WIDTH}
              rx={4}
              fill="var(--brand-accent)"
              fillOpacity={0.18}
              stroke="var(--brand-accent)"
              strokeWidth={1.25}
              strokeDasharray="4 4"
              initial={{ height: 0, y: BASELINE }}
              animate={{ height: bar.h, y: BASELINE - bar.h }}
              transition={{ duration: 0.75, delay: settle ? 0 : 0.45 + i * 0.08, ease: "easeOut" }}
            />
          ))}

          {/* Discount — one bold gesture, not a scatter of arcs */}
          {[src1, src2].map((src, i) => {
            const midX = (src.x + CONVERGE_POINT.x) / 2;
            const path = `M ${src.x} ${src.y} Q ${midX} ${src.y + 18} ${CONVERGE_POINT.x} ${CONVERGE_POINT.y}`;
            return (
              <motion.path
                key={`d-${i}`}
                d={path}
                stroke="var(--brand-accent)"
                strokeWidth={1.75}
                strokeLinecap="round"
                initial={settle ? { pathLength: 1, opacity: 0.4 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.45 }}
                transition={{ duration: 0.9, delay: settle ? 0 : 1 + i * 0.12, ease: "easeOut" }}
              />
            );
          })}

          {/* A single traveling pulse along the primary discount path — the one "path progression" gesture. */}
          {!settle ? (
            <motion.circle
              r={3.5}
              fill="var(--brand-glow)"
              initial={{ opacity: 0 }}
              animate={{
                cx: [src2.x, (src2.x + CONVERGE_POINT.x) / 2, CONVERGE_POINT.x],
                cy: [src2.y, src2.y + 18, CONVERGE_POINT.y],
                opacity: [0, 0.9, 0],
              }}
              transition={{ duration: 1.8, delay: 1.9, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
            />
          ) : null}

          {/* Enterprise Value */}
          <motion.rect
            x={402}
            y={104}
            width={48}
            height={168}
            rx={12}
            fill="var(--brand-accent)"
            fillOpacity={0.18}
            stroke="var(--brand-accent)"
            strokeWidth={1.25}
            initial={{ opacity: 0, scaleY: 0.85 }}
            animate={{ opacity: 1, scaleY: 1 }}
            style={{ transformOrigin: "426px 272px" }}
            transition={{ duration: 0.6, delay: settle ? 0 : 2, ease: "easeOut" }}
          />

          {/* Bridge connector: EV steps down/across into Equity Value */}
          <motion.path
            d="M 450 168 H 466 V 150 H 470"
            stroke="var(--muted-foreground)"
            strokeWidth={1.25}
            strokeDasharray="2 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 0.5, delay: settle ? 0 : 2.3, ease: "easeOut" }}
          />

          {/* Equity Value — the resolved answer, brightest element on the canvas */}
          <motion.rect
            x={470}
            y={82}
            width={54}
            height={190}
            rx={12}
            fill="var(--brand-accent)"
            fillOpacity={0.3}
            stroke="var(--brand-accent)"
            strokeWidth={1.5}
            initial={{ opacity: 0, scaleY: 0.85 }}
            animate={{ opacity: 1, scaleY: 1 }}
            style={{ transformOrigin: "497px 272px" }}
            transition={{ duration: 0.6, delay: settle ? 0 : 2.45, ease: "easeOut" }}
          />
        </g>

        {/* Range bracket — a spread of outcomes, the product's own signature motif */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.6, delay: settle ? 0 : 2.9 }}>
          <line x1={470} y1={292} x2={524} y2={292} stroke="var(--brand-accent)" strokeWidth={1} />
          <line x1={470} y1={286} x2={470} y2={298} stroke="var(--brand-accent)" strokeWidth={1} />
          <line x1={524} y1={286} x2={524} y2={298} stroke="var(--brand-accent)" strokeWidth={1} />
        </motion.g>
      </svg>
    </div>
  );
}
