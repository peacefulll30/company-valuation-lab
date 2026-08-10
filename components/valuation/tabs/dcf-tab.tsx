"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { EvEquityWaterfallChart } from "@/components/charts/ev-equity-waterfall-chart";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { Reveal } from "@/components/valuation/reveal";
import { WaccModeBadge } from "@/components/valuation/wacc-mode-badge";
import { DIVERGENCE_THRESHOLD } from "@/lib/engine";

export function DcfTab() {
  const { record, assumptions, waccExplanation, waccMode, modelState, modelError } = useValuationWorkspace();

  if (modelError || !modelState) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">04 — DCF</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">DCF</h1>
        </div>
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {modelError ?? "Could not compute a DCF with the current assumptions."}
        </div>
      </div>
    );
  }

  const { dcf } = modelState;
  const lastHistoricalYear = record.financials.historicals[record.financials.historicals.length - 1].fiscalYear;
  const latestHistorical = record.financials.historicals[record.financials.historicals.length - 1];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">04 — DCF</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">DCF</h1>
          <ConceptInfo concept="dcf" />
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          The UFCF bridge from Revenue to unlevered free cash flow, discounted at WACC to a share price.
        </p>
      </div>

      <Reveal delay={0.1} className="flex flex-col gap-8">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left">
                <th className="px-3 py-2 font-medium">$</th>
                {dcf.forecastYears.map((y) => (
                  <th key={y.year} className="px-3 py-2 text-right font-mono font-medium">
                    FY{lastHistoricalYear + y.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {(
                [
                  ["Revenue", "revenue"],
                  ["EBITDA", "ebitda"],
                  ["EBIT", "ebit"],
                  ["NOPAT", "nopat"],
                  ["UFCF", "ufcf"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{label}</td>
                  {dcf.forecastYears.map((y) => (
                    <td key={y.year} className="px-3 py-2 text-right">
                      {formatCompactCurrency(y[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <EvEquityWaterfallChart
            enterpriseValue={dcf.enterpriseValue}
            netDebt={dcf.netDebt}
            equityValue={dcf.equityValue}
            impliedSharePrice={dcf.impliedSharePrice}
          />

          <div className="mt-3 rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Equity bridge, in full</p>
            <dl className="mt-2 flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Enterprise Value</dt>
                <dd className="tabular-nums">{formatCompactCurrency(dcf.enterpriseValue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">&minus; Debt</dt>
                <dd className="tabular-nums">{formatCompactCurrency(latestHistorical.totalDebt.value)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  + Cash &amp; cash equivalents{" "}
                  <span className="font-mono text-[11px]">(CashAndCashEquivalentsAtCarryingValue)</span>
                </dt>
                <dd className="tabular-nums">{formatCompactCurrency(latestHistorical.cash.value)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">+ Eligible cash-like investments (marketable securities)</dt>
                <dd className="tabular-nums">
                  {latestHistorical.cashLikeInvestments
                    ? formatCompactCurrency(latestHistorical.cashLikeInvestments.value)
                    : "Unavailable — excluded"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1.5 font-medium">
                <dt>= Equity Value</dt>
                <dd className="tabular-nums">{formatCompactCurrency(dcf.equityValue)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              {dcf.cashLikeInvestmentsIncluded ? (
                <>
                  Sourced from{" "}
                  <span className="font-mono">{latestHistorical.cashLikeInvestments?.source}</span> — treated as a
                  non-operating, cash-like asset because it&rsquo;s the company&rsquo;s treasury/capital-allocation
                  portfolio, not an asset used to run operations.
                </>
              ) : (
                "SEC XBRL doesn't reliably provide a marketable-securities figure for this company, so it's excluded here — never assumed to be zero."
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Terminal value — perpetuity growth</p>
            <p className="mt-1 text-xl font-semibold">{formatCompactCurrency(dcf.terminalValue.perpetuity)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Primary / mandatory method.</p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Terminal value — exit multiple</p>
            <p className="mt-1 text-xl font-semibold">
              {dcf.terminalValue.exitMultiple !== null ? formatCompactCurrency(dcf.terminalValue.exitMultiple) : "Not provided"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dcf.terminalValue.exitMultiple === null
                ? "Advanced cross-check — set an exit multiple on Forecast's Advanced panel to compare."
                : dcf.terminalValue.divergenceFlag
                  ? `Diverges from the perpetuity method by more than ${formatPercent(DIVERGENCE_THRESHOLD)} — treat with caution.`
                  : "Within the expected range of the perpetuity method."}
            </p>
          </div>
        </div>

        <details className="group rounded-md border border-border">
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium select-none">
            <span className="flex items-center gap-1.5">
              Advanced: WACC formula ledger
              {/* Prevent + stop propagation so opening the definition doesn't also toggle the parent <summary> (its native click-to-toggle behavior needs preventDefault, not just stopPropagation). */}
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <ConceptInfo concept="wacc" />
              </span>
            </span>
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Advanced
            </span>
          </summary>
          <div className="flex flex-col gap-2 border-t border-border bg-accent/30 p-4 text-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {waccExplanation.method === "weighted" ? "Estimated WACC (Model WACC)" : "Cost of equity, used as a WACC proxy"}
              </p>
              <WaccModeBadge waccMode={waccMode} method={waccExplanation.method} />
            </div>
            {waccExplanation.method === "weighted" ? (
              <p className="-mt-1 mb-1 text-xs text-muted-foreground">
                An estimate built from proxy inputs where a precise figure isn&rsquo;t available — see the labels
                below. Never a substitute for a sourced, company-specific WACC.
              </p>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk-free rate</span>
              <span
                className="tabular-nums"
                title={`${waccExplanation.riskFreeRate.source} — as of ${waccExplanation.riskFreeRate.asOf}`}
              >
                {formatPercent(waccExplanation.riskFreeRate.value)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Beta</span>
              <span className="text-right tabular-nums" title={waccExplanation.beta.source}>
                {waccExplanation.beta.value.toFixed(2)}
                <span className="ml-1 text-[11px] text-muted-foreground">(market-average placeholder, not company-specific)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Equity risk premium</span>
              <span className="tabular-nums" title={waccExplanation.equityRiskPremium.source}>
                {formatPercent(waccExplanation.equityRiskPremium.value)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
              <span>Cost of equity (CAPM)</span>
              <span className="tabular-nums">{formatPercent(waccExplanation.costOfEquity)}</span>
            </div>

            {waccExplanation.method === "weighted" ? (
              <>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">
                    Pre-tax cost of debt <span className="text-[11px]">(spread-based proxy)</span>
                  </span>
                  <span className="tabular-nums" title={waccExplanation.preTaxCostOfDebt?.source}>
                    {formatPercent(waccExplanation.preTaxCostOfDebt?.value ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">After-tax cost of debt</span>
                  <span className="tabular-nums">{formatPercent(waccExplanation.afterTaxCostOfDebt ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Market value of equity <span className="text-[11px]">(live price × diluted shares)</span>
                  </span>
                  <span className="tabular-nums">{formatCompactCurrency(waccExplanation.marketValueEquity ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Market value of debt <span className="text-[11px]">(book-value proxy)</span>
                  </span>
                  <span className="tabular-nums" title="No market-priced bond yield is sourced for this company's debt">
                    {formatCompactCurrency(waccExplanation.marketValueDebt ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capital structure weights (E / D)</span>
                  <span className="tabular-nums">
                    {formatPercent(waccExplanation.weightEquity ?? 0)} / {formatPercent(waccExplanation.weightDebt ?? 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border pt-2 font-medium">
                  <span>WACC = E/(D+E)×Re + D/(D+E)×Rd×(1&minus;T)</span>
                  <span className="tabular-nums">{formatPercent(assumptions.wacc)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  An estimate weighted using today&rsquo;s market value of equity (live price × diluted shares),
                  the book value of total debt as a proxy for its market value, and a spread-based proxy for the
                  cost of debt — not a sourced company bond yield.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                A weighted WACC needs the market value of equity (price × diluted shares) — the current price is
                unavailable, so cost of equity is used directly as the WACC proxy. Applied WACC:{" "}
                {formatPercent(assumptions.wacc)}
                {waccMode === "manual" ? " (edited from the default on Forecast)" : ""}.
              </p>
            )}
          </div>
        </details>
      </Reveal>
    </div>
  );
}
