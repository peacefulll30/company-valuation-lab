"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero's right-column visual — a legible "valuation bridge," not a
 * generic node graph: real historical bars extend into a forecast, the
 * forecast years visually discount/converge into an EV figure, which
 * steps down into an Equity Value figure, capped with the product's own
 * range-bracket motif. Reads as "a valuation model is running" without a
 * single number anywhere — deliberately abstract so nothing here could be
 * mistaken for a real company's output (that's what the workspace is for).
 */

const BASELINE = 200;

const HISTORICAL_BARS = [
  { x: 22, h: 36 },
  { x: 48, h: 50 },
  { x: 74, h: 44 },
  { x: 100, h: 62 },
];

const FORECAST_BARS = [
  { x: 146, h: 72 },
  { x: 172, h: 82 },
  { x: 198, h: 90 },
  { x: 224, h: 98 },
];

const BAR_WIDTH = 18;

const TV_DOTS = [
  { x: 250, y: BASELINE - 104 },
  { x: 259, y: BASELINE - 110 },
  { x: 268, y: BASELINE - 116 },
];

const CONVERGE_POINT = { x: 300, y: 128 };

const DISCOUNT_SOURCES = [
  ...FORECAST_BARS.map((b) => ({ x: b.x + BAR_WIDTH / 2, y: BASELINE - b.h })),
  { x: 268, y: BASELINE - 116 },
];

export function ValuationEngineVisual({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const settle = prefersReducedMotion;

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 460 260" className="h-full w-full overflow-visible" fill="none">
        <defs>
          <radialGradient id="vev-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--brand-glow)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="270" cy="140" r="200" fill="url(#vev-glow)" />

        {/* Axis + "today" divider between historical and forecast */}
        <line x1={124} y1={36} x2={124} y2={BASELINE + 10} stroke="var(--border)" strokeDasharray="2 4" strokeWidth={1} />
        <text x={124} y={BASELINE + 28} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px] tracking-wide uppercase">
          today
        </text>
        <line x1={10} y1={BASELINE} x2={450} y2={BASELINE} stroke="var(--border)" strokeWidth={1} />

        {/* Historical bars — filled, solid */}
        {HISTORICAL_BARS.map((bar, i) => (
          <motion.rect
            key={`h-${bar.x}`}
            x={bar.x}
            width={BAR_WIDTH}
            rx={2}
            fill="var(--muted-foreground)"
            fillOpacity={0.4}
            initial={{ height: 0, y: BASELINE }}
            animate={{ height: settle ? bar.h : bar.h, y: BASELINE - bar.h }}
            transition={{ duration: 0.7, delay: settle ? 0 : i * 0.07, ease: "easeOut" }}
          />
        ))}

        {/* Forecast bars — dashed outline, brass tint: the same trend, extended */}
        {FORECAST_BARS.map((bar, i) => (
          <motion.rect
            key={`f-${bar.x}`}
            x={bar.x}
            width={BAR_WIDTH}
            rx={2}
            fill="var(--brand-accent)"
            fillOpacity={0.14}
            stroke="var(--brand-accent)"
            strokeWidth={1}
            strokeDasharray="3 3"
            initial={{ height: 0, y: BASELINE }}
            animate={{ height: bar.h, y: BASELINE - bar.h }}
            transition={{ duration: 0.7, delay: settle ? 0 : 0.4 + i * 0.08, ease: "easeOut" }}
          />
        ))}

        {/* Terminal value — three ascending dots suggesting "continues beyond the explicit forecast" */}
        {TV_DOTS.map((dot, i) => (
          <motion.circle
            key={`tv-${i}`}
            cx={dot.x}
            cy={dot.y}
            r={2}
            fill="var(--brand-accent)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.5, delay: settle ? 0 : 0.9 + i * 0.1 }}
          />
        ))}
        <text x={266} y={BASELINE - 130} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px] uppercase">
          terminal value
        </text>

        {/* Discounting — future cash flow marks converging toward today's value, at WACC */}
        {DISCOUNT_SOURCES.map((src, i) => {
          const midX = (src.x + CONVERGE_POINT.x) / 2;
          const path = `M ${src.x} ${src.y} Q ${midX} ${src.y + 14} ${CONVERGE_POINT.x} ${CONVERGE_POINT.y}`;
          return (
            <motion.path
              key={`d-${i}`}
              d={path}
              stroke="var(--brand-accent)"
              strokeWidth={1}
              initial={settle ? { pathLength: 1, opacity: 0.3 } : { pathLength: 0, opacity: 0 }}
              animate={
                settle
                  ? { pathLength: 1, opacity: 0.3 }
                  : { pathLength: 1, opacity: [0, 0.4, 0.22, 0.4] }
              }
              transition={
                settle
                  ? { duration: 0 }
                  : {
                      pathLength: { duration: 1, delay: 1.1 + i * 0.1, ease: "easeOut" },
                      opacity: { duration: 3.6, delay: 1.1 + i * 0.1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                    }
              }
            />
          );
        })}
        <text x={289} y={168} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px] uppercase">
          wacc
        </text>

        {/* Enterprise Value */}
        <motion.rect
          x={306}
          y={90}
          width={32}
          height={92}
          rx={8}
          fill="var(--brand-accent)"
          fillOpacity={0.16}
          stroke="var(--brand-accent)"
          strokeWidth={1}
          initial={{ opacity: 0, scaleY: 0.85 }}
          animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: "322px 182px" }}
          transition={{ duration: 0.6, delay: settle ? 0 : 1.7, ease: "easeOut" }}
        />
        <text x={322} y={80} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-medium tracking-wide uppercase">
          EV
        </text>

        {/* Bridge connector: EV steps down into Equity Value (EV minus net debt) */}
        <motion.path
          d="M 338 148 H 354 V 168 H 372"
          stroke="var(--muted-foreground)"
          strokeWidth={1}
          strokeDasharray="2 3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 0.5, delay: settle ? 0 : 2, ease: "easeOut" }}
        />
        <text x={356} y={160} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px] uppercase">
          net debt
        </text>

        {/* Equity Value — the walk's resolved figure */}
        <motion.rect
          x={372}
          y={116}
          width={32}
          height={78}
          rx={8}
          fill="var(--brand-accent)"
          fillOpacity={0.26}
          stroke="var(--brand-accent)"
          strokeWidth={1.25}
          initial={{ opacity: 0, scaleY: 0.85 }}
          animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: "388px 194px" }}
          transition={{ duration: 0.6, delay: settle ? 0 : 2.2, ease: "easeOut" }}
        />
        <text x={388} y={106} textAnchor="middle" className="fill-foreground font-mono text-[9px] font-medium tracking-wide uppercase">
          equity
        </text>
        <text x={388} y={207} textAnchor="middle" className="fill-foreground font-mono text-[9px] font-medium tracking-wide uppercase">
          value
        </text>

        {/* Range bracket — a spread of outcomes, not a single point (the product's own signature motif) */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ duration: 0.6, delay: settle ? 0 : 2.5 }}
        >
          <line x1={370} y1={224} x2={406} y2={224} stroke="var(--brand-accent)" strokeWidth={1} />
          <line x1={370} y1={219} x2={370} y2={229} stroke="var(--brand-accent)" strokeWidth={1} />
          <line x1={406} y1={219} x2={406} y2={229} stroke="var(--brand-accent)" strokeWidth={1} />
        </motion.g>

        {/* Softly appearing/fading metric labels */}
        <FloatingLabel x={184} y={54} text="fcf" delay={0.6} play={!settle} />
        <FloatingLabel x={78} y={148} text="historical" delay={0.2} play={!settle} />
      </svg>
    </div>
  );
}

function FloatingLabel({ x, y, text, delay, play }: { x: number; y: number; text: string; delay: number; play: boolean }) {
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor="middle"
      className="fill-muted-foreground font-mono text-[9px] tracking-wide uppercase"
      initial={{ opacity: 0 }}
      animate={play ? { opacity: [0, 0.55, 0.35] } : { opacity: 0.4 }}
      transition={play ? { duration: 4.5, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 0.5, delay }}
    >
      {text}
    </motion.text>
  );
}
