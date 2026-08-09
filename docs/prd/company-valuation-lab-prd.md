# Company Valuation Lab — PRD (V1)

Source of truth for rationale and alternatives considered: `docs/research/company-valuation-lab-research.md`.
This document locks decisions and defines WHAT V1 builds — not HOW it is implemented. Tech stack,
architecture, and detailed UI design are out of scope here and belong to the Architecture stage.

## 1. Product Purpose

Company Valuation Lab is a valuation reasoning tool for real public companies: it takes a
company's historical financials, walks the user through a forecast and a DCF, and produces a
range-based fair-value estimate with an AI Analyst that explains how the model got there. It is
not a stock screener, not a robo-advisor, and never asserts a single "true" value — only a range
conditioned on stated assumptions.

## 2. Target User

Primary: a finance hiring evaluator (IB / Equity Research / Asset Management / PE) assessing the
builder's technical and financial judgment in a short (5–10 minute) unguided session. Secondary:
someone actually performing valuation work (the builder in a walkthrough, or a self-directed
learner). The product must hold up to real use, not just look credible at a glance — correctness
is never traded for polish.

## 3. Product Positioning

Institutional-finance / premium fintech product — closer to a professional research terminal than
a calculator. Explicitly **not**: crypto/trading-app aesthetic, generic AI-SaaS landing page,
gamified "casino" framing, excessive gradients/glassmorphism. Restrained, typography-led, data
credible.

Credibility extends to how the product represents its own coverage: it positions itself as able to
attempt analysis on any public operating company, backed by a small set of Featured/Guaranteed
companies that are manually verified and always work — never as a tool with universal, guaranteed
coverage. Being honest about what is and isn't reliably supported is itself part of the
institutional tone.

## 4. Core User Journey

Landing → Start Valuation → Company Selection (search or Featured list) → Data & Eligibility Check
→ Company Overview → Historical Financials → Forecast → DCF → Scenarios → Sensitivity → Trading
Comps → Valuation Summary → AI Analyst.

The Data & Eligibility Check is a gate, not a screen the user dwells on: it resolves instantly for
Featured companies (pre-verified), and for a searched company determines whether it is unsupported,
has insufficient data, or can proceed to full analysis (§7.2).

Presented as a **guided stepper on first entry**, with every step also reachable as an
**independently addressable tab/section** once a company is loaded — not one long scrolling page.

## 5. V1 Scope

- Search any public operating company by name or ticker, with automatic data retrieval,
  normalization, and a methodology-fit check (§7.2)
- 8–12 curated companies retained as manually verified **Featured / Guaranteed** examples that
  always produce a complete, correct analysis
- Clear, distinct unsupported-company and data-unavailable states for searched companies that don't
  qualify (§13)
- Banks, insurers, and other financial institutions excluded from the valuation model regardless of
  whether reached via search or the Featured list
- Company Overview snapshot per company
- 5 years historical financials with derived metrics
- 5-year forecast with Mandatory + Advanced (progressive disclosure) assumptions
- Deterministic DCF engine: UFCF bridge, both terminal value methods, EV → Equity Value → implied
  share price
- Component-based WACC model, pre-filled default with Advanced full build
- Bear / Base / Bull scenario analysis on operating assumptions
- WACC × terminal growth sensitivity matrix
- Limited, hand-curated Trading Comps (EV/Revenue, EV/EBITDA, P/E)
- Valuation Summary as a range/football-field view, no bare Undervalued/Overvalued verdict
- Full AI Analyst with chat UI, grounded in deterministic model state
- Every externally sourced figure shown with source + as-of date

## 6. Out of Scope (V1)

| Item | Reason |
|---|---|
| Guaranteed accuracy/completeness for arbitrary searched (non-Featured) companies | Best-effort only; the reliability guarantee is limited to the curated Featured set |
| Non-SEC-filing companies (most non-US-listed companies without SEC filings) | Primary data source (SEC EDGAR) only covers SEC filers; still out of reach for V1 regardless of search |
| Banks, insurers, other financial institutions as valuation subjects | DCF/EBITDA framework doesn't fit; detected and blocked via the unsupported-company check (§7.2), not modeled with an alternative methodology in V1 |
| Automated/algorithmic peer selection for comps | Hard research problem on its own; V1 uses hand-curated peers |
| Real-time/streaming market data | Not the value proposition; periodic, dated refresh is sufficient |
| User accounts, saved sessions, multi-user state | Adds infra complexity with no valuation-credibility payoff |
| PDF/report export | Nice-to-have polish, not core |
| Multi-currency/FX-adjusted modelling | Only relevant once non-USD reporters are in scope |
| Backtesting valuation accuracy over time | Orthogonal to demonstrating valuation competence |
| Foreign private issuer (20-F) companies, e.g. Ryanair | Shallower filing cadence than 10-K/10-Q filers; V1.5+/V2 |

## 7. Functional Requirements

### 7.1 Landing
- FR-1: Must explain, before any workflow entry: what the product is, what it can do, and (briefly)
  how the methodology works (Historicals → Forecast → DCF → Scenarios/Sensitivity).
- FR-2: Must display a disclaimer that outputs are model-based estimates, not investment advice.
- FR-3: Single primary CTA into Company Selection (e.g. "Start Valuation"); no login required.
- FR-4: Visual tone matches §3 Positioning.

### 7.2 Company Selection
- FR-5: Provide a search input (by company name or ticker) as the primary entry point, alongside a
  visible **Featured / Guaranteed** list of 8–12 curated companies (name, ticker, sector, one-line
  description).
- FR-5a: On search, attempt to retrieve and normalize financial data for the matched company from
  the same class of primary sources used for Featured companies (§10).
- FR-5b: If sufficient valid data exists and the company fits the V1 valuation methodology (a
  standard operating company — not a bank/insurer/other incompatible structure), proceed to full
  analysis from Overview onward, under the identical rules and invariants (§9) used for Featured
  companies.
- FR-5c: If the company is categorically unsupported (bank, insurer, or other financial-structure
  mismatch with the DCF/EBITDA model), show a clear, distinct unsupported-company message; do not
  attempt partial or best-effort analysis (§13).
- FR-5d: If the company would otherwise be supported but retrieved data is insufficient or
  unreliable, show a clear data-unavailable message, distinct from the unsupported-company message
  (§13).
- FR-5e: If a search yields no matching company, show a clear no-results state.
- FR-6: No banks/insurers/financial institutions appear in the Featured list; any such company
  reached via search is caught by FR-5c, never silently analyzed.
- FR-7: Selecting a Featured company, or a searched company that passes FR-5b, loads its dataset and
  proceeds to the Data & Eligibility Check / Overview (§4). Featured companies are manually
  verified and always produce a complete, correct analysis — unlike searched companies, they do not
  depend on the live retrieval/normalization path succeeding at request time (§10).

### 7.3 Overview
- FR-8: Show sector, market capitalization, current share price (source + as-of date), and a short
  company description.
- FR-9: Informational only — no user input required at this step.

### 7.4 Historical Financials
- FR-10: Display 5 fiscal years of: Revenue, EBIT, D&A, effective tax rate, Net Income, Cash, Total
  Debt, Diluted Shares Outstanding, Operating Cash Flow, CapEx, ΔNWC, Free Cash Flow.
- FR-11: Display derived EBITDA (= EBIT + D&A) per §9. If the company separately discloses adjusted
  EBITDA, show it as a labeled cross-check, never substituted for the derived figure.
- FR-12: Display derived metrics: revenue growth %, EBITDA margin, EBIT margin, net margin, FCF
  margin, Net Debt/EBITDA, FCF conversion.
- FR-13: Every line item traceable to its filing/XBRL source and as-of date.
- FR-14: No COGS line item in V1.

### 7.5 Forecast
- FR-15: 5 forecast years following the historical window, visually distinguished from history in
  any shared chart/table.
- FR-16: Mandatory inputs: revenue growth rate, EBITDA margin path, tax rate, WACC, terminal growth
  rate.
- FR-17: Advanced inputs (collapsed by default): D&A % of revenue, CapEx % of revenue, NWC % of
  revenue (or ΔNWC), margin trajectory/fade, WACC component overrides, exit-multiple inputs,
  mid-year discounting toggle.
- FR-18: All downstream outputs (DCF, scenarios, sensitivity, summary) recompute immediately on any
  assumption change.

### 7.6 DCF
- FR-19: Compute NOPAT = EBIT × (1 − tax rate).
- FR-20: Compute UFCF = NOPAT + D&A − CapEx − ΔNWC for every forecast year (§9 — exact form, no
  substitution).
- FR-21: Discount UFCF at WACC; end-of-year convention by default, mid-year convention as an
  Advanced toggle.
- FR-22: Compute Terminal Value via perpetuity growth (primary/mandatory):
  `TV = UFCF_(n+1) / (WACC − g)`.
- FR-23: Compute Terminal Value via exit multiple (Advanced cross-check):
  `TV = Terminal Year EBITDA × Exit Multiple`.
- FR-24: When both terminal value methods are shown, flag material divergence between them rather
  than silently picking one.
- FR-25: Compute Enterprise Value = PV(UFCF, years 1–5) + PV(Terminal Value).
- FR-26: Compute Equity Value = Enterprise Value − Net Debt, where Net Debt = Total Debt − Cash
  (may be negative).
- FR-27: Compute Implied Share Price = Equity Value ÷ Diluted Shares Outstanding.
- FR-28: Reject or clamp, with an explicit message, any state where WACC ≤ terminal growth rate —
  in the assumption input and in every sensitivity-grid cell.

### 7.7 WACC
- FR-29: Default (Mandatory) view shows one pre-filled WACC value; each underlying default carries
  a visible source and as-of date.
- FR-30: Advanced panel exposes the full component build: risk-free rate, beta, equity risk premium
  → Cost of Equity (CAPM); pre-tax cost of debt, tax rate → after-tax Cost of Debt; market values
  of debt and equity → capital-structure weights → WACC.
- FR-31: Every Advanced component is editable; edits recompute WACC and all downstream DCF/scenario/
  sensitivity outputs immediately.

### 7.8 Scenarios
- FR-32: Provide Bear / Base / Bull presets varying: revenue growth rate, EBITDA margin trajectory,
  terminal growth rate, and (where relevant to the company) CapEx intensity.
- FR-33: WACC is held constant across all three scenarios in V1.
- FR-34: Each scenario produces its own complete DCF output (EV, Equity Value, implied share price).
- FR-35: Present Bear/Base/Bull implied share prices side by side for comparison.

### 7.9 Sensitivity
- FR-36: Display a WACC × terminal growth rate matrix (5×5 or 7×5) of implied share price. WACC
  axis: base ± 2pp in 0.5pp steps. Growth axis: base ± 1pp in 0.25–0.5pp steps.
- FR-37: Any cell where terminal growth ≥ WACC is excluded/blocked, never computed or displayed.
- FR-38: Grid carries a caption stating it is a model output under stated assumptions, not a price
  forecast.
- FR-39: Sensitivity is visually and structurally distinct from Scenarios (§7.8) — different
  section, different framing copy.

### 7.10 Trading Comps
- FR-40: Display a hand-curated peer set (3–5 named peers) per company.
- FR-41: Compute EV/Revenue, EV/EBITDA, and P/E for the subject company and each peer.
- FR-42: Derive an implied valuation range from peer multiples; show it separately from the DCF
  range, never blended into one number.
- FR-43: No algorithmic/automated peer selection in V1.

### 7.11 Valuation Summary
- FR-44: Render a football-field-style range chart: current market price, DCF Bear–Bull range,
  Comps-implied range, on one shared axis.
- FR-45: Display base-case fair value, the range, and implied upside/downside % vs. current price.
- FR-46: No bare "Undervalued/Overvalued/Fairly Valued" label. An optional compact status must be
  an assumption-anchored band ("trading below/within/above model range"), always paired with the
  numeric range.
- FR-47: Current market price shown with source + as-of date.

### 7.12 AI Analyst
- FR-48: Chat UI available once a company's full model state exists (historicals through comps
  computed).
- FR-49: AI receives a structured snapshot of deterministic model state (historicals, assumptions,
  DCF outputs, scenario outputs, sensitivity grid, comps) as context/tool results.
- FR-50: AI never performs valuation math itself. Any recalculation request (e.g., "what if growth
  were 8%?") is executed via a controlled function call into the deterministic engine; the AI
  narrates the engine's returned result, not a self-generated number.
- FR-51: AI responses reference the specific model-state values they draw from rather than
  producing unattributed figures.
- FR-52: If asked something outside the computed model state (e.g., speculation the model doesn't
  cover), the AI declines or explicitly flags the answer as outside the deterministic model.

## 8. Mandatory vs. Advanced Inputs

| Area | Mandatory | Advanced (progressive disclosure) |
|---|---|---|
| Forecast | Revenue growth, EBITDA margin | D&A %, CapEx %, NWC %, margin trajectory/fade |
| Tax & discounting | Tax rate, WACC (pre-filled) | Full WACC component build, mid-year convention toggle |
| Terminal value | Terminal growth rate (perpetuity) | Exit multiple override / cross-check toggle |
| Scenarios | Pre-set Bear/Base/Bull | Custom scenario editing |
| Comps | Shown as-is | Peer set adjustment (if time allows) |

A beginner completes a credible valuation touching five inputs; an advanced user can override every
lever that materially changes the answer.

## 9. Financial Rules / Invariants

These hold everywhere in the product, with no exceptions:

1. `NOPAT = EBIT × (1 − tax rate)`
2. `UFCF = NOPAT + D&A − CapEx − ΔNWC` — this exact form, always; never an unexpanded restatement.
3. `EBITDA = EBIT + D&A` (derived). A company's own reported/adjusted EBITDA may be shown only as a
   labeled cross-check, never silently substituted.
4. `Enterprise Value = PV(UFCF, forecast years) + PV(Terminal Value)`
5. `Equity Value = Enterprise Value − Net Debt`, where `Net Debt = Total Debt − Cash` (can be
   negative — a net-cash company has Equity Value > Enterprise Value, and this is correct, not an
   error).
6. `Implied Share Price = Equity Value ÷ Diluted Shares Outstanding`
7. `WACC > Terminal Growth Rate` is enforced everywhere the terminal-growth perpetuity formula is
   used — assumption input and every sensitivity cell.
8. Scenarios (Bear/Base/Bull) vary operating assumptions only; WACC is fixed across all three in V1.
9. The AI Analyst never computes a financial number; the deterministic engine is the sole source of
   numeric truth, always.
10. Every externally sourced number (market price, risk-free rate, ERP, beta, cost of debt inputs)
    displays a source and an as-of date, with no exceptions.

## 10. Data / Source Requirements

Two data tiers apply:

**Featured / Guaranteed tier (8–12 companies):**
- Primary source: SEC EDGAR XBRL Company Facts API — free, official, no API key required.
- Financials fetched and verified once via a build-time/offline pipeline and shipped as a static,
  versioned dataset — not fetched live from the client at runtime.
- Each company's data file documents which filing line/XBRL tag maps to each model input, and its
  as-of date.
- Guaranteed to load and analyze correctly; does not depend on any live retrieval path succeeding at
  request time.

**Search tier (any public operating company):**
- On-demand retrieval and normalization from the same class of primary sources (SEC EDGAR XBRL for
  US SEC filers) at the time of search.
- Realistic coverage is bounded by the source: companies that are not SEC filers (most non-US-listed
  companies without US filings) are not retrievable in V1 and surface as data-unavailable, not
  analyzed with degraded data.
- Success is not guaranteed — retrieval or normalization failure, or insufficient data, resolves to
  the data-unavailable state (§13), never a partial or silently defaulted analysis.
- Any data that is successfully retrieved and used for analysis is subject to the same rules as
  Featured data (derived EBITDA, source + as-of date on every figure) — no relaxed correctness bar
  for searched companies.

**Applies to both tiers:**
- EBITDA is derived (EBIT + D&A) from standardized XBRL-tagged inputs, not trusted as a raw
  "EBITDA" tag (non-GAAP, inconsistently reported).
- Current market price: periodically refreshed value, always shown with source + as-of date.
- WACC component defaults (risk-free rate, ERP, beta, cost of debt): each individually sourced and
  dated.
- Trading comps peer data: curated and static, source + as-of date (unchanged — peer sets stay
  hand-curated regardless of how the subject company was reached).

## 11. Key UX Requirements

- Guided stepper on first entry; independently addressable tabs once a company is loaded (§4).
- Progressive disclosure for every Advanced input group (§8) — collapsed by default.
- Visual hierarchy: the answer (implied share price / valuation range) is the most prominent
  element on any screen that shows it; supporting detail is visibly secondary.
- Forecast years are visually distinguished from historical years wherever shown together.
- Only the charts justified in Research §17 (revenue/EBITDA trend, margins over time, FCF trend,
  forecast-vs-historical, valuation bridge/waterfall, Bull/Base/Bear comparison, sensitivity
  heatmap, football-field range). No candlestick/intraday price charts; no pie charts for capital
  structure.
- Empty, loading, and error states for data loading and for the AI Analyst, calm and informative in
  tone (not alarming).

## 12. Accessibility Requirements

- Full keyboard operability for every interactive element (inputs, toggles, tabs, chart
  interactions, chat).
- Visible focus states, consistent across the product.
- Semantic HTML by default (`button`, `label`, `table`, heading structure); ARIA only to fill
  genuine gaps.
- Sufficient color contrast for all text and status/badge treatments.
- Status or classification information (e.g., "trading below model range") is never conveyed by
  color alone — always paired with a label or icon.
- Chart tooltips show precise values, not just a restatement of the axis.
- Verified usable at desktop, tablet, and mobile breakpoints.

## 13. Edge Cases / Validation

- Negative EBITDA / negative UFCF: render and explain, never hidden or silently zeroed.
- WACC ≤ terminal growth rate: hard-blocked with an explicit message, in both the assumption input
  and the sensitivity grid (see FR-28, FR-37).
- Net cash position (Cash > Debt): Net Debt negative, Equity Value > Enterprise Value — valid,
  clearly labeled, not an error state.
- Zero/negative growth, mature companies: valid and supported without implying something is broken.
- Missing/incomplete filing data for a required field: explicit "data not available" state — never
  default silently to zero.
- Abnormal one-off historical years (e.g., a demand-shock year): forecast must not naively
  extrapolate from an outlier base year; use a multi-year average or let the user override the
  base-year growth assumption.
- Zero/invalid shares outstanding: validated before use in division, even though it cannot occur in
  the curated dataset.
- Unsupported company (bank, insurer, or other structure incompatible with the DCF/EBITDA model):
  detected at the Data & Eligibility Check (FR-5c) and shown as a clear, distinct message — no
  partial or best-effort analysis is attempted.
- Data-unavailable (an otherwise-supported company with insufficient or unreliable retrieved data):
  shown as a clear, distinct message (FR-5d) — never silently defaulted or analyzed with gaps
  filled in.
- No search match: a clear no-results state (FR-5e), distinct from both states above.
- Financial institutions are never analyzed regardless of entry path — excluded from the Featured
  list by construction, and caught by the unsupported-company check for any search (§6, §7.2) — not
  a runtime condition special-cased inside the DCF engine itself.

## 14. Success Criteria

- All 8–12 Featured companies load with verified, sourced 5-year historical data; no required field
  missing.
- For a test set of valid, supported companies reached via search (outside the Featured list), the
  system retrieves, normalizes, and completes full analysis end-to-end.
- For a test set of known-unsupported companies (e.g., major banks/insurers), search resolves to the
  unsupported-company message every time — never a partial or incorrect analysis.
- For a company with deliberately insufficient/unreliable data, search resolves to the
  data-unavailable message — never a silently defaulted or gap-filled analysis.
- DCF, WACC, scenario, sensitivity, and comps outputs match hand-calculated values for at least one
  reference company, used as a verification benchmark.
- Every displayed externally sourced figure shows a source and an as-of date — zero exceptions,
  spot-checked across all screens.
- WACC ≤ terminal growth is unreachable through the UI, both in assumption input and the
  sensitivity grid.
- AI Analyst answers, spot-checked against a test set of questions (drawn from Research §13),
  reference only values present in the passed model-state snapshot — no fabricated numbers.
- No product copy (landing, search, empty states) claims or implies universal/guaranteed coverage
  of every public company.
- A first-time reader can state what the product is and does from the Landing page alone, without
  entering the workflow.
- The full journey (§4) is completable end-to-end, without dead ends, for every Featured company and
  for at least one representative searched company.

## 15. Explicit V2 Ideas

- Broader coverage beyond SEC filers — non-SEC/international companies, additional sectors — plus
  improved live-data reliability and caching for the Search tier.
- Banks/insurers/financial institutions, via a DDM or excess-return valuation model (not DCF/EBITDA).
- Automated/algorithmic peer selection for comps.
- Real-time/streaming market data.
- User accounts, saved sessions, multi-user state.
- PDF/report export.
- Multi-currency/FX-adjusted modelling for non-USD reporters.
- Backtesting valuation accuracy over time.
- Foreign private issuer (20-F) companies, e.g. Ryanair.
