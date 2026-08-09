# Company Valuation Lab — CLAUDE.md

Durable implementation rules. Full detail lives in `docs/research/`, `docs/prd/`,
`docs/architecture/`, `docs/design/` — read those before building; this file is the operational
summary, not a replacement.

**Precedence when docs conflict**: PRD and Architecture are the locked, current source of truth
for scope and structure. Research is historical rationale and is not fully in sync with current V1
scope (see "Known doc conflict"). Never resolve a scope question by defaulting to Research over
PRD/Architecture.

## Known doc conflict

Research recommends curated-only companies with no live "any-ticker" search (frames search as a V2
idea). PRD/Architecture supersede this: V1 includes search-any-company (best effort) alongside a
Featured/Guaranteed curated set. Build to PRD/Architecture, not Research, on this point.

## Scope / V1 boundaries

- V1 = Featured (8–12 curated, verified) companies + search-any-public-operating-company (best
  effort). No accounts, no PDF export, no real-time price streaming, no automated comps peer
  selection, no backtesting, no multi-currency.
- **No banks, insurers, or other financial institutions in the V1 valuation engine** — excluded by
  construction from the Featured list, and detected/blocked via SIC-code eligibility check for any
  searched company. Never analyze one, even partially.

## Architecture boundaries

- `/lib/engine` is pure TypeScript: no React, no Next.js, no `ai`/`@ai-sdk/*` imports, no I/O, no
  `Date.now()`. It is the only place financial math is implemented.
- UI code and the AI Analyst both call `/lib/engine` — never reimplement a formula inline anywhere
  else: not in a component, a route handler, or a prompt.
- Featured company data is imported directly from `/data/featured/*.json` — no API route, no live
  fetch in that path, ever.
- Search-tier data flows through one pipeline: resolve → retrieve → normalize → validate → cache →
  engine, returning a discriminated union (`ok | unsupported | data_unavailable | no_results`) —
  never a partial `CompanyFinancials` object.

## Financial invariants (locked — do not change without explicit user sign-off)

- `NOPAT = EBIT × (1 − tax rate)`
- `UFCF = NOPAT + D&A − CapEx − ΔNWC` — this exact form, everywhere.
- `EBITDA = EBIT + D&A` (derived). A company's own reported EBITDA may only appear as a labeled
  cross-check, never substituted in.
- `Enterprise Value = PV(UFCF) + PV(Terminal Value)`; `Equity Value = EV − Net Debt` (Net Debt can
  be negative); `Implied Share Price = Equity Value ÷ Diluted Shares Outstanding`.
- `WACC > Terminal Growth Rate` enforced everywhere the perpetuity formula is used — block/clamp
  with a message, in both assumption input and every sensitivity-grid cell. Never silently compute
  a cell where growth ≥ WACC.
- Scenarios (Bear/Base/Bull) vary operating assumptions only; WACC stays constant across all three
  in V1.
- Never default a missing required financial field to 0 — a missing value is a data error, not a
  zero.

## AI Analyst

- The AI explains and interprets only. It never computes a financial number itself.
- Exactly one tool: `recalculateValuation`, which calls `/lib/engine` in-process. No other numeric
  path may exist for the model.
- The server — not the client — re-derives `ValuationModelState` before every chat turn. Never
  trust a client-supplied model-state blob as grounding context.
- AI responses must reference specific model-state values for any numeric claim; anything outside
  computed state is declined or explicitly flagged, not guessed.

## Data: Featured vs. Search, and source/as-of

- Featured = static, pre-verified, committed JSON, human-reviewed. Search = live SEC EDGAR
  retrieval, best-effort, cached, never guaranteed.
- Both tiers use the **same** `edgar` mapping module — do not write a second XBRL-to-schema mapper.
- Every externally sourced number (financials, market price, WACC components) is a `SourcedValue`
  with `source` + `asOf`. Render nothing externally sourced without both, no exceptions.

## Unsupported / data-unavailable behavior

- Three distinct terminal states for a search: `unsupported` (bank/insurer/incompatible structure),
  `data_unavailable` (insufficient/unreliable retrieved data), `no_results` (no match). Each gets
  its own clear message. Never blend them, never fall back to a partial analysis.
- A failed price fetch is not one of these three — it degrades to "price unavailable," since price
  isn't required for the DCF math, only the market comparison.

## Stack / structure

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui components in `/components/ui`,
  lucide-react icons, framer-motion (scoped — see Design system below). Zod at every data/AI
  boundary.
- Follow the routing/file structure in `docs/architecture/company-valuation-lab-architecture.md`
  §2/§13. Nine addressable tabs under `/valuation/[companySlug]/`; **WACC is not a tenth tab** —
  it's a panel inside Forecast (mandatory) and DCF (advanced), per the Design spec.
- Server-only work (data retrieval, AI calls, secrets) stays in Route Handlers/Server Actions —
  never in client components.

## Design system

Full spec: `docs/design/company-valuation-lab-design.md`.

- Palette: paper/ink base + one brass accent, used only for the primary CTA and the one "answer"
  number per screen. Typography: Fraunces (display/hero only), Inter (UI/body), IBM Plex Mono
  (source/as-of tags, technical labels) — don't blur these roles.
- Flat cards, hairline borders, small radius — no heavy shadows, no oversized empty cards, no
  gradients/glassmorphism, no crypto/trading-app visual language.
- Mandatory assumptions stay visible by default; every Advanced group is a closed-by-default
  disclosure labeled with its actual contents.
- **Approved motion, and only this motion**: the animated hero (staggered text reveal, Framer
  Motion) and the InteractiveHoverButton-style CTA (arrow slide + fill sweep on hover), both
  respecting `prefers-reduced-motion` (collapse to opacity-only / instant). Don't add animation
  elsewhere without a stated reason.

## Charts / dataviz

- Only the 8 charts specified in the Design spec §5 — no chart added without a stated question it
  answers.
- Never a dual-axis chart. Categorical colors in fixed slot order. Diverging colors only for
  Bear/Base/Bull and the sensitivity heatmap (around the Base case) — not decoratively elsewhere.
- Every chart: hover tooltip with exact values, a "view as table" toggle, keyboard-focusable marks
  with the same tooltip content on focus as on hover.
- **The chart palette in the Design spec is unvalidated.** Run `validate_palette.js` (dataviz
  skill) against the proposed hexes, light and dark surfaces, before shipping any chart.

## Accessibility / responsive

- Full keyboard operability, visible focus rings, semantic HTML by default (ARIA only for real
  gaps). Status/range information never relies on color alone.
- Verify desktop, tablet, and mobile — including the sensitivity heatmap (horizontal scroll, sticky
  row labels) and football-field chart on small screens.

## Testing

- Every `/lib/engine` function gets unit tests against hand-calculated fixtures before it's
  considered done, including the edge cases in PRD §13 (negative EBITDA/UFCF, WACC ≤ g, net cash,
  zero shares, missing data).
- The search pipeline gets integration tests covering a valid company, a SIC-blocklist hit, missing
  required tags, and a non-10-K/10-Q filer.
- AI grounding gets spot-check tests: the tool is actually invoked for "what if" questions, and
  numeric claims cross-check against the model-state snapshot passed in.

## Git / deployment safety

- Never commit, push, deploy, or install a dependency unless explicitly asked in that turn.
  Approval for one action is not standing approval for the next.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
