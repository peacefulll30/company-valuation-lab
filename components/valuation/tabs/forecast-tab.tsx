"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { AssumptionInput } from "@/components/valuation/assumption-input";
import { WaccModeBadge } from "@/components/valuation/wacc-mode-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HistoricalVsForecastChart } from "@/components/charts/historical-vs-forecast-chart";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { Reveal } from "@/components/valuation/reveal";
import { FORECAST_YEARS } from "@/lib/engine";
import { formatPercent } from "@/lib/format";

export function ForecastTab() {
  const {
    record,
    assumptions,
    setAssumptions,
    resetAssumptions,
    isDefault,
    waccExplanation,
    waccMode,
    setManualWacc,
    taxRateExplanation,
    modelState,
    modelError,
  } = useValuationWorkspace();

  const historicalPoints = record.financials.historicals.map((h) => ({
    year: h.fiscalYear,
    revenue: h.revenue.value,
    isForecast: false,
  }));
  const forecastPoints =
    modelState?.dcf.forecastYears.map((y) => ({
      year: record.financials.historicals[record.financials.historicals.length - 1].fiscalYear + y.year,
      revenue: y.revenue,
      isForecast: true,
    })) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">03 — Forecast</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Forecast</h1>
            <ConceptInfo concept="forecast" />
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Five mandatory assumptions drive a {FORECAST_YEARS}-year forecast. Every downstream tab
            recomputes as you edit.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={resetAssumptions} disabled={isDefault}>
          Reset to defaults
        </Button>
      </div>

      {modelError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="font-medium">Can&apos;t compute a valuation with these assumptions.</p>
          <p className="mt-1">{modelError}</p>
        </div>
      ) : null}

      <Reveal delay={0.1} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <AssumptionInput
            label="Revenue growth"
            value={assumptions.revenueGrowth}
            onChange={(v) => setAssumptions((prev) => ({ ...prev, revenueGrowth: v }))}
            min={-0.2}
            max={0.4}
            sourceTag={`Default: ${record.meta.ticker}'s own trailing 4-year average (derived from filed history)`}
          />
          <AssumptionInput
            label="EBITDA margin"
            value={assumptions.ebitdaMargin}
            onChange={(v) => setAssumptions((prev) => ({ ...prev, ebitdaMargin: v }))}
            min={-0.2}
            max={0.7}
            sourceTag={`Default: ${record.meta.ticker}'s most recent historical EBITDA margin, held flat`}
          />
          <AssumptionInput
            label="Tax rate"
            value={assumptions.taxRate}
            onChange={(v) => setAssumptions((prev) => ({ ...prev, taxRate: v }))}
            min={0}
            max={0.5}
            sourceTag={`Default: median of the last ${taxRateExplanation.yearsUsed} years' effective tax rate, normalized — robust to a one-off year, not the single most recent rate projected forever (that was ${formatPercent(taxRateExplanation.latestEffective.value)} in FY${record.financials.historicals[record.financials.historicals.length - 1].fiscalYear}). Edit freely.`}
          />
          <AssumptionInput
            label="WACC"
            value={assumptions.wacc}
            onChange={(v) => setManualWacc(v)}
            min={0.02}
            max={0.2}
            sourceTag={
              waccMode === "manual"
                ? "Your own assumption — a market price refresh will not overwrite this. Reset to defaults to return to AUTO."
                : waccExplanation.method === "weighted"
                  ? `Default: Estimated WACC — E/(D+E)×cost of equity + D/(D+E)×after-tax cost of debt, using today's market value of equity (live price × diluted shares) and proxy inputs for debt — see the Advanced ledger on DCF for exactly which. Recomputes automatically on price refresh.`
                  : `Default: cost of equity proxy — risk-free ${formatPercent(waccExplanation.riskFreeRate.value)} (${waccExplanation.riskFreeRate.source}, ${waccExplanation.riskFreeRate.asOf}) + beta ${waccExplanation.beta.value.toFixed(1)} × ERP ${formatPercent(waccExplanation.equityRiskPremium.value)} — a live price is needed to weight in debt; see the Advanced ledger on DCF`
            }
            concept="wacc"
            badge={<WaccModeBadge waccMode={waccMode} method={waccExplanation.method} />}
          />
          <AssumptionInput
            label="Terminal growth"
            value={assumptions.terminalGrowth}
            onChange={(v) => setAssumptions((prev) => ({ ...prev, terminalGrowth: v }))}
            min={0}
            max={0.06}
            sourceTag="Default: illustrative long-run nominal GDP growth proxy — see market-assumptions.json"
          />

          <details className="group rounded-md border border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium select-none">
              <span>
                Advanced: margin trajectory, CapEx &amp; working capital, mid-year discounting
              </span>
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Advanced
              </span>
            </summary>
            <div className="flex flex-col gap-4 border-t border-border bg-accent/30 p-4">
              <p className="text-xs text-muted-foreground">
                Each driver below feeds straight into UFCF (see the DCF tab&rsquo;s bridge table): D&amp;A is added
                back to NOPAT, CapEx and ΔNWC are subtracted — <span className="font-mono">UFCF = NOPAT + D&amp;A
                &minus; CapEx &minus; ΔNWC</span>.
              </p>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">D&amp;A (% of revenue)</span>
                <Input
                  type="number"
                  step={0.1}
                  inputMode="decimal"
                  value={assumptions.advanced?.daPctRevenue !== undefined ? (assumptions.advanced.daPctRevenue * 100).toFixed(1) : ""}
                  placeholder="Default: base-year ratio"
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value);
                    setAssumptions((prev) => ({
                      ...prev,
                      advanced: { ...prev.advanced, daPctRevenue: Number.isFinite(v) ? v / 100 : undefined },
                    }));
                  }}
                  className="h-8 w-32 text-sm tabular-nums"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">CapEx (% of revenue)</span>
                <Input
                  type="number"
                  step={0.1}
                  inputMode="decimal"
                  value={assumptions.advanced?.capexPctRevenue !== undefined ? (assumptions.advanced.capexPctRevenue * 100).toFixed(1) : ""}
                  placeholder="Default: base-year ratio"
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value);
                    setAssumptions((prev) => ({
                      ...prev,
                      advanced: { ...prev.advanced, capexPctRevenue: Number.isFinite(v) ? v / 100 : undefined },
                    }));
                  }}
                  className="h-8 w-32 text-sm tabular-nums"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Net working capital (% of revenue)</span>
                <Input
                  type="number"
                  step={0.1}
                  inputMode="decimal"
                  value={assumptions.advanced?.nwcPctRevenue !== undefined ? (assumptions.advanced.nwcPctRevenue * 100).toFixed(1) : ""}
                  placeholder="Default: 5-year historical average of ΔNWC/revenue"
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value);
                    setAssumptions((prev) => ({
                      ...prev,
                      advanced: { ...prev.advanced, nwcPctRevenue: Number.isFinite(v) ? v / 100 : undefined },
                    }));
                  }}
                  className="h-8 w-32 text-sm tabular-nums"
                />
                <span className="text-xs text-muted-foreground">
                  Modeled as a working-capital level; ΔNWC each forecast year is the change in that level.
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={assumptions.advanced?.midYearConvention ?? false}
                  onChange={(e) =>
                    setAssumptions((prev) => ({
                      ...prev,
                      advanced: { ...prev.advanced, midYearConvention: e.target.checked },
                    }))
                  }
                  className="size-4 rounded-sm border-border"
                />
                <span>Use mid-year discounting convention</span>
              </label>
            </div>
          </details>
        </div>

        <div>
          <HistoricalVsForecastChart data={[...historicalPoints, ...forecastPoints]} />
        </div>
      </Reveal>
    </div>
  );
}
