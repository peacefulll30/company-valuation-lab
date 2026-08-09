# Company Valuation Lab — Technical Architecture / Implementation Plan (V1)

Source of truth for product decisions: `docs/prd/company-valuation-lab-prd.md` (WHAT) and
`docs/research/company-valuation-lab-research.md` (WHY). This document defines HOW V1 is built —
stack, structure, data flow, and module boundaries. It does not revisit product scope and does not
design screens; the approved UI interaction references (InteractiveHoverButton-style CTA, animated
hero) are noted where they affect dependency choices and are otherwise deferred to the
Design/Implementation stage.

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | Native Vercel deployment, Server Components + Route Handlers + Server Actions cover every server-side need (data retrieval, engine invocation, AI streaming) without a separate backend service. |
| Language | **TypeScript**, everywhere | Financial correctness depends on typed data flowing unmodified from source → engine → UI → AI; this is a project-wide requirement, not a preference. |
| Styling/UI | **Tailwind CSS + shadcn/ui** (`/components/ui`), **lucide-react** | Explicit product constraint. shadcn/ui components are generated into the repo (owned code, not a runtime dependency), matching the "minimal unnecessary complexity" goal. |
| Motion | **framer-motion**, used only where specified | Explicit product constraint, scoped to the two approved moments (hero text transitions, InteractiveHoverButton-style CTA) — not a general animation layer. |
| Charts | **Recharts** | The library shadcn/ui's own chart components are built on; covers all 8 charts justified in PRD §11 without a second charting dependency. |
| Validation | **Zod** | Single schema/validation library for every boundary: SEC EDGAR responses, assumption edits, AI tool-call arguments, model-state contracts. One source of truth for shape, not just formulas. |
| AI | **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | Native Vercel streaming + typed tool-calling, provider-swappable. Anthropic Claude is the recommended default provider for this finance-reasoning/tool-use task; swapping providers later is a one-line change via the SDK's provider abstraction. |
| Cache / KV | **Upstash Redis via Vercel Marketplace** (`@upstash/redis`, `@upstash/ratelimit`) | `@vercel/kv` is sunset; Upstash Redis is Vercel's current Marketplace-native replacement for exactly this need (short-TTL cache, rate limiting) — no relational database is justified since V1 has no persistent user data. |
| Testing | **Vitest + React Testing Library** | Fast, TypeScript-native, standard Next.js pairing; the engine's unit-test suite is the highest-priority test surface in this project (§12). |

No relational database, no ORM, no auth system, no state-management library (Redux/Zustand) — none are justified by V1 scope (no accounts, no persisted user sessions per PRD §6).

## 2. Frontend / App Routing Structure

```
/                                    Landing (static/ISR)
/valuation                           Company Selection: search input + Featured list
/valuation/[companySlug]             layout.tsx — stepper/tab shell, loads ValuationModelState
  /overview
  /historicals
  /forecast
  /dcf
  /scenarios
  /sensitivity
  /comps
  /summary
  /analyst                           AI Analyst chat
```

- `[companySlug]` resolves to either a Featured slug (statically known, pre-rendered via
  `generateStaticParams`) or a searched company's ticker (dynamic/SSR).
- Every step is both a **route** (shareable URL, back-button support) and, via the shared
  `layout.tsx`, a **tab** in the persistent stepper nav — satisfying PRD §18/§11's guided-stepper +
  addressable-tabs requirement without inventing client-only tab state.
- The Company Selection page is the **only** place eligibility failures surface. Per the hard
  constraint that search failures must never produce partial/misleading valuations, the app never
  navigates into `/valuation/[companySlug]/*` unless the eligibility check (§5) has already passed
  server-side — unsupported/data-unavailable/no-results render inline on `/valuation`, never as a
  broken or partially-populated `[companySlug]` page.

## 3. Server / Backend / Serverless Requirements

- All data retrieval (SEC EDGAR), normalization, eligibility checks, and AI calls run **server-side
  only** — Next.js Route Handlers and Server Actions executing as Vercel Serverless Functions
  (Node.js runtime, not Edge). Edge isn't justified here: none of this work is latency-critical in
  the way Edge is built for, and Node gives simpler access to the full fetch/Zod/AI SDK stack.
- No separate backend service, container, or external server — everything is Vercel Functions +
  static assets + Upstash Redis. This is the deliberate "avoid overengineering" call for
  infrastructure.
- API surface (`/app/api/`):
  - `POST /api/search` — resolves a query through the full pipeline in §5.
  - `POST /api/valuation/[companySlug]/recalculate` — re-runs the engine with edited assumptions
    (used by the UI's assumption forms and, in-process, by the AI Analyst's tool).
  - `POST /api/analyst/chat` — AI Analyst streaming chat.
  - `POST /api/cron/refresh-prices` — Vercel Cron target (§15), protected by a shared-secret header.
- Featured company data is **not** served through an API route at all — it's imported directly by
  Server Components from `/data/featured/*.json` at render time (§4). This is what makes Featured
  reliability independent of any live path succeeding.

## 4. Featured Verified-Company Data Path

- A one-off, manually-run build script (`/scripts/build-featured-dataset.ts`, not part of the
  deployed app) uses the shared `edgar` module (§10) to fetch and normalize SEC EDGAR data for each
  of the 8–12 Featured tickers into the shared `CompanyFinancials` schema (§7).
- Each generated file is **reviewed by a human** before being committed — this is the concrete
  mechanism behind PRD's "manually verified" guarantee. Git history is the versioning system; no
  separate database or CMS is needed for 8–12 files.
- Files live at `/data/featured/{TICKER}.json`, Zod-validated both at generation time and at import
  time (a malformed committed file fails the build, not a user's request).
- At request time, Featured pages `import` these files directly — zero network calls. This
  structurally satisfies the hard constraint that **Featured companies remain reliable even if live
  search/data providers fail**: there is no live provider in their request path.
- Current share price is the one Featured-tier value that legitimately needs periodic refresh
  (financials don't change intra-quarter; price does). A Vercel Cron job (§15) refreshes a small
  `price:{ticker}` entry in Upstash Redis daily; the Overview/Summary pages read price from Redis
  with a **fallback to the last-known-good cached value** if the cron's live fetch fails — so a
  price-source outage degrades to a slightly-stale, clearly-dated price, never a broken page.

## 5. Search-Any-Company Architecture

```
search query
  → ticker/CIK resolution (SEC's company_tickers.json index)
    → [no match] → NO_RESULTS
  → retrieval (SEC EDGAR companyfacts/{CIK}.json)
    → [fetch failure] → DATA_UNAVAILABLE
  → normalization (shared edgar/mapToFinancials — same module as Featured pipeline)
    → [required tags missing/insufficient years] → DATA_UNAVAILABLE
  → eligibility/quality validation
    → [SIC-blocklist hit, or non-10-K/10-Q filer] → UNSUPPORTED
    → [structurally incomplete despite eligible filer type] → DATA_UNAVAILABLE
  → cache (Upstash Redis, keyed by CIK, TTL ~24h; negative results cached shorter)
  → engine (identical entry point used by Featured — §6)
  → full analysis
```

This is implemented as a single server-side orchestrator (`/lib/data-sources/searchCompany.ts`)
returning a **discriminated union**, not a nullable/partial object:

```ts
type SearchResult =
  | { status: "ok"; data: CompanyFinancials }
  | { status: "unsupported"; reason: string }
  | { status: "data_unavailable"; reason: string }
  | { status: "no_results" };
```

The valuation engine's entry point only accepts a fully-parsed `CompanyFinancials` — there is no
code path by which a partial or defaulted object can reach it, because the type doesn't allow one.
This is the concrete mechanism behind the hard constraint that **search failures must never produce
partial or misleading valuations**: it's enforced by the type system at the pipeline boundary, not
by a UI-layer check that could be bypassed or forgotten.

Once a `CompanyFinancials` object exists (Featured or Search tier), it is handed to the same
deterministic engine — from that point on the two tiers are indistinguishable to the rest of the
app, which is what guarantees "no relaxed correctness bar for searched companies" (PRD §10).

## 6. Deterministic Valuation Engine — Isolation

`/lib/engine/` is a pure TypeScript module with **zero imports** from React, Next.js, or the AI
SDK. Every function is `(typed input) → (typed output)`, no I/O, no `Date.now()`, no randomness —
fully unit-testable with fixed fixtures.

- Consumed by: Server Components (initial render), the `recalculate` Route Handler (assumption
  edits), and the AI Analyst's `recalculateValuation` tool (§9) — all three call the **same**
  functions, never a re-implementation.
- The engine has no dependency on `ai`/`@ai-sdk/*`; the AI module depends on the engine, never the
  reverse. This module boundary is the concrete mechanism behind **"one source of truth for
  financial formulas"** and **"AI never independently calculates valuation"** — the AI code
  literally cannot compute a number without going through this module, because it has no other way
  to produce one.

## 7. Model-State / Data Schemas

Zod schemas (source of truth) with inferred TypeScript types, roughly:

```ts
type SourcedValue<T> = { value: T; source: string; asOf: string /* ISO date */ };

type CompanyMeta = {
  ticker: string; cik: string; name: string; sector: string; sicCode: string;
  description: string; tier: "featured" | "searched"; peerTickers: string[];
};

type FinancialLineItems = {
  fiscalYear: number;
  revenue: SourcedValue<number>; ebit: SourcedValue<number>; da: SourcedValue<number>;
  taxRate: SourcedValue<number>; netIncome: SourcedValue<number>;
  cash: SourcedValue<number>; totalDebt: SourcedValue<number>;
  dilutedShares: SourcedValue<number>; operatingCashFlow: SourcedValue<number>;
  capex: SourcedValue<number>; deltaNWC: SourcedValue<number>;
};

type CompanyFinancials = {
  meta: CompanyMeta;
  historicals: FinancialLineItems[];       // exactly 5 years
  currentPrice: SourcedValue<number> | null; // null = price unavailable, never blocks analysis
};

type Assumptions = {
  revenueGrowth: number; ebitdaMargin: number; taxRate: number;
  wacc: number; terminalGrowth: number;
  advanced?: {
    daPctRevenue?: number; capexPctRevenue?: number; nwcPctRevenue?: number;
    marginTrajectory?: "flat" | "ramp" | "fade";
    waccComponents?: WaccComponents;
    exitMultiple?: number;
    midYearConvention?: boolean;
  };
};

type WaccComponents = {
  riskFreeRate: SourcedValue<number>; beta: SourcedValue<number>;
  equityRiskPremium: SourcedValue<number>; preTaxCostOfDebt: SourcedValue<number>;
  marketValueDebt: number; marketValueEquity: number;
};

type DCFResult = {
  forecastYears: { ebitda: number; ebit: number; nopat: number; ufcf: number }[];
  enterpriseValue: number; equityValue: number; impliedSharePrice: number;
  terminalValue: { perpetuity: number; exitMultiple: number | null; divergenceFlag: boolean };
};

type ScenarioResult = { bear: DCFResult; base: DCFResult; bull: DCFResult };

type SensitivityGrid = { waccSteps: number[]; growthSteps: number[]; cells: (number | null)[][] };
// cells[i][j] === null where growthSteps[j] >= waccSteps[i] (blocked, never computed)

type CompsResult = {
  peers: { ticker: string; evRevenue: number; evEbitda: number; pe: number }[];
  impliedRange: { low: number; high: number };
};

type ValuationModelState = {
  company: CompanyFinancials; assumptions: Assumptions;
  dcf: DCFResult; scenarios: ScenarioResult; sensitivity: SensitivityGrid; comps: CompsResult;
};
```

`ValuationModelState` is exactly the object passed to the AI Analyst as grounding context (§9) and
is the single object every UI screen reads from — there is one shape for "the current analysis,"
not one per screen.

## 8. Engine Modules (DCF, WACC, Scenarios, Sensitivity, Comps)

`/lib/engine/`, each file a pure module, composed rather than duplicated:

- `nopat.ts` — `NOPAT = EBIT × (1 − taxRate)`.
- `ufcf.ts` — `UFCF = NOPAT + D&A − CapEx − ΔNWC` (PRD §9 rule 2, exact form).
- `terminalValue.ts` — perpetuity growth (`TV = UFCFₙ₊₁ / (WACC − g)`) and exit multiple
  (`TV = terminalEBITDA × multiple`); flags material divergence between the two when both are
  present (FR-24).
- `wacc.ts` — CAPM cost of equity, after-tax cost of debt, capital-structure-weighted WACC.
- `dcf.ts` — orchestrates forecast → `ufcf.ts` → discount (end-of-year default, mid-year toggle) →
  `terminalValue.ts` → Enterprise Value → Equity Value → Implied Share Price. The single function
  every other module (scenarios, sensitivity) calls — never re-implemented.
- `scenarios.ts` — applies Bear/Base/Bull deltas to operating assumptions only (WACC held constant
  per PRD §9 rule 8) and calls `dcf.ts` three times.
- `sensitivity.ts` — builds the WACC × terminal-growth grid by calling `dcf.ts` per valid cell;
  cells where `growth ≥ WACC` are never computed, set to `null` directly (PRD §9 rule 7, FR-37).
- `comps.ts` — EV/Revenue, EV/EBITDA, P/E for subject + hand-curated peers; implied range kept
  separate from the DCF range (never blended, per FR-42).
- `validate.ts` — shared guards (`WACC > terminalGrowth`, non-zero diluted shares, etc.), imported
  by `dcf.ts` and `sensitivity.ts` — one implementation of every invariant, not two.
- `index.ts` — the only import path the rest of the app is allowed to use (barrel export;
  individual files are internal).

## 9. AI Analyst Architecture

- `POST /api/analyst/chat` (Node runtime), built on the Vercel AI SDK's `streamText`, streamed to
  the client via `@ai-sdk/react`'s `useChat`.
- **Server is the source of truth for state, not the client.** The client sends only
  `companySlug` + the current `Assumptions` on each turn; the server re-derives (or reads from a
  short-lived per-session cache) the full `ValuationModelState` via the engine before invoking the
  model. A client-supplied `ValuationModelState` is never trusted directly — this prevents a
  tampered client payload from grounding the AI in fabricated numbers.
- **Exactly one tool is exposed**, and it is the only way the model can produce a number:

```ts
recalculateValuation(overrides: Partial<Assumptions>): ValuationModelState
```

  Server-side, this calls `/lib/engine` directly (in-process, not over HTTP) with the overridden
  assumptions merged onto the session's current assumptions. There is no second tool, and no
  "calculator" the model can invoke that bypasses the engine — this is the concrete mechanism
  behind **"AI never independently calculates valuation."**
- **System prompt contract**: the model is instructed to (a) always call `recalculateValuation` for
  any "what if" question rather than estimating in its own reasoning, (b) cite the specific
  model-state field(s) behind any factual claim, (c) decline or explicitly flag anything outside the
  passed model state (FR-52) — e.g. general market speculation.
- **API boundary / secrets**: the LLM provider key (`ANTHROPIC_API_KEY`) is a server-only
  environment variable, read only inside `/api/analyst/chat`, never exposed via a `NEXT_PUBLIC_`
  variable or shipped to the client bundle. The client only ever talks to this same-origin route.
- **Abuse/cost control**: since V1 has no auth (PRD §6), both `/api/analyst/chat` and `/api/search`
  are rate-limited per IP via `@upstash/ratelimit` — a minimal, necessary guard given an
  unauthenticated route sits in front of a paid LLM API, not scope creep.
- External context (news, qualitative commentary) is explicitly not built in V1 (matches PRD); the
  single-tool design leaves room to add it later as a clearly separate, labeled tool without
  touching the grounding contract above.

## 10. SEC EDGAR / Data Pipeline + Source/As-Of Metadata

- `/lib/data-sources/edgar/` is used by **both** the offline Featured build script and the live
  Search-tier path — one implementation of the XBRL-tag-to-schema mapping, so EBITDA derivation and
  every other rule stays identical across tiers (this is the same "one source of truth" principle
  applied to data normalization, not just formulas).
  - `client.ts` — fetch wrapper with the required `User-Agent` header, timeout, basic retry.
  - `tickerIndex.ts` — resolves name/ticker → CIK via SEC's public `company_tickers.json`.
  - `companyFacts.ts` — fetches/parses `data.sec.gov/api/xbrl/companyfacts/{CIK}.json`.
  - `mapToFinancials.ts` — maps XBRL tags (`OperatingIncomeLoss` → EBIT, etc.) to
    `FinancialLineItems`, deriving `EBITDA = EBIT + D&A` and attaching `SourcedValue` metadata
    (XBRL tag, accession number, fiscal period end) to every field — never a bare number.
  - `sicBlocklist.ts` — SIC codes for banks/insurers/financial institutions, used by eligibility
    validation (§5) and the Featured company selection process alike.
- **Market assumption defaults** (risk-free rate, equity risk premium, representative cost-of-debt
  spread) are a small, **manually curated** JSON file (`/data/market-assumptions.json`), updated
  periodically by the developer, each entry carrying its own `asOf` date — deliberately *not* a
  second live integration. A live feed for three slow-moving macro inputs isn't justified by the
  engineering cost relative to a dated manual value that already satisfies the source+as-of
  invariant.
- **Current price** uses one lightweight, keyless quote source (recommended: Stooq's free daily
  CSV endpoint, swappable later) fetched by the Cron job for Featured tickers and on-demand
  (cached) for searched companies. Price is **not required** for the DCF/WACC/scenario/sensitivity
  math — only for the market-price comparison in Overview/Summary — so a price-fetch failure
  degrades to `currentPrice: null` / "price unavailable," never blocks or invalidates the valuation
  itself.
- Every `SourcedValue` is rendered through one shared UI primitive (`<SourceTag>`, built in the
  Design/Implementation stage) so "source + as-of on every externally sourced figure" is enforced by
  what the type requires components to have, not by developer discipline alone.

## 11. Validation / Error Handling

- **Zod at every boundary**: SEC EDGAR responses (unknown fields ignored, required fields
  validated), client → server assumption edits, and AI tool-call arguments are all parsed before
  use — nothing unvalidated reaches the engine or the AI context.
- **Typed error taxonomy**, each mapped to a specific, calm UI state (PRD §11 tone requirement):
  `UnsupportedCompanyError`, `DataUnavailableError`, `NoResultsError`, `InvalidAssumptionError`
  (WACC ≤ terminal growth, etc.), `RecalculationError`. No generic catch-all error page.
- **No silent zero-defaulting**: required financial fields are non-optional in the Zod schema, so a
  missing value is a parse failure → `DataUnavailableError`, never a `0` that quietly corrupts a
  downstream calculation (PRD §13).
- **Engine guards are the single implementation of every invariant** (`engine/validate.ts`,
  §8) — `dcf.ts` and `sensitivity.ts` both call it rather than each re-checking `WACC > g`
  independently, so the rule can't drift between the two call sites.

## 12. Testing Strategy

- **Financial invariants (highest priority)**: Vitest unit tests for every `engine/*.ts` function
  against hand-calculated fixtures, including one fully worked reference company matching PRD's
  Success Criteria benchmark — NOPAT, UFCF, both terminal value methods, EV→Equity→Share Price,
  WACC/CAPM build, scenario deltas, sensitivity grid (including the blocked-cell rule), comps
  multiples.
- **Edge cases**: dedicated tests per PRD §13 — negative EBITDA/UFCF, WACC ≤ g rejection, net-cash
  (negative net debt), zero/negative growth, zero-shares guard, missing-data → error not zero.
- **Integration tests**: fixture-based SEC EDGAR responses run through
  `mapToFinancials` → eligibility → `CompanyFinancials`, covering a valid supported company, a bank
  (SIC-blocklist hit → unsupported), a company with missing required tags (→ data-unavailable), and
  a non-10-K/10-Q filer (→ unsupported).
- **AI grounding tests**: a harness feeds the chat route a fixed `ValuationModelState` and a
  scripted question set (drawn from Research §13), asserting (a) `recalculateValuation` is actually
  invoked for "what if" questions rather than answered from the model's own reasoning, and (b)
  numeric claims in the response cross-check against the model-state snapshot. This is explicitly a
  **spot-check**, not exhaustive semantic grading — matching PRD's own "spot-checked" framing rather
  than overclaiming automated AI verification.
- **Component tests**: React Testing Library for the states PRD calls out explicitly — unsupported/
  data-unavailable/no-results messages, the blocked WACC ≤ g input, empty/loading states.
- Tests gate merges (CI on PRs); Vercel deployment itself stays fast and doesn't re-run the full
  suite — a deliberate scope boundary, not a gap.

## 13. Proposed File Structure

```
/app
  /(marketing)/page.tsx                       Landing
  /valuation
    page.tsx                                  Company Selection (search + Featured list)
    /[companySlug]
      layout.tsx                              Stepper/tab shell
      /overview/page.tsx
      /historicals/page.tsx
      /forecast/page.tsx
      /dcf/page.tsx
      /scenarios/page.tsx
      /sensitivity/page.tsx
      /comps/page.tsx
      /summary/page.tsx
      /analyst/page.tsx
  /api
    /search/route.ts
    /valuation/[companySlug]/recalculate/route.ts
    /analyst/chat/route.ts
    /cron/refresh-prices/route.ts

/components
  /ui                                          shadcn/ui primitives
  /marketing                                   Hero, InteractiveHoverButton-style CTA (later stage)
  /valuation                                   Charts, tables, stepper nav, <SourceTag>

/lib
  /engine                                      Pure deterministic engine (§6, §8)
  /data-sources
    /edgar                                     Shared SEC EDGAR client + mapping (§10)
    price.ts
    searchCompany.ts                           Search pipeline orchestrator (§5)
  /ai
    chat.ts                                    System prompt + model config
    recalculateTool.ts                         The one tool (§9)
  /schemas                                     Zod schemas + inferred types (§7)
  /cache
    redis.ts                                   Thin Upstash Redis wrapper

/data
  /featured/{TICKER}.json                      8–12 verified companies
  market-assumptions.json

/scripts
  build-featured-dataset.ts                    Manual, offline (§4)

/tests
  /engine  /data-sources  /ai  /components

vercel.json                                    Cron config
```

## 14. Minimal Justified Dependencies

| Package | Purpose |
|---|---|
| `next`, `react`, `react-dom` | Framework |
| `typescript` | Type safety across engine/schemas/UI/AI boundary |
| `tailwindcss` | Styling (product constraint) |
| shadcn/ui (generated, not a runtime package) | Component system (product constraint) |
| `lucide-react` | Icon set (product constraint) |
| `framer-motion` | The two approved motion moments only (product constraint) |
| `zod` | Runtime validation + type inference at every boundary |
| `recharts` | All 8 justified chart types; pairs natively with shadcn/ui |
| `ai`, `@ai-sdk/anthropic`, `@ai-sdk/react` | AI Analyst streaming + typed tool calling |
| `@upstash/redis`, `@upstash/ratelimit` | Search-tier cache, price cache, rate limiting |
| `vitest`, `@testing-library/react` | Testing |

**Deliberately excluded**: a relational database/ORM (no persistent user data in V1), a
state-management library (Server Components + URL-driven routing + minimal client state don't need
one), a second charting library, a generic HTTP client (native `fetch` suffices), an XBRL/XML
parser (the EDGAR `companyfacts` endpoint is already parsed JSON), an auth library (no accounts in
V1).

## 15. Vercel Deployment Architecture

- Single Vercel project, Next.js framework preset, standard Production (main branch) + Preview (PR)
  environments — no custom CI/CD beyond Vercel's own PR-preview flow plus the test gate in §12.
- **Environment variables** (server-only, no `NEXT_PUBLIC_` prefix): `ANTHROPIC_API_KEY`,
  `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (auto-provisioned by the Marketplace
  integration), `CRON_SECRET` (shared secret validating the cron route). Set via the Vercel
  dashboard/CLI; never committed (`.env.local` gitignored).
- **Upstash Redis** provisioned via `vercel integration add upstash` (Marketplace) — used for the
  search-tier company cache, negative-result cache, Featured-tier price cache, and rate limiting.
- **Vercel Cron** (`vercel.json`) triggers `POST /api/cron/refresh-prices` on a daily schedule;
  the route checks the `CRON_SECRET` header so it can't be invoked externally.
- **Rendering strategy**: Landing and Featured company pages use static generation / ISR
  (`generateStaticParams` for known Featured slugs, long revalidate interval) — fast, resilient,
  cheap. Searched-company pages are SSR/dynamic, since they depend on request-time input.
- **Runtime**: Node.js serverless functions for every data/AI route; no Edge runtime forced
  anywhere — not a stated requirement, and Node keeps the fetch/Zod/AI SDK stack simplest.
- No custom infrastructure beyond the above — Vercel Functions, static assets, and one Marketplace
  Redis integration is the entire deployment surface.

## 16. Ordered Implementation Phases

1. **Foundations** — repo scaffold (Next.js + TS + Tailwind + shadcn/ui init), Zod schemas (§7),
   engine module skeletons with test scaffolding.
2. **Deterministic engine** — implement and unit-test every `engine/*.ts` module against
   hand-calculated fixtures. No UI yet; this is the highest-risk, highest-priority surface.
3. **Featured data pipeline** — build the shared `edgar/*` module, `build-featured-dataset.ts`,
   and produce + manually verify the 8–12 Featured JSON files.
4. **Core UI shell + Featured flow** — routing/layout/stepper, all screens wired to Featured data
   and the engine (no search, no AI yet). This alone is a demoable, fully correct product.
5. **Search-tier pipeline** — `searchCompany.ts`, eligibility validation, Redis caching,
   unsupported/data-unavailable/no-results UI states.
6. **AI Analyst** — chat route, system prompt, `recalculateValuation` tool, grounding tests.
7. **Landing/marketing polish** — hero with Framer Motion text transitions, InteractiveHoverButton-
   style CTA, methodology explainer copy adapted to this product. Sequenced last because it has no
   dependency on engine correctness — this is the Design/Implementation stage the approved UI
   references belong to.
8. **Hardening** — accessibility pass, edge-case UI polish, Cron + price refresh live, rate
   limiting live, final QA against PRD §14 Success Criteria.

## 17. Hard Constraints — Compliance Mapping

| Constraint | Mechanism |
|---|---|
| One source of truth for financial formulas | `/lib/engine`, imported by UI and AI alike; no second implementation anywhere (§6, §8) |
| AI never independently calculates valuation | Exactly one tool, `recalculateValuation`, which calls the engine in-process; no other numeric path exists for the model (§9) |
| Secrets never client-side | LLM key and Redis credentials are server-only env vars, read only inside Route Handlers (§9, §15) |
| Search failures must never produce partial/misleading valuations | `SearchResult` discriminated union + engine only accepting fully-parsed `CompanyFinancials` — a partial object cannot type-check into the engine (§5) |
| Featured companies remain reliable even if live search/data providers fail | Featured pages import static, committed JSON directly — no live provider in their request path (§4) |
| No banks/insurers in the V1 valuation engine | SIC-code blocklist enforced at eligibility validation for search, and by construction for the Featured list (§5, §10) |
| Avoid overengineering | No DB/ORM/auth/state-library where V1 scope doesn't need one; one cache technology (Redis) for every caching need; Node runtime everywhere by default (§1, §14, §15) |

## 18. Open Questions / Risks for Implementation

- **Price data source** (Stooq recommended) is a swappable, low-stakes choice — not blocking, but
  worth confirming before Phase 8 since it affects the Cron job's implementation.
- **LLM provider** (Anthropic recommended) is swappable via the AI SDK's provider abstraction;
  confirm before Phase 6 if a different provider is preferred.
- **SIC-code blocklist completeness** for the eligibility check needs a first real pass during
  Phase 5 — the initial list should be reviewed against a handful of known edge cases (e.g.
  diversified holding companies with financial subsidiaries) before relying on it in production.
- **Featured company list** (specific 8–12 tickers) is still open per PRD §24/Research §24 and is
  needed before Phase 3 can start, not before this architecture is usable.
