"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero's right-column visual (Design spec §2) — an abstract "a
 * valuation model is running" motif: nodes for the model's real inputs/
 * outputs (FCF, WACC, EV, Terminal Value, Value), connected by flowing
 * lines, with labels that softly appear and fade. No numbers, no implied
 * company or price — deliberately abstract so nothing here could be
 * mistaken for real output (that's what the actual workspace is for).
 */

type NodeSpec = { id: string; x: number; y: number; label: string; delay: number };

const NODES: NodeSpec[] = [
  { id: "fcf1", x: 40, y: 60, label: "FCF", delay: 0 },
  { id: "fcf2", x: 40, y: 130, label: "FCF", delay: 0.4 },
  { id: "fcf3", x: 40, y: 200, label: "FCF", delay: 0.8 },
  { id: "wacc", x: 175, y: 130, label: "WACC", delay: 1.2 },
  { id: "tv", x: 40, y: 270, label: "Terminal Value", delay: 1.6 },
  { id: "ev", x: 300, y: 100, label: "EV", delay: 2.2 },
  { id: "value", x: 300, y: 190, label: "Value", delay: 2.6 },
];

const EDGES: Array<[string, string]> = [
  ["fcf1", "wacc"],
  ["fcf2", "wacc"],
  ["fcf3", "wacc"],
  ["tv", "wacc"],
  ["wacc", "ev"],
  ["wacc", "value"],
];

function findNode(id: string) {
  return NODES.find((n) => n.id === id)!;
}

export function ValuationEngineVisual({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 340 320" className="h-full w-full overflow-visible" fill="none">
        <defs>
          <radialGradient id="vev-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--brand-glow)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="180" cy="150" r="170" fill="url(#vev-glow)" />

        {EDGES.map(([fromId, toId], i) => {
          const from = findNode(fromId);
          const to = findNode(toId);
          const midX = (from.x + to.x) / 2;
          const path = `M ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${(from.y + to.y) / 2} T ${to.x} ${to.y}`;
          return (
            <motion.path
              key={i}
              d={path}
              stroke="var(--brand-accent)"
              strokeWidth={1}
              initial={prefersReducedMotion ? { pathLength: 1, opacity: 0.35 } : { pathLength: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { pathLength: 1, opacity: 0.35 }
                  : { pathLength: 1, opacity: [0, 0.4, 0.25, 0.4] }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      pathLength: { duration: 1.2, delay: 0.3 + i * 0.15, ease: "easeOut" },
                      opacity: {
                        duration: 4,
                        delay: 0.3 + i * 0.15,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                      },
                    }
              }
            />
          );
        })}

        {NODES.map((node) => (
          <g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={3.5}
              fill="var(--brand-accent)"
              initial={prefersReducedMotion ? { opacity: 0.85 } : { opacity: 0, scale: 0.5 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.85 }
                  : { opacity: [0, 0.9, 0.7], scale: [0.5, 1.15, 1] }
              }
              transition={{ duration: 0.8, delay: node.delay, ease: "easeOut" }}
            />
            <motion.text
              x={node.x + 10}
              y={node.y + 4}
              className="fill-muted-foreground font-mono text-[10px] tracking-wide uppercase"
              initial={prefersReducedMotion ? { opacity: 0.55 } : { opacity: 0, x: node.x + 4 }}
              animate={prefersReducedMotion ? { opacity: 0.55 } : { opacity: [0, 0.7, 0.5], x: node.x + 10 }}
              transition={{ duration: 0.8, delay: node.delay + 0.15, ease: "easeOut" }}
            >
              {node.label}
            </motion.text>
          </g>
        ))}
      </svg>
    </div>
  );
}
