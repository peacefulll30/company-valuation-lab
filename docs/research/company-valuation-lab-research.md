# Company Valuation Lab — Research

## 1. Executive Recommendation

Build Company Valuation Lab on a **deterministic valuation engine with a full AI Analyst as a
first-class V1 feature**, not an optional add-on. The product's credibility rests entirely on
whether its DCF, WACC, and comps math is correct; the AI Analyst is only as trustworthy as the
numbers it narrates, so the non-negotiable constraint is architectural, not sequencing: all
valuation math stays in the deterministic engine, and the AI layer only explains, interprets, and
can trigger recalculation through controlled function calls — it never computes independently.

V1 should cover a **curated set of 8–12 real public companies** (data sourced once from SEC EDGAR,
verified, and shipped as a static dataset — not a live "search any ticker" engine), a full
historical → forecast → DCF → scenarios → sensitivity → comps → valuation-summary flow with a clear
mandatory/advanced split, and a full AI Analyst — chat UI included — grounded entirely in that
deterministic state; see §15 for the architecture. Financial institutions (banks, insurers) are
explicitly excluded from V1 — they need a different valuation model (DDM / excess-return), and
forcing them into a DCF/EBITDA framework would be the kind of financial incorrectness this project
cannot afford.

The single biggest risk to this project is scope creep toward "support every company, live" before
the core model is trustworthy. The recommendations below are written to prevent that.

## 2. Product Purpose

Company Valuation Lab is a **valuation reasoning tool**, not a stock screener and not a robo-advisor.
It takes a real company's historical financials, walks the user through building a forecast and a
DCF, and shows how the resulting fair-value estimate depends on the assumptions fed into it —
then lets an AI Analyst explain *why* the model produced what it produced.

The product's core message is methodological transparency: every number on screen should be
traceable to an assumption or a filing, and the platform should never assert a single "true" value
for a company — only a range, conditioned on stated assumptions.

## 3. Target User

Two audiences exist, but they must be resolved into **one design target**: the primary user this
product is built for is **a finance hiring evaluator (IB/ER/AM/PE recruiter or interviewer) who
opens the tool to assess the builder's technical and financial judgment**, typically in a 5–10
minute unguided session. The secondary user is **someone actually performing valuation work**
(the builder themselves, in an interview walkthrough, or a self-directed learner).

These two audiences don't conflict as long as the tool is honest: it cannot be a Potemkin village
that looks rigorous but doesn't hold up to real use. Design for the evaluator's fast comprehension
(clear IA, restrained UI, obvious "here's the answer and here's why") while keeping the underlying
math correct enough that it would survive an actual analyst using it. Optimizing for looking
credible *without* being correct is the one failure mode this project cannot recover from.

## 4. Core User Journey

1. Landing (what is this / what can it do)
2. Start Valuation
3. Company Selection (curated list, not free search)
4. Company Overview (sector, snapshot, current price)
5. Historical Financials (auto-populated, 5 years)
6. Forecast (mandatory assumptions visible, advanced collapsed)
7. DCF (UFCF build, both terminal value methods)
8. Scenarios (Bear / Base / Bull)
9. Sensitivity (WACC × terminal growth heatmap)
10. Trading Comps (limited peer panel)
11. Valuation Summary (football-field range vs current price)
12. AI Analyst (chat grounded entirely in the above state — see §15)

This is close to the hypothesis in the brief, with two adjustments: a **Company Overview** step is
inserted right after selection (sector, market cap, current price — orients the user before the
numbers start), and **Trading Comps** sits explicitly between Sensitivity and the Summary so its
output (an implied range) can feed the football-field chart rather than living as an orphaned tab.

The steps should be both a **guided flow** (stepper, for first-time/demo use) and **independently
addressable tabs** once a company is loaded, so an evaluator can jump straight to Sensitivity or
the Summary without walking the whole funnel. See §18.

## 5. Recommended V1 Scope

**Ship in V1:**
- Landing/explainer page (methodology-forward, not a form)
- Company selection from a curated 8–12 company list
- Company Overview snapshot
- Historical financials (5 years) with derived metrics (margins, growth, leverage)
- Forecast builder: mandatory assumptions visible by default, advanced panel collapsed
- Full DCF: UFCF bridge, WACC estimator (component-based, editable), **both** terminal value
  methods (perpetuity growth as primary, exit multiple as cross-check)
- Bear/Base/Bull scenario analysis on operating assumptions (not on WACC — see §11)
- WACC × terminal-growth sensitivity heatmap
- Limited trading comps module (curated peer sets, EV/EBITDA, EV/Revenue, P/E)
- Valuation Summary: football-field chart (DCF range + comps range + current price), no bare
  "Undervalued/Overvalued" verdict
- AI Analyst, **chat UI included, as full V1 scope**: deterministic engine computes everything;
  the AI layer only explains/interprets that state and can trigger recalculation via controlled
  function calls, never computing independently — see §15

**Defer past V1 (see §6 for the full list and reasoning).**

## 6. Features Explicitly Deferred

| Feature | Why deferred |
|---|---|
| Full "search any public company" support | Requires handling every sector's accounting quirks (banks, insurers, REITs, foreign filers) correctly — the fastest way to ship a financially wrong tool. Curated set first; expand once the model is proven correct on 8–12 companies. |
| Banks / insurers / financial institutions | DCF/EBITDA framework doesn't apply — they need DDM or excess-return models. A V2 addition, not a V1 corner case. |
| Automated peer-selection algorithm for comps | A research problem on its own. V1 uses hand-curated peer sets (3–5 real peers per company). |
| Real-time/streaming market prices | Not the value proposition here; a periodically-refreshed static price is sufficient and far simpler. |
| User accounts, saved sessions, multi-user state | Adds auth/infra complexity with no valuation-credibility payoff. |
| PDF/report export | Genuinely nice for a portfolio piece, but a V2 polish item, not core. |
| Multi-currency/FX-adjusted modelling | Only matters once non-USD-reporting companies are in scope; curated V1 list can avoid this. |
| Backtesting valuation accuracy over time | Interesting but orthogonal to demonstrating valuation competence; V2 at earliest. |

## 7. Historical Financial Analysis

**5 years of historical data** — enough to compute CAGR and see a trend without turning data entry
into its own project.

**Required line items:**
- Income statement: Revenue, EBIT, D&A, effective tax rate, Net Income
- Balance sheet: Cash & equivalents, Total Debt, Diluted Shares Outstanding
- Cash flow: Operating Cash Flow, CapEx, ΔNet Working Capital, Free Cash Flow

**EBITDA is derived, not sourced.** EBITDA is a non-GAAP measure — it is not a standardized
SEC/XBRL line item, and companies vary in what they exclude from it (stock comp, restructuring,
etc.), so trusting a raw "EBITDA" tag or press-release figure across companies would silently bake
in inconsistency. V1 computes **EBITDA = EBIT + D&A** from the standardized, XBRL-tagged inputs
(`OperatingIncomeLoss` for EBIT, D&A from the cash flow statement) for every curated company. Where
a company also discloses its own adjusted EBITDA, it's shown as a labeled cross-check, never
silently substituted for the derived figure. Each curated company's data file documents exactly
which filing line or XBRL tag was mapped to each model input, and its as-of date.

**Deliberately excluded:** a full COGS breakdown — EBIT is sourced directly from the standardized
operating-income tag, so a granular COGS line adds data-entry and display surface without
proportional analytical value for a DCF-focused tool. Cut it.

**Derived analytical metrics** (all computed, never re-entered): revenue growth %, EBITDA margin,
EBIT margin, net margin, FCF and FCF margin, Net Debt/EBITDA (leverage), FCF conversion
(FCF/EBITDA). This set gives growth, profitability, cash generation, and leverage — the four
lenses an equity/credit analyst actually uses — without padding the screen with metrics that exist
just because they can be computed.

## 8. Forecast Methodology

**5 historical years → 5 forecast years.** Five is the standard mid-cap DCF horizon: long enough
to reach a defensible "steady state" for the terminal value, short enough that forecast assumptions
don't become pure fiction.

**Mandatory assumptions** (visible by default, beginner-safe):
- Revenue growth rate (single rate or simple fade toward terminal growth)
- EBITDA margin (target/path)
- Tax rate
- WACC
- Terminal growth rate

**Advanced assumptions** (collapsed by default, for users who understand what they're changing):
- D&A as % of revenue
- CapEx as % of revenue
- Net working capital as % of revenue (or ΔNWC directly)
- Margin evolution/trajectory (ramp or fade rather than flat)
- WACC component overrides (risk-free rate, beta, ERP, pre-tax cost of debt)
- Exit-multiple terminal value inputs
- Mid-year discounting convention toggle (see §9)

This mirrors the finance-product-builder discipline of progressive disclosure: a beginner can
produce a credible valuation touching five sliders; an advanced user can override every lever that
actually matters.

## 9. DCF Methodology

Verified against Damodaran's FCFF framework (NYU Stern) and standard IB practice (Wall Street
Prep, CFI). The bridge:

1. Revenue × EBITDA margin = EBITDA
2. EBITDA − D&A = EBIT
3. EBIT × (1 − tax rate) = NOPAT
4. NOPAT + D&A − CapEx − ΔNWC = Unlevered Free Cash Flow (UFCF)

**UFCF = NOPAT + D&A − CapEx − ΔNWC.** This is the formula to implement everywhere UFCF is
computed or displayed in the product — use this exact form, not an unexpanded `EBIT × (1−t)`
restatement, so the NOPAT line item stays visible and auditable in the model.

UFCF is discounted at WACC (it's the cash flow available to *all* capital providers — debt and
equity — which is exactly why WACC, not cost of equity, is the correct discount rate).

**Terminal value: use both methods, not one.** Research confirms this is standard IB practice, not
theoretical overkill — the exit-multiple method is what's actually presented to clients/committees
(anchored to observable market multiples, easier to explain), while the perpetuity-growth method
(`TV = UFCFₙ₊₁ / (WACC − g)`) is used as a cross-check. If the two diverge significantly, that's a
signal the assumptions need scrutiny — which is itself a valuable thing to show in the product
("these two methods imply different things — here's why"). This is a case where including *both*
is lower complexity than it looks (two formulas, one shared discounting step) and meaningfully
raises both correctness and CV value versus picking one.

**Discounting:** end-of-year periods as the mandatory default (simpler to explain); mid-year
convention as an advanced toggle (standard practice in real models, small formula change — shift
the discount exponent by 0.5 — worth exposing to advanced users but not forcing on beginners).

**EV → Equity Value bridge:**
1. PV(UFCF, years 1–5) + PV(Terminal Value) = Enterprise Value
2. Enterprise Value − Net Debt (Total Debt − Cash) = Equity Value
3. Equity Value ÷ Diluted Shares Outstanding = Implied Share Price

Minority interest / preferred stock adjustments are skipped in V1 as a stated simplification —
manageable by choosing curated companies where these aren't material, and flagged as a V2 item if
a future company needs it.

## 10. WACC Methodology

Three options were evaluated:
- **A — manual WACC entry only:** low learning value, doesn't demonstrate understanding, fails the
  "demonstrate financial modelling competence" goal of the whole project.
- **B — simple flat estimator:** better, but hides the component reasoning that's actually the
  point of showing WACC at all.
- **C — full component model, all fields required upfront:** high learning/CV value but poor UX
  for a beginner facing 6 unfamiliar inputs before seeing any output.

**Recommendation: C, but progressively disclosed.** Show a single WACC number as the mandatory
input with sensible pre-filled defaults (risk-free rate from a documented current treasury yield,
equity risk premium from Damodaran's published ERP dataset, beta from the company's actual levered
beta, pre-tax cost of debt estimated from interest expense/debt or a credit-spread table, tax rate
from the model). An "advanced" expandable panel shows the full build — Cost of Equity (CAPM), Cost
of Debt, capital-structure weights — every field editable. This gets the learning value of the full
model without forcing a beginner through it before they see a result. Every one of these pre-filled
defaults carries a visible source and as-of date (see §16) — none are presented as live.

## 11. Scenario Analysis

For V1, Bear/Base/Bull should vary **operating assumptions** while holding WACC constant. This
isn't a universal finance rule — WACC can legitimately shift with a scenario in more advanced
modelling (e.g., a distressed Bear case with higher leverage would raise cost of debt and cost of
equity). It's a V1 design choice: keeping WACC fixed isolates the effect of business performance
from the effect of the discount rate, keeps scenario analysis and sensitivity analysis (§12)
conceptually distinct for the user, and can be relaxed later without changing the architecture.

Levers that vary across scenarios (kept to 3–4 for understandability):
- Revenue growth rate (e.g., base ± 1.5–2.5pp depending on company)
- EBITDA margin trajectory (contraction / stable / expansion)
- Terminal growth rate (small ± adjustment, bounded well below WACC in all cases — see §19)
- Optionally CapEx intensity, only where it's a genuine sensitivity for that company

V1 keeps WACC constant across all three scenarios so the operating-assumption changes are cleanly
isolated — not a claim that WACC is scenario-independent in general.

## 12. Sensitivity Analysis

**WACC × Terminal Growth Rate → implied share price**, the canonical DCF sensitivity table.

- Matrix size: 5×5 or 7×5 (WACC rows × growth columns is fine either orientation; keep it small
  enough to read at a glance, large enough to show a real gradient)
- WACC steps: ±2pp from base case, 0.5pp increments
- Terminal growth steps: ±1pp from base case, 0.25–0.5pp increments, **hard-capped below WACC** in
  every cell (a growth rate at or above WACC breaks the perpetuity formula — see §19)
- Communicate imprecision explicitly: color gradient across the grid plus a caption stating this is
  a model output under stated assumptions, not a price target. Never let the heatmap imply
  false precision on its own.

**Scenario analysis and sensitivity analysis must be visually and conceptually distinct** in the
UI — different sections, different framing copy — precisely because they answer different
questions ("what if the business does worse/better" vs. "how sensitive is the valuation to the
discount rate and growth assumption").

## 13. Trading Comps Recommendation

**B — a limited V1 module**, not full V1 scope, not deferred to V2.

Multiples: **EV/EBITDA and EV/Revenue** (enterprise-value multiples, capital-structure neutral —
the right choice for comparing companies with different leverage) as primary, **P/E** as a
secondary cross-check (equity-value multiple, useful but distorted by capital structure and
one-off items).

Peer sets are **hand-curated per company** (3–5 real, named peers) rather than algorithmically
selected — automated peer selection is a genuinely hard problem and out of scope. Comps produce
their own implied valuation range, shown **alongside** the DCF range in the Valuation Summary, not
blended into a single number — the two methodologies should stay visibly separate so the user can
see where they agree or disagree.

## 14. Valuation Summary

Reject a bare "Undervalued / Fairly Valued / Overvalued" label — it presents a model output as
objective truth, which is precisely the false-certainty trap this research is meant to avoid.

**Recommended output: a football-field-style range chart** — current market price plotted against
the DCF bear-to-bull range and the comps-implied range, on one shared axis. Supporting language:
"Base case implies a fair value of $X, with a range of $Y–$Z depending on assumptions" and
"current price sits N% above/below the base-case estimate" — framed explicitly as *this model's*
estimate, conditioned on the assumptions the user chose, not a market call.

If a compact status label is wanted for scanability, use soft, assumption-anchored bands —
"Trading below model range," "within model range," "above model range" — always paired with the
underlying range, never standing alone.

## 15. AI Analyst Architecture

This is one of the product's most important differentiators and ships as a **full V1 feature,
chat UI included** — not something to descope unless explicitly decided later. What's
non-negotiable is the architecture, not the timing: the AI Analyst must **explain**, never
**calculate**. Concretely: the LLM receives a structured JSON snapshot of already-computed model
state (historicals, forecast assumptions, DCF outputs, scenario outputs, sensitivity grid, comps)
as context or via scoped tool calls — it never derives a financial number itself. This matches
current best practice for grounding LLMs in regulated/numerical domains: route all numerical
computation through a deterministic layer, let the model handle narration, comparison, and
explanation of numbers that layer already produced.

Concrete design points:
- **Deterministic layer computes; AI layer narrates.** No exceptions — if a user asks "what would
  fair value be at 8% growth," that's a recompute through the deterministic engine (potentially
  AI-triggered, but AI-executed-as-a-tool-call, not AI-guessed).
- Pass **scoped, structured state** (a typed "model state" object) rather than dumping the entire
  session as free text — cheaper, and removes the surface area for the model to "helpfully"
  interpolate a number that isn't actually in the passed context.
- If external context (news, qualitative commentary) is ever added, keep it **visibly separate**
  from computed model state — never blend an unverified external claim with a deterministically
  computed figure without a clear source label.
- **Build order within V1, not V1 vs. V1.5:** the deterministic engine must be correct before the
  AI layer is built against it, since the AI layer would otherwise just automate spreading wrong
  numbers with a confident voice attached — but that's a build-sequencing detail inside V1, not a
  reason to ship the chat UI later as a separate release. Keep the model-state contract stable
  early so the AI layer can be developed in parallel with the later valuation-engine steps (comps,
  scenarios) rather than serialized after everything else.

## 16. Financial Data Strategy

Evaluated: official filings (SEC EDGAR), commercial financial-data APIs (Financial Modeling Prep,
Alpha Vantage, Finnhub, and IEX Cloud successors), manual datasets, and hybrids.

**Recommendation: E — hybrid.** Use the **SEC EDGAR XBRL Company Facts API**
(`data.sec.gov/api/xbrl/companyfacts/{CIK}.json`) as the primary source — it's free, official,
requires no API key, and covers every US filer's structured financial data from 10-K/10-Q filings.
Use it as a **build-time/offline data pipeline**: fetch and manually verify each curated company's
financials once, normalize into a clean internal schema (deriving EBITDA = EBIT + D&A rather than
trusting a non-standardized raw tag — see §7), and ship that as a static dataset — not as a live
client-side fetch.

Why not live-fetch at runtime: (1) commercial APIs' free tiers are genuinely thin and shift often —
current research shows Alpha Vantage capped around 25 requests/day free, Financial Modeling Prep
around 250/day and explicitly **does not support CORS** (any browser-based use requires a backend
proxy anyway), and IEX Cloud — long the default recommendation — shut down entirely in August 2024,
which is itself the strongest argument against depending on a single live commercial API for a
project's core credibility; (2) a live dependency means the deployed demo can go dark or serve
inconsistent data exactly when a recruiter clicks through; (3) financial correctness is easier to
guarantee when each number has been manually checked against the source filing once, rather than
trusted to always-correct automated XBRL tag parsing across companies with different reporting
conventions.

Current market price (for the "vs. DCF" comparison) can be a periodically-refreshed static value
rather than real-time — precision-to-the-minute pricing isn't the value proposition here — but it
must always render with a visible "as of [date]" label. This applies to **every** externally
sourced number in the product, not just price: market price, risk-free rate, equity risk premium,
beta, credit spreads — nothing sourced externally is ever displayed without a source and an as-of
date, so stale data can't be mistaken for current.

**Coverage caveat that affects company selection:** SEC EDGAR only covers SEC filers. A foreign
private issuer like Ryanair files Form 20-F (annual only, no quarterly-equivalent cadence), which
means shallower/less-frequent data than a domestic 10-K/10-Q filer. Favor US-listed 10-K/10-Q
filers for the V1 list's data richness; treat ADR/20-F companies as a V1.5+/V2 stretch once the
pipeline is proven.

## 17. Visualisation Recommendations

Every chart below is justified by the question it answers; none are included for decoration.

| Chart | Question it answers | V1? |
|---|---|---|
| Revenue/EBITDA historical trend | Is the business growing, and how profitable is that growth? | Yes |
| Margins over time (EBITDA/EBIT/Net %) | Is profitability improving or deteriorating? | Yes |
| Free cash flow trend | Is cash generation strong or volatile? | Yes |
| Forecast vs. historical (revenue/EBITDA, visual break at present) | How aggressive is the forecast relative to actual history? | Yes — prevents hidden unrealistic assumptions |
| Valuation bridge / waterfall (EV → net debt → equity value → per-share) | How do we get from enterprise value to a share price? | Yes — classic IB chart, strong CV signal, moderate complexity |
| Bull/Base/Bear comparison | How much does the story change under different operating assumptions? | Yes |
| Sensitivity heatmap (WACC × terminal growth) | How sensitive is the valuation to the two hardest-to-pin-down inputs? | Yes — explicitly requested core feature |
| Football-field valuation range | Where does the current price sit vs. this model's estimates? | Yes — this *is* the Valuation Summary |

**Deliberately excluded:** a standalone "current price vs. implied" chart (folded into the
football-field chart instead — a second chart saying the same thing is redundant), any
candlestick/intraday price chart (pulls the aesthetic toward "trading app," which the brief
explicitly wants to avoid, and isn't analytically load-bearing for a valuation tool), and pie charts
for capital structure (a small bar/stat pairing communicates debt vs. equity weight better than a
pie ever does for two categories).

## 18. UX / Information Architecture

**Hybrid: guided stepper + addressable tabs.** First-time/demo use should feel like a directed flow
(Overview → Historicals → Forecast → DCF → Scenarios → Sensitivity → Comps → Summary → AI Analyst),
but once a company is loaded every step should be an independently reachable tab/section, so an
evaluator can jump straight to the Sensitivity or Summary view without walking the whole funnel
first. This is explicitly *not* one long scrolling calculator page — the brief is right to rule
that out; a professional finance workflow is segmented, not a single infinite form.

## 19. Mandatory vs. Advanced Inputs

| | Mandatory (beginner path) | Advanced (progressive disclosure) |
|---|---|---|
| Forecast | Revenue growth, EBITDA margin | D&A %, CapEx %, NWC %, margin trajectory/fade |
| Tax & discounting | Tax rate, WACC (single number, pre-filled) | Full WACC component build (risk-free rate, beta, ERP, cost of debt), mid-year convention toggle |
| Terminal value | Terminal growth rate (perpetuity method) | Exit multiple override, cross-check toggle |
| Scenarios | Pre-set Bear/Base/Bull | Custom scenario editing |
| Comps | Shown as-is | Peer set adjustment (if time allows) |

Design goal: a beginner touches five inputs and gets a credible valuation; an advanced user can
override every lever that meaningfully changes the answer.

## 20. Edge Cases

- **Negative EBITDA / negative UFCF:** must render and be explained, not hidden or defaulted to
  zero — common for early-stage or cyclically depressed companies; avoid this by favoring
  profitable, stable operating companies for the V1 curated list, but the *engine* must handle it
  gracefully if a user pushes assumptions negative.
- **WACC ≤ terminal growth rate:** the perpetuity-growth formula breaks down (division by a
  non-positive number, or an unbounded/negative terminal value). This must be a **hard validation
  guard**, not a silent bad number — block the input or clamp it, with an explicit message, both in
  the assumption input and in every cell of the sensitivity grid.
- **Net cash position** (cash > debt): Net Debt goes negative, so Equity Value > Enterprise Value —
  correct and should be clearly labeled, not treated as an error state.
- **Zero/negative growth mature companies:** valid, should be supported without the UI implying
  something is broken.
- **Financial institutions (banks, insurers):** EBITDA and standard UFCF aren't meaningful for
  them (interest income/expense is operating, not financing) — excluded from V1 company selection
  entirely rather than forced into an ill-fitting model. This is a scope decision, not a bug to
  patch later.
- **Missing/incomplete filing data:** show an explicit "data not available" state — never silently
  default a missing field to zero, which would quietly corrupt every downstream calculation.
- **Abnormal one-off years** (e.g., a COVID-depressed base year): don't let the forecast naively
  extrapolate growth from an outlier base year — use a multi-year average or let the user
  explicitly override the base-year growth assumption.
- **Zero/invalid shares outstanding:** can't occur in a curated, verified dataset, but the engine
  should still validate before dividing (defensive correctness, not defensive UX).
- **Foreign private issuers (20-F filers):** shallower filing cadence than domestic 10-K/10-Q
  filers — factor into which companies go in the V1 curated list (see §16).

**Which company types V1 should support:** standard operating companies (technology, consumer,
industrials, airlines-as-industrials) with straightforward GAAP/IFRS accounting and clean
EBITDA-based economics. Banks, insurers, and other financial institutions are explicitly a V2+
undertaking requiring a different valuation model (DDM / excess-return), not a corner case to
shoehorn into V1's DCF engine.

## 21. CV / Finance Value Matrix

**High value / low-medium complexity → V1 core:**
Historical trend + margin analysis, 5-year forecast with mandatory assumptions, core DCF (both
terminal value methods), component-based WACC estimator, Bear/Base/Bull scenarios on operating
assumptions, WACC × growth sensitivity heatmap, valuation summary/football-field, landing/explainer
page.

**High value / high complexity → evaluate carefully, sequence deliberately:**
AI Analyst grounded in model state (high differentiator, real engineering + prompt-safety work —
full V1 scope including chat UI; deterministic grounding is mandatory, not optional); limited
trading comps module (data curation work, worth doing but bounded — hand-curated peers, not a
screener); the SEC-EDGAR-based data pipeline itself (one-time build effort, high credibility
payoff, done as offline tooling rather than a runtime dependency).

**Low value / high complexity → exclude from V1:**
Full any-ticker live support across every sector including financial institutions; real-time/
streaming market data; user accounts and multi-user saved state; automated peer-selection
algorithm; PDF/report export; backtesting valuation accuracy over time; multi-currency/FX handling
across arbitrary geographies.

**Low value / low complexity → opportunistic, not core:**
Light/dark theme, print-friendly summary view, shareable read-only snapshot link.

## 22. Risks and Trade-offs

- **A curated/static dataset can look less impressive than "search any ticker."** Mitigate by
  making the SEC-EDGAR-based data pipeline visible and documented in-product (e.g., "Financials as
  of FY2025 10-K, filed [date], sourced from SEC EDGAR") — this turns a scope limitation into a
  credibility signal ("built on primary regulatory data, verified by hand") rather than hiding it.
- **Building a full AI Analyst inside V1 alongside the valuation engine is real, non-trivial scope.**
  Mitigate by keeping the model-state contract stable early so the AI layer can be developed in
  parallel with later engine steps (comps, scenarios) rather than serialized after everything else
  — and by keeping the grounding contract (deterministic-compute, AI-narrate) simple enough that it
  doesn't become its own source of bugs.
- **Excluding banks/financial institutions may feel like a gap for FIG-track recruiting.** Accepted
  trade-off — a correct DCF-based tool for operating companies has more credibility than an
  incorrect one stretched to cover banks. Flagged explicitly as a V2 direction, not silently
  dropped.
- **Two terminal value methods add UI surface.** Mitigated by progressive disclosure: perpetuity
  growth as the default/mandatory view, exit multiple as a collapsible cross-check panel.
- **Static data vs. freshness.** Accepting a quarterly/manual refresh cadence in exchange for
  reliability and correctness is the right trade for this product — document the cadence
  transparently rather than implying live data.

## 23. Recommended V1 Product Definition

A polished landing/methodology page → 8–12 curated, verified companies (standard operating
companies only) → per-company flow covering Overview, 5-year Historicals with derived metrics,
5-year Forecast (mandatory + advanced assumptions), full DCF (UFCF bridge, component-based WACC,
both terminal value methods), Bear/Base/Bull scenarios on operating assumptions, a WACC × terminal
growth sensitivity heatmap, a limited hand-curated trading comps module, and a Valuation Summary
presented as a football-field range against current price — explicitly avoiding a bare
"Undervalued/Overvalued" verdict. A full AI Analyst, chat UI included, ships as part of V1: the
deterministic engine performs all valuation math, and the AI layer explains and interprets that
state, triggering recalculation only through controlled function calls.

## 24. Open Questions Requiring Product Decision

1. **Final V1 company list.** A default of 8–12 US-listed, 10-K/10-Q-filing operating companies is
   recommended (e.g., across tech, consumer, industrials) — needs your confirmation/adjustment,
   especially if a specific target industry (e.g., FIG) should influence inclusion even as a V1.5
   stretch case.
2. **Advanced WACC depth.** Recommended as fully component-editable but bounded to the six standard
   CAPM/cost-of-debt inputs — confirm this is the right ceiling versus something simpler.
3. **Market price freshness.** Recommended as periodically-refreshed static data (always shown with
   a source and as-of date) rather than live — confirm this is acceptable for the "current price
   vs. model" comparison.
4. **Landing page tone/copy** ("Start Valuation" vs. "Enter the Lab" vs. other) — a copywriting
   decision deliberately left open, not a research question.
5. **Tech stack / hosting** — explicitly out of scope for this research document; will need to be
   decided once product direction is confirmed and before architecture begins.

## 25. Sources

- [SEC.gov — EDGAR Application Programming Interfaces](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC EDGAR XBRL Company Facts API documentation](https://apis.io/apis/sec-edgar/sec-edgar-xbrl-api/)
- [Aswath Damodaran — The Free Cashflow to Firm Model (NYU Stern)](https://pages.stern.nyu.edu/~adamodar/pdfiles/eqnotes/fcff.pdf)
- [Aswath Damodaran — Discounted Cash Flow Valuation (NYU Stern)](https://pages.stern.nyu.edu/~adamodar/pdfiles/eqnotes/dcfallOld.pdf)
- [Wall Street Prep — Terminal Value (DCF) Formula + Calculator](https://www.wallstreetprep.com/knowledge/terminal-value/)
- [Corporate Finance Institute — Exit Multiple](https://corporatefinanceinstitute.com/resources/valuation/exit-multiple/)
- [Macabacus — DCF Terminal Value](https://macabacus.com/valuation/dcf-terminal-value)
- [Financial Modeling Prep — Pricing Plans](https://site.financialmodelingprep.com/pricing-plans)
- [Find My Moat — FMP API Review: Pricing, Free Tier & Limits (2026)](https://www.findmymoat.com/tools/financial-modeling-prep-fmp)
- [IEX Cloud API Service Closure and Alternatives](https://iexcloud.org/)
- [Alpha Vantage — IEX Cloud Shutdown Analysis & Migration](https://www.alphavantage.co/iexcloud_shutdown_analysis_and_migration/)
- [FMP — Best Alternative for IEX Cloud Market Data API](https://site.financialmodelingprep.com/developer/docs/blog/Best-Alternative-for-IEX-Cloud-Market-Data-API-Financial-Modeling-Prep-FMP)
- [Applied Ingenuity — The "LLM-as-Analyst" Trap: A Technical Deep-Dive into Agentic Data Systems](https://appliedingenuity.substack.com/p/the-llm-as-analyst-trap-a-technical)
- [Daloopa — How to Use LLMs for Financial Data Analysis: Complete Implementation Guide](https://daloopa.com/blog/analyst-best-practices/practical-guide-using-llms-to-supercharge-your-financial-data-analysis)
