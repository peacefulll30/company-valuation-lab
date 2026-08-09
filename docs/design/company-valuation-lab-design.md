# Company Valuation Lab — Design Specification (V1)

Source of truth for scope/requirements: PRD and Architecture. This document defines the visual
and interaction design — it does not repeat functional requirements, routes, or data contracts
already specified there. Nothing here is final component code; it's the direction the
Design/Implementation stage builds from.

**Cross-reference check:** Architecture §2 routes to 9 tabs (Overview, Historical Financials,
Forecast, DCF, Scenarios, Sensitivity, Comps, Summary, Analyst) — there is no separate `/wacc`
route, and PRD §8 places WACC under "Tax & discounting," not as its own mandatory/advanced row.
This spec follows that: **WACC is not a tenth tab.** It's designed as a panel embedded in Forecast
(mandatory: one pre-filled number) and DCF (advanced: full CAPM build) — see §3.5.

## 1. Design Direction

**Thesis:** valuation is never a single number — it's a range produced by stated assumptions. The
whole visual system is built around that idea rather than around "finance = navy and gold." The
signature device is a **range bracket** (`⊢────⊣`): a thin, precise horizontal marker with two end
ticks. It appears as the football-field chart's core grammar, as a recurring small glyph beside any
number that represents a range rather than a point, and as the loading-state animation (a wide
bracket narrowing to a precise width as data resolves) — a literal, subject-specific metaphor for
"uncertainty resolving into an estimate," not a generic spinner.

**Palette** (light-mode-first; see §7 for dark-mode direction):

| Role | Hex | Use |
|---|---|---|
| Paper (primary surface) | `#F7F5F1` | Page background — warm off-white, not stark white |
| Ink (primary text) | `#14171F` | Body text, primary UI — deep blue-charcoal, not pure black |
| Slate (secondary) | `#5B6472` | Secondary text, borders, chrome |
| Hairline | `#E4E0D8` | Dividers, card borders, table rules |
| Accent — brass | `#B8863B` | The primary CTA, the one "answer" number per screen, active-tab marker. Used sparingly — one accent, not a palette of accents. |

This avoids the three defaults the frontend-design skill flags (cream+serif+terracotta,
near-black+neon, broadsheet-hairline-newspaper) by grounding the palette in the product's own idea
(paper/ledger, not a genre convention) and by using brass as a single restrained "value marker"
rather than a decorative gradient.

**Chart palette** (categorical + diverging, built for this brand, following the validated
*structure* in the dataviz skill's reference palette — fixed slot order, diverging pair + neutral
midpoint, status colors kept separate from categorical):

| Role | Hex | Use |
|---|---|---|
| Categorical slot 1 | `#2B3648` (deep slate-navy) | Revenue, primary series |
| Categorical slot 2 | `#B8863B` (brass, same as UI accent) | EBITDA, secondary series |
| Categorical slot 3 | `#3E7C74` (muted teal) | Third line series (e.g., Net margin) |
| Diverging — negative pole | `#A6432F` (muted brick) | Bear, below-base-case |
| Diverging — positive pole | `#4B7A5B` (muted sage) | Bull, above-base-case |
| Diverging — neutral | `#5B6472` (slate) | Base case |

**These hexes are a proposed direction, not yet machine-validated.** This environment has no
Node runtime available (and installing one is out of scope for this stage), so
`validate_palette.js` could not be run against them. **Before any chart ships, run it** against
these exact values, light **and** dark surfaces, per the dataviz skill's own non-negotiable — this
is the one real blocker on this spec (see the closing summary).

**Typography** — three faces, each with a distinct job (not decoration):
- **Fraunces** (serif, display) — hero headline, the single "Fair Value" hero figure on Valuation
  Summary, section eyebrow numerals. Used with restraint: nowhere else.
- **Inter** (sans, UI/body) — everything else: nav, forms, tables, AI Analyst prose, buttons.
  Chosen for legibility at data density (excellent tabular figures, wide weight range) over
  novelty — the right trade for a dense financial tool.
- **IBM Plex Mono** (data/reference) — source/as-of tags, XBRL filing references, the "Advanced"
  chip, sensitivity-grid axis ticks. Signals "this is a raw sourced fact," distinct from Inter's
  "this is interface" and Fraunces's "this is the conclusion." All three are open-license — no
  font-licensing risk.

Both Fraunces and IBM Plex Mono are used narrowly and specifically, so the restraint itself reads
as a choice, not an oversight — the frontend-design skill's "spend your boldness in one place"
applies to type as much as to layout.

## 2. Landing / Intro

**Hero** (Framer Motion, the approved animated-hero reference, adapted with real product copy —
not demo text):

- Eyebrow (small, mono, tracked out): `DCF · WACC · SCENARIOS · SENSITIVITY · AI ANALYST`
- Headline (Fraunces, staggered word-group reveal, ~50ms stagger, y-offset + fade — not a
  per-character typewriter, which reads as generic/AI-generated):
  *"What is this company actually worth — and how confident should you be?"*
- Sub-headline (Inter, fades in after headline settles):
  *"Company Valuation Lab builds a full DCF, WACC, scenario, and sensitivity model from real
  filings — then shows exactly which assumptions are driving the answer."*
- **The "subtle live/data motion"** requested is this same moment, not a separate effect: a small
  example figure beside the headline shows a range bracket narrowing to a resolved value (e.g.
  "$142–$198 → $167") once, after the text settles — a single deliberate beat, not a looping
  animation. This is the hero's only motion beyond text entrance, per "spend your boldness in one
  place."
- Primary CTA — **InteractiveHoverButton-style**, label locked to **"Start Valuation"**: flat
  ink-filled rectangle at rest, paper-colored label. On hover (~180ms, expo-out easing): the label
  shifts left, a brass fill sweeps in left-to-right beneath it, and a small arrow (lucide
  `ArrowRight`) slides in and settles at the right edge. Precise and fast, not bouncy — confidence,
  not playfulness.
- Reduced motion: the sequence collapses to a single opacity fade for the hero, and the CTA hover
  becomes an instant color swap with no sweep/slide.

**"What can this platform do?"** — a compact 4-item capability grid below the fold (Historical
Analysis, Forecasting, DCF + Scenarios, AI Analyst), each a short label + one sentence, no icon-in-
circle blobs — a small lucide icon and a hairline-bordered flat card per item.

**Methodology / trust rail** — a horizontal 4-step rail (Historicals → Forecast → DCF →
Scenarios/Sensitivity) connected by a hairline, mono step numerals (01–04, justified here because
it's a real sequence, not decoration), plus one line on sourcing: *"Every figure traces to a filing
or a stated assumption — SEC EDGAR for financials, dated defaults for market inputs."* Disclaimer
line directly beneath, small and permanent, not a dismissible banner: *"Model-based estimates for
research and portfolio purposes. Not investment advice."*

**Featured Companies preview** — a horizontal strip of 8–12 flat cards (ticker, name, sector),
styled like a research-desk coverage list, not app-store tiles: hairline border, no logos/photos,
mono ticker + Inter name. Clicking one skips search and opens that company's Overview directly.

## 3. App Shell

**Top bar**: wordmark (`Company Valuation Lab`, Inter medium, "Lab" set in Fraunces italic as the
one distinguishing touch) + a persistent, prominent search input (not an icon-triggered overlay —
search is core V1, not secondary) + a "Featured" quick-access affordance.

**Inside a company's flow** (`/valuation/[companySlug]/*`): a **left sidebar rail**, not a top tab
strip — closer to a research-terminal workspace than a marketing site. Each of the 9 addressable
tabs (§Architecture 2) is a row: mono step numeral (01–09) + label. Active tab = a 2px brass left
border + bold label, never a filled pill (keeps the flat, restrained language consistent).
Numbering is justified here — this is a real guided sequence, even though every step is also
independently reachable.

**Persistent company context header**, visible from every tab: ticker, name, tier badge
(`Featured` / a subtle `Searched` label), current price with its as-of tag, and — once computed —
a small **persistent "Fair Value" stat** pinned in the sidebar footer, updating live as assumptions
change. This is the one number the whole product exists to produce; it stays visible while the
user explores every other tab, per finance-product-builder's visual-hierarchy rule.

**Mobile**: sidebar collapses to a bottom sheet triggered from a compact top bar; the persistent
Fair Value stat moves to a slim sticky footer bar instead of a sidebar footer.

## 3.x Product Sections — Layout & Purpose

**Overview** — two columns: identity (name, ticker, sector, description, tier) beside a key-stat
rail (market cap, price + as-of). A small revenue sparkline beneath answers a different, narrower
question than Historicals' full trend chart ("quick gut check" vs. "detailed trend") — justified as
distinct, not redundant.

**Historical Financials** — a real `<table>`, years as columns, tabular-nums, hairline row rules.
The EBITDA row carries a small "derived" mono tag (EBIT + D&A, per PRD invariant #3) — never
presented as identical in kind to a directly-sourced row. Any cell reveals its `SourcedValue`
(filing, XBRL tag, as-of date) on hover/focus. Below the table: three small-multiple charts in a
row (Revenue/EBITDA, Margins, FCF — §5), not one oversized combined chart.

**Forecast** — two columns. Left: the 5 Mandatory assumption inputs (slider + synced numeric
field, per §4) in a clean vertical form, WACC's pre-filled value carrying its source/as-of tag.
Right: the Historical-vs-Forecast chart (§5), updating live on every input change — the direct
visual payoff for editing an assumption. Advanced assumptions collapsed beneath, per §4.

**DCF** — the UFCF bridge as a real table (Revenue→EBITDA→EBIT→NOPAT→UFCF per forecast year), not
an arrow diagram that would imply false precision. Below: the EV→Equity Value waterfall (§5), then
both terminal-value figures side by side with a divergence flag if they differ materially. The
WACC "Advanced" panel (§3.5) lives here, directly beside the discounting step it feeds.

**3.5 WACC** (embedded, not a tab) — two levels of detail:
- *Forecast (mandatory)*: one labeled WACC value, source/as-of tag, a "Why this number?" link.
- *DCF (advanced disclosure)*: a stacked formula-ledger — Risk-free rate, Beta, Equity Risk
  Premium → Cost of Equity; Pre-tax Cost of Debt, Tax Rate → after-tax Cost of Debt; capital
  weights → **WACC** — each row its own labeled value with its own source/as-of tag. A precise
  list, not a diagram; legibility over flourish.

**Scenarios** — Bear/Base/Bull shown **simultaneously** (PRD FR-35), not one-at-a-time behind a
toggle: the comparison bar chart (§5) plus a compact table beneath showing which assumptions differ
per scenario, so "what changed" sits next to "what it produced."

**Sensitivity** — the heatmap (§5) as the dominant element, with the current Base-case cell marked
by a ring (never color alone). Caption beneath restates the model-output-not-forecast framing
(FR-38).

**Trading Comps** — a table with the subject company visually distinguished (a 2px brass left
accent on its row, not a separate box) above the peer rows. Beneath: a compact range-bracket
indicator for the peer-implied range, kept visually separate from the DCF range (FR-42) — different
section, same signature glyph, no shared axis implying false comparability.

**Valuation Summary** — the screen's hero is the base fair-value figure, set in Fraunces at the
largest scale in the product (finance-product-builder's "unmistakably most prominent" rule, applied
literally). A 3-line stat block (Base Fair Value / Range / Upside-Downside, worded per PRD FR-46's
assumption-anchored bands) sits above the football-field chart (§5).

**AI Analyst** — see §6.

## 4. Mandatory vs. Advanced UX

Every Advanced group is a **closed-by-default disclosure**, labeled with its actual contents — e.g.
`Advanced: margin trajectory, CapEx & working capital, WACC build` — not a bare "Advanced" toggle,
so a user can judge relevance before opening it. A small mono "Advanced" chip marks these
consistently across Forecast and DCF, the only two screens with Advanced groups. Opening one panel
never auto-expands others; every panel starts collapsed on each visit — the "never overwhelm" rule
holds every time, not just on first use. Opened panels get a barely-there background tint (a few
percent darker than Paper) to read as "expert territory" without walling it off as a separate card.

## 5. Financial Visualizations

Each entry: form → color job → what question it answers. Every chart gets a hover
tooltip/crosshair with exact values and a "view as table" toggle (accessibility, §8) — stated once
here, not repeated per chart.

1. **Revenue / EBITDA trend** — grouped bars, same $ axis (never dual-axis). Categorical slots
   1 & 2 (slate-navy, brass). *Answers: is growth converting to profit?*
2. **Margin trend** (EBITDA% / EBIT% / Net%) — 3-line chart, categorical slots 1–3, direct-labeled
   at line ends (3 series doesn't need a separate legend box). *Answers: is profitability improving
   or eroding?*
3. **FCF trend** — single-series bar chart crossing a zero baseline (FCF can be negative), one hue.
   *Answers: is cash generation strong, weak, or volatile?*
4. **Historical vs. Forecast** — same chart as #1, extended to 10 years, hairline seam at the
   boundary; forecast bars/line render at reduced opacity (same hue, less committed) rather than a
   different color — value identity stays constant, certainty is the secondary encoding. *Answers:
   how aggressive is the forecast relative to real history?*
5. **EV → Equity Value waterfall** — floating bars: Enterprise Value → (− Net Debt) → Equity Value,
   with Implied Share Price called out as an adjacent derived stat, not a bar (division isn't a
   waterfall step). *Answers: how do we get from enterprise value to a share price?*
6. **Bull / Base / Bear comparison** — 3 bars using the diverging pair + neutral (brick / slate /
   sage), direct-labeled with each implied price. This is the one chart where the diverging pair is
   the *correct* choice, not a trading-app cliché — the poles are literally negative/neutral/
   positive. *Answers: how much does the operating story move the answer?*
7. **Sensitivity heatmap** — WACC rows × terminal-growth columns, **diverging around the Base
   case** (below/at/above), Base-case cell ringed. Blocked cells (growth ≥ WACC) render as a
   hatched "—" cell, never blank (blank could misread as zero). *Answers: how much does the answer
   move if WACC or growth were slightly different?*
8. **Football-field valuation range** — the signature range-bracket made literal: one horizontal
   bar for DCF Bear–Bull, one for Comps-implied range, a vertical dashed marker for current price
   crossing both, Base case ticked within the DCF bar. Generous row spacing, numeric labels at each
   bar's ends (not position-only). *Answers: where does today's price sit against two independent
   estimates?*

## 6. AI Analyst UI

Not a floating chat bubble — a full `/analyst` tab, styled like an analyst's annotated margin notes,
not a messenger app: flat message blocks, "You" / "Analyst" set in small-caps mono rather than
avatar icons.

- **Clear separation of calculated state vs. explanation** (the explicit design requirement): any
  number the AI cites renders as an inline **chip** pulled from the actual model state — e.g. a
  small bordered `WACC: 8.4%` token — never typed as plain prose text. Plain prose is the AI's
  words; chips are the engine's facts. This is the literal UI expression of PRD FR-51.
- A collapsible right-rail panel lists the model-state fields referenced in the current answer,
  each clickable to jump to its source tab.
- When the AI calls `recalculateValuation`, a small inline status chip appears before the answer
  streams — e.g. `Recalculating with revenue growth = 8%…` (mono, subtle) — so the deterministic
  tool call is visible, not hidden inference.
- **Suggested questions** (shown only on an empty thread, drawn from Research §13, not generic
  chatbot prompts): *"Why is this sensitive to WACC?"* · *"What's driving Bear vs. Base?"* ·
  *"Explain this DCF simply."* · *"What's the biggest risk to this valuation?"*
- Voice: calm, precise, sentence case, no exclamation points or emoji — an analyst's tone, not an
  assistant's.

## 7. Visual System

- **Spacing/grid**: 8px base unit; 12-column grid, ~1240px content max-width, generous margins;
  single-column stacking below tablet.
- **Cards**: flat, 1px hairline border, 4–6px radius (not shadow-heavy, not bubble-rounded), sized
  to content — no oversized empty cards padded out to look substantial.
- **Tables**: real `<table>` markup, hairline row dividers (no zebra striping — adds noise),
  tabular-nums, right-aligned numeric columns, sticky header on scroll.
- **Inputs**: hairline-bordered, always-visible labels (never placeholder-as-label), 2px offset
  brass focus ring; mandatory assumptions pair a slider with a synced numeric field.
- **Tabs**: left sidebar rail (§3), active state = left accent bar, never a filled pill.
- **States**: loading uses the range-bracket-narrowing motif; errors use ink/slate with a small
  icon, reserving amber/red only for genuine blocking states (e.g. WACC ≤ g) — never for routine
  empty states.
- **Motion**: two deliberate moments (hero text, CTA hover) at 150–300ms with an expo-out easing;
  everything else (tab switches, disclosures, chart updates) gets brief functional transitions
  (150–200ms). No scroll-jacking, no parallax, no decorative background motion.
- **Icons**: lucide-react, functional only (nav, status, disclosure chevrons) — never decorative,
  never doubled up with a label that already says the same thing.
- **Dark mode**: explicitly V1.5/opportunistic (Research §21), not designed in depth here. If
  added: invert to a deep ink surface (not pure black), preserve the same hue relationships, and
  re-validate the chart palette against the dark surface separately — never an automatic filter-
  invert of the light palette.

## 8. Responsive + Accessibility

- **Desktop**: sidebar + multi-column content, all 8 charts at full form.
- **Tablet**: sidebar collapses to an icon rail (expandable), charts single-column.
- **Mobile**: bottom-sheet nav, sticky Fair Value footer, tables become horizontally scrollable
  (not card-per-row, which would break tabular alignment); the sensitivity heatmap scrolls
  horizontally with a sticky WACC-row label column; the football-field chart keeps its horizontal
  form with horizontal scroll rather than compressing into illegibility.
- **Keyboard**: full tab order through search, sidebar, forms, and every chart mark — each bar/
  cell/point is focusable and reveals the same tooltip content on focus as on hover (a chart's data
  has no mouse-only path). Visible focus ring everywhere, consistent styling.
- **Contrast**: Ink-on-Paper and all chart-vs-surface pairs must clear WCAG (4.5:1 text, 3:1
  non-text) — verify concretely once final hexes are validated (§1).
- **Reduced motion**: hero sequence and CTA hover degrade to instant/opacity-only per §2; loading
  bracket-narrowing becomes a static end-state.
- **Chart accessibility**: every chart ships a "view as table" toggle exposing the same data as a
  real `<table>`; status/range information (Bear/Base/Bull, sensitivity cells, football-field bars)
  never relies on color alone — always paired with a label, position, or the hatched-texture
  treatment for blocked cells.
