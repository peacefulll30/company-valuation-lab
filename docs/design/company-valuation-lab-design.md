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

## 2. Landing / Intro — V1.1 Cinematic Marketing Shell

**Scope of this section, stated explicitly (the "stated reason" §7's motion rule requires for any
animation beyond hero+CTA):** the treatment below originally applied **only** to `/` (Landing) and
the `/valuation` company-selection/search-entry screen — the discovery funnel a visitor sees before
they've committed to a company — and explicitly excluded `/valuation/[companySlug]/*` (the actual
workspace). **V1.2 supersedes that exclusion**: the workspace now carries the same dark,
near-black visual identity too (see §3's rewrite below) — this was a deliberate, separately
considered decision at that point, not a quiet drift, and it's the reason §3 below no longer
describes a Paper/Ink workspace. The marketing shell's motion vocabulary (hero+CTA only, "no
animation without a stated reason") still governs `/` and `/valuation`; the workspace's own motion
is scoped separately in §3.x and §7.

**Palette**: this shell activates the `.dark` tokens already defined and validated in `app/
globals.css` (§7's "if added: invert to a deep ink surface, not pure black, preserve the same hue
relationships" — already done, not a new palette). Background `#14171F` (ink, not pure black),
card surfaces a touch lighter (`#1B1F2A`), the same single brass accent family (`#C99A4E` in this
mode) used exactly as restrictively as in light mode — the primary CTA and one "answer" moment per
screen, never a decorative wash. The validated dark chart palette (`--chart-1..5`, comment in
`globals.css`) is unchanged and unused here (no charts on the marketing shell).

**No glassmorphism, still.** "Premium dark" is achieved with: a single soft, low-opacity radial
brass glow anchored behind the hero headline (an ambient light source, not a panel treatment),
fine hairlines that catch it, and restrained grain/texture — never a frosted, translucent
`backdrop-blur` card. The §1 "no gradients/glassmorphism" rule holds; what changes is the surface
color, not the material language.

**Signature motif carries over, doesn't get replaced.** The range-bracket (`⊢────⊣`) and "range
resolving to a value" idea from §1 *is* the ambient hero motion — ticks, thin glowing line
fragments, and value fragments (a price, a percentage) drifting and fading at low opacity — not a
generic particle/starfield effect. This is why it doesn't read as "crypto dashboard": it's the
product's own existing device, not a bolted-on decoration.

**Hero** — dominant first screen, large Fraunces type, generous vertical space:

- Eyebrow (small, mono, tracked out): `DCF · WACC · SCENARIOS · SENSITIVITY · AI ANALYST`
- Headline (Fraunces, staggered word-group reveal — unchanged from the original approved
  reference): *"What is this company actually worth — and how confident should you be?"*
- Sub-headline (Inter, fades in after headline settles) — unchanged copy.
- Ambient background motion (the one addition beyond the original approved hero): slow, low-
  opacity drifting bracket-ticks and value fragments, GPU-cheap (transform/opacity only),
  `prefers-reduced-motion` collapses it to a static, single frame.
- Primary CTA — same InteractiveHoverButton contract as before (label "Start Valuation", brass
  sweep on hover), re-skinned for the dark surface (ink label on brass, not paper on ink).

**"What can this platform do?"** — the same 4 capabilities (Historical Analysis, Forecasting,
DCF + Scenarios + Sensitivity, AI Analyst), now a scroll-driven progressive reveal instead of a
static grid: one capability dominant at a time as the user scrolls, neighbors visible but
receded (scale/opacity, not hidden), each paired with one plain-language sentence of what that
concept means (reusing `lib/concepts.ts`, the same source the in-workspace "What is this?"
popovers draw from — one explanation, not two that can drift). Mobile: the sticky-scroll mechanism
is replaced with a simple stacked fade-in-on-view sequence — no sticky pinning, no scroll-jacking.

**"How the valuation is built"** — the same 4-step methodology rail (Historicals → Forecast → DCF
→ Scenarios/Sensitivity), same progressive-reveal treatment as above, framed as a guided process
rather than a static table. Sourcing line and disclaimer persist beneath, unchanged in wording.

**Featured Companies** — all 10, immediately visible (not a 6-of-10 preview slice), each card a
ticker + name + a small branded monogram (a letterform in a brand-recognizable hue, not a
reproduced third-party logo asset — see implementation note below) with a tasteful hover lift.
Clicking one skips search and opens that company's Overview directly, unchanged.

**Final CTA** — a full, cinematic closing section ("Ready to value a company?" / "Start
Valuation"), same InteractiveHoverButton contract, larger scale. Activating it plays a short
(≤900ms), reduced-motion-aware transition — a brief "Enjoy the analysis." beat — before routing to
`/valuation`. Never a substitute for the real loading state if data isn't ready yet; purely a
felt-quality moment on top of an already-fast navigation.

**Company monogram note**: real third-party brand logos are not embedded as reproduced artwork —
no verified, reliable, appropriately-licensed local asset exists for all 10, and a hotlinked
external logo CDN is both a reliability risk (broken images) and unnecessary trademark exposure
for a decorative touch. Clean, original monograms (ticker-derived letterform, brand-adjacent hue)
satisfy "recognizable" without either risk, and are the documented fallback this spec itself calls
for.

**Educational layer**: `lib/concepts.ts` holds one short, human explanation per core term
(Historicals, Forecast, DCF, WACC, Scenarios, Sensitivity, Trading Comps, AI Analyst). The landing
scroll-story sections surface the 4 that map to Methodology's steps; the in-workspace `ConceptInfo`
popover (a small inline "What is this?" trigger next to the relevant heading — Historicals,
Forecast, DCF, WACC, Scenarios, Sensitivity, Trading Comps, AI Analyst tabs) surfaces all 8 in
context, on demand, never auto-opened. This is explanation, not a course: one short paragraph per
concept, never more.

**V1.2**: every one of the 9 workspace sections now opens with a 1–2 sentence "what is this page
about" line beneath its heading (7 already had one in practice; Overview and Valuation Summary
gained theirs in this pass) — plain-language orientation for someone learning valuation, distinct
from `ConceptInfo`'s on-demand term definitions.

## 3. App Shell (V1.2: dark, one continuous scroll journey)

**Top bar**: wordmark (`Company Valuation Lab`, Inter medium, "Lab" set in Fraunces italic as the
one distinguishing touch, now carrying a restrained periodic brass shimmer — CSS-only, a few
seconds of sweep inside a long, mostly-idle cycle, never a continuous loop) + a persistent,
prominent search input (not an icon-triggered overlay — search is core V1, not secondary) + a
"Featured" quick-access affordance.

**Inside a company's flow** (`/valuation/[companySlug]/*`): the near-black, graphite-surface
treatment from §2 now applies here too (V1.2), not just the marketing shell — every workspace
component already read exclusively from semantic tokens, so this was a one-line `.dark` wrapper in
the route's `layout.tsx`, not a component-by-component rewrite. Charts, tables, and cards keep
every rule below unchanged; only the surface colors moved.

The 9 addressable sections (§Architecture 2) are no longer 9 separate page loads. They're
composited into **one continuous, scrollable page** — Overview through AI Analyst, in order — so
the product reads as a single guided valuation story rather than a tab-click grind. Each section
keeps its own URL (`/valuation/[companySlug]/overview`, `…/dcf`, etc.): landing on one scrolls the
page there instantly on load, and the URL keeps updating (without a page navigation) as the user
scrolls past each section, so every step stays a real, shareable, addressable link — "9 addressable
tabs" is satisfied by 9 addressable *scroll positions* in one document, not 9 separate documents.

The **left sidebar rail** (a research-terminal rail, not a top tab strip) tracks scroll position
directly (an `IntersectionObserver` watching a thin band near the top of the viewport), not a route
match. Each row: mono step numeral (01–09) + label, in one of three states — **active** (brass left
indicator, full-brightness label, a Framer `layout`-animated indicator that glides between rows
rather than jumping), **passed** (subdued but still legible), **upcoming** (lowest emphasis). A
click smooth-scrolls to that section (`scrollIntoView`, never a hijacked/intercepted scroll) —
clicking and natural scrolling both work, and neither fights the other. Numbering is justified
here — this is a real guided sequence, even though every step is also independently reachable.

**Persistent company context header**, visible above the whole scrolling page: ticker, name, tier
badge (`Featured` / a subtle `Searched` label), current price with its as-of tag, and — once
computed — a small **persistent "Fair Value" stat** pinned in the sidebar footer, updating live as
assumptions change. This is the one number the whole product exists to produce; it stays visible
while the user scrolls through every section, per finance-product-builder's visual-hierarchy rule.

**Mobile**: sidebar collapses to a bottom sheet triggered from a compact top bar; the persistent
Fair Value stat moves to a slim sticky footer bar instead of a sidebar footer. The continuous-scroll
page works identically on mobile — it's simply a normal scrolling page there too, with no sticky
pinning to manage.

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
- **Dark mode**: still V1.5/opportunistic for the in-app workspace itself (Research §21) — Paper/
  Ink stays the default and only theme for `/valuation/[companySlug]/*`. It is live, deliberately,
  for the marketing shell only (§2): a deep ink surface, not pure black, same hue relationships,
  chart palette already re-validated against it (comment in `app/globals.css`). No workspace
  theme toggle exists or is implied by this.

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
