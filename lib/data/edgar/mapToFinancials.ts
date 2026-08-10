import type { FinancialLineItems, SourcedValue } from "@/lib/engine/types";
import {
  collectAnnualFactsByTagPriority,
  collectInstantFactsByTagPriority,
  selectFiscalYearEnds,
} from "./selectFacts";
import {
  CAPEX_TAGS,
  CASH_LIKE_INVESTMENTS_CURRENT_TAGS,
  CASH_LIKE_INVESTMENTS_NONCURRENT_TAGS,
  CASH_TAGS,
  COMMERCIAL_PAPER_TAGS,
  CURRENT_ASSETS_TAGS,
  CURRENT_LIABILITIES_TAGS,
  DA_COMPONENT_TAGS,
  DA_TAGS,
  DILUTED_SHARES_TAGS,
  EBIT_TAGS,
  INCOME_TAX_EXPENSE_TAGS,
  LONG_TERM_DEBT_CURRENT_TAGS,
  LONG_TERM_DEBT_NONCURRENT_TAGS,
  NET_INCOME_TAGS,
  OPERATING_CASH_FLOW_TAGS,
  PRETAX_INCOME_TAGS,
  REVENUE_TAGS,
  SHORT_TERM_BORROWINGS_TAGS,
} from "./xbrlTags";
import type { CompanyFactsResponse, XbrlConceptFacts } from "./types";

export type FieldProvenance = {
  field: string;
  fiscalYear: number;
  tag: string;
  form: string;
  accessionNumber: string;
  filingDate: string;
  periodEnd: string;
};

export type MapToFinancialsResult =
  | { status: "ok"; historicals: FinancialLineItems[]; provenance: FieldProvenance[] }
  | { status: "insufficient-data"; reason: string; missingFields: string[] };

type ResolvedField = { val: number; tag: string; form: string; accessionNumber: string; filingDate: string };

function resolveAnnual(
  usGaap: Record<string, XbrlConceptFacts> | undefined,
  tagPriority: string[],
  ends: string[]
): Map<string, ResolvedField> {
  const byEnd = collectAnnualFactsByTagPriority(usGaap, tagPriority);
  const resolved = new Map<string, ResolvedField>();
  for (const end of ends) {
    const hit = byEnd.get(end);
    if (hit) {
      resolved.set(end, {
        val: hit.entry.val,
        tag: hit.tag,
        form: hit.entry.form,
        accessionNumber: hit.entry.accn,
        filingDate: hit.entry.filed,
      });
    }
  }
  return resolved;
}

function resolveInstant(
  usGaap: Record<string, XbrlConceptFacts> | undefined,
  tagPriority: string[],
  ends: string[]
): Map<string, ResolvedField> {
  const byEnd = collectInstantFactsByTagPriority(usGaap, tagPriority);
  const resolved = new Map<string, ResolvedField>();
  for (const end of ends) {
    const hit = byEnd.get(end);
    if (hit) {
      resolved.set(end, {
        val: hit.entry.val,
        tag: hit.tag,
        form: hit.entry.form,
        accessionNumber: hit.entry.accn,
        filingDate: hit.entry.filed,
      });
    }
  }
  return resolved;
}

/** Sums whichever of several optional debt/component tags resolve for an end date; `null` if none do. */
function sumOptionalComponents(
  componentMaps: Map<string, ResolvedField>[],
  end: string
): { total: number; contributing: ResolvedField[] } | null {
  let total = 0;
  const contributing: ResolvedField[] = [];
  for (const map of componentMaps) {
    const hit = map.get(end);
    if (hit) {
      total += hit.val;
      contributing.push(hit);
    }
  }
  return contributing.length > 0 ? { total, contributing } : null;
}

function fiscalYearOf(periodEnd: string): number {
  return new Date(`${periodEnd}T00:00:00Z`).getUTCFullYear();
}

/**
 * Normalizes raw SEC XBRL company facts into exactly `yearsWanted`
 * `FinancialLineItems` (oldest first), or reports which required fields
 * could not be resolved rather than forcing a partial/zeroed record
 * (CLAUDE.md — "never default a missing required financial field to 0";
 * Phase 3 brief — "report it instead of forcing data").
 *
 * EBITDA is deliberately never computed here — only EBIT and D&A are
 * mapped, matching `FinancialLineItems`'s shape exactly; EBITDA only ever
 * exists via `deriveEbitda`/`deriveHistoricalMetrics` in `/lib/engine`
 * (CLAUDE.md invariant #3).
 */
export function mapToFinancials(companyFacts: CompanyFactsResponse, yearsWanted: number): MapToFinancialsResult {
  const usGaap = companyFacts.facts["us-gaap"];
  // yearsWanted + 1 endpoints: the extra oldest one is only a ΔNWC baseline, not itself a reported year.
  const allEnds = selectFiscalYearEnds(companyFacts, yearsWanted + 1);

  if (allEnds.length < yearsWanted + 1) {
    return {
      status: "insufficient-data",
      reason: `Only found ${Math.max(allEnds.length - 1, 0)} full fiscal years of revenue data (need ${yearsWanted}, plus one prior year as a working-capital baseline).`,
      missingFields: ["revenue"],
    };
  }

  const endsDescending = allEnds; // most recent first
  const wantedEnds = endsDescending.slice(0, yearsWanted).reverse(); // oldest first
  const baselineEnd = endsDescending[yearsWanted];
  const balanceSheetEnds = [baselineEnd, ...wantedEnds];

  const revenue = resolveAnnual(usGaap, REVENUE_TAGS, wantedEnds);
  const ebit = resolveAnnual(usGaap, EBIT_TAGS, wantedEnds);
  const netIncome = resolveAnnual(usGaap, NET_INCOME_TAGS, wantedEnds);
  const incomeTaxExpense = resolveAnnual(usGaap, INCOME_TAX_EXPENSE_TAGS, wantedEnds);
  const pretaxIncome = resolveAnnual(usGaap, PRETAX_INCOME_TAGS, wantedEnds);
  const operatingCashFlow = resolveAnnual(usGaap, OPERATING_CASH_FLOW_TAGS, wantedEnds);
  const capex = resolveAnnual(usGaap, CAPEX_TAGS, wantedEnds);
  const dilutedShares = resolveAnnual(usGaap, DILUTED_SHARES_TAGS, wantedEnds);

  const daPrimary = resolveAnnual(usGaap, DA_TAGS, wantedEnds);
  const daDepreciation = resolveAnnual(usGaap, [DA_COMPONENT_TAGS[0]], wantedEnds);
  const daAmortization = resolveAnnual(usGaap, [DA_COMPONENT_TAGS[1]], wantedEnds);

  const cash = resolveInstant(usGaap, CASH_TAGS, balanceSheetEnds);
  const cashLikeCurrent = resolveInstant(usGaap, CASH_LIKE_INVESTMENTS_CURRENT_TAGS, wantedEnds);
  const cashLikeNoncurrent = resolveInstant(usGaap, CASH_LIKE_INVESTMENTS_NONCURRENT_TAGS, wantedEnds);
  const ltDebtNoncurrent = resolveInstant(usGaap, LONG_TERM_DEBT_NONCURRENT_TAGS, wantedEnds);
  const ltDebtCurrent = resolveInstant(usGaap, LONG_TERM_DEBT_CURRENT_TAGS, wantedEnds);
  const commercialPaper = resolveInstant(usGaap, COMMERCIAL_PAPER_TAGS, wantedEnds);
  const shortTermBorrowings = resolveInstant(usGaap, SHORT_TERM_BORROWINGS_TAGS, wantedEnds);
  const currentAssets = resolveInstant(usGaap, CURRENT_ASSETS_TAGS, balanceSheetEnds);
  const currentLiabilities = resolveInstant(usGaap, CURRENT_LIABILITIES_TAGS, balanceSheetEnds);

  const missingFields: string[] = [];
  const provenance: FieldProvenance[] = [];
  const historicals: FinancialLineItems[] = [];

  function field(name: string, end: string, resolved: ResolvedField | undefined): SourcedValue<number> | null {
    if (!resolved) {
      missingFields.push(`${fiscalYearOf(end)}.${name}`);
      return null;
    }
    provenance.push({
      field: name,
      fiscalYear: fiscalYearOf(end),
      tag: resolved.tag,
      form: resolved.form,
      accessionNumber: resolved.accessionNumber,
      filingDate: resolved.filingDate,
      periodEnd: end,
    });
    return {
      value: resolved.val,
      source: `SEC EDGAR ${resolved.form} (${resolved.tag}, accn ${resolved.accessionNumber})`,
      asOf: end,
    };
  }

  // Net working capital per balance-sheet endpoint (baseline + each wanted year), for ΔNWC differencing.
  const nwcByEnd = new Map<string, number>();
  for (const end of balanceSheetEnds) {
    const ca = currentAssets.get(end);
    const cl = currentLiabilities.get(end);
    const cashEntry = cash.get(end);
    if (!ca || !cl || !cashEntry) {
      missingFields.push(`${fiscalYearOf(end)}.netWorkingCapitalInputs`);
      continue;
    }
    const currentDebtComponents = sumOptionalComponents([ltDebtCurrent, commercialPaper, shortTermBorrowings], end);
    const currentDebt = currentDebtComponents?.total ?? 0;
    nwcByEnd.set(end, ca.val - cashEntry.val - (cl.val - currentDebt));
  }

  for (const end of wantedEnds) {
    const fiscalYear = fiscalYearOf(end);

    const revenueValue = field("revenue", end, revenue.get(end));
    const ebitValue = field("ebit", end, ebit.get(end));
    const netIncomeValue = field("netIncome", end, netIncome.get(end));
    const ocfValue = field("operatingCashFlow", end, operatingCashFlow.get(end));
    const capexValue = field("capex", end, capex.get(end));
    const dilutedSharesValue = field("dilutedShares", end, dilutedShares.get(end));

    // D&A: primary combined tag, else the Depreciation + AmortizationOfIntangibleAssets composite.
    let daValue: SourcedValue<number> | null;
    const daHit = daPrimary.get(end);
    if (daHit) {
      daValue = field("da", end, daHit);
    } else {
      const components = sumOptionalComponents([daDepreciation, daAmortization], end);
      if (components) {
        const representative = components.contributing[0];
        const tags = components.contributing.map((c) => c.tag).join(" + ");
        provenance.push({
          field: "da",
          fiscalYear,
          tag: tags,
          form: representative.form,
          accessionNumber: representative.accessionNumber,
          filingDate: representative.filingDate,
          periodEnd: end,
        });
        daValue = {
          value: components.total,
          source: `SEC EDGAR ${representative.form} (${tags} composite)`,
          asOf: end,
        };
      } else {
        missingFields.push(`${fiscalYear}.da`);
        daValue = null;
      }
    }

    // Effective tax rate = income tax expense / pretax income.
    let taxRateValue: SourcedValue<number> | null = null;
    const taxExpenseHit = incomeTaxExpense.get(end);
    const pretaxHit = pretaxIncome.get(end);
    if (!taxExpenseHit || !pretaxHit) {
      missingFields.push(`${fiscalYear}.taxRate`);
    } else if (pretaxHit.val === 0) {
      missingFields.push(`${fiscalYear}.taxRate (pretax income is zero)`);
    } else {
      provenance.push({
        field: "taxRate",
        fiscalYear,
        tag: `${taxExpenseHit.tag} / ${pretaxHit.tag}`,
        form: taxExpenseHit.form,
        accessionNumber: taxExpenseHit.accessionNumber,
        filingDate: taxExpenseHit.filingDate,
        periodEnd: end,
      });
      taxRateValue = {
        value: taxExpenseHit.val / pretaxHit.val,
        source: `SEC EDGAR ${taxExpenseHit.form} (${taxExpenseHit.tag} / ${pretaxHit.tag})`,
        asOf: end,
      };
    }

    // Cash (already resolved as part of the balance-sheet endpoint set).
    const cashValue = field("cash", end, cash.get(end));

    // Cash-like investments (marketable securities) — deliberately
    // non-blocking: a year with no resolvable tag still succeeds, with
    // this field `null` ("excluded," not fabricated as zero holdings).
    // Never added to `missingFields`.
    let cashLikeInvestmentsValue: SourcedValue<number> | null = null;
    const cashLikeComponents = sumOptionalComponents([cashLikeCurrent, cashLikeNoncurrent], end);
    if (cashLikeComponents) {
      const representative = cashLikeComponents.contributing[0];
      const tags = cashLikeComponents.contributing.map((c) => c.tag).join(" + ");
      provenance.push({
        field: "cashLikeInvestments",
        fiscalYear,
        tag: tags,
        form: representative.form,
        accessionNumber: representative.accessionNumber,
        filingDate: representative.filingDate,
        periodEnd: end,
      });
      cashLikeInvestmentsValue = {
        value: cashLikeComponents.total,
        source: `SEC EDGAR ${representative.form} (${tags}${cashLikeComponents.contributing.length > 1 ? " composite" : ""})`,
        asOf: end,
      };
    }

    // Total debt = sum of whichever debt-instrument tags resolve; missing only if none do.
    let totalDebtValue: SourcedValue<number> | null = null;
    const debtComponents = sumOptionalComponents(
      [ltDebtNoncurrent, ltDebtCurrent, commercialPaper, shortTermBorrowings],
      end
    );
    if (!debtComponents) {
      missingFields.push(`${fiscalYear}.totalDebt`);
    } else {
      const representative = debtComponents.contributing[0];
      const tags = debtComponents.contributing.map((c) => c.tag).join(" + ");
      provenance.push({
        field: "totalDebt",
        fiscalYear,
        tag: tags,
        form: representative.form,
        accessionNumber: representative.accessionNumber,
        filingDate: representative.filingDate,
        periodEnd: end,
      });
      totalDebtValue = {
        value: debtComponents.total,
        source: `SEC EDGAR ${representative.form} (${tags} composite)`,
        asOf: end,
      };
    }

    // ΔNWC = change in modeled NWC level between this period and the prior one (locked Phase 2/3 decision).
    let deltaNWCValue: SourcedValue<number> | null = null;
    const currentNwc = nwcByEnd.get(end);
    const priorEndIndex = balanceSheetEnds.indexOf(end) - 1;
    const priorNwc = priorEndIndex >= 0 ? nwcByEnd.get(balanceSheetEnds[priorEndIndex]) : undefined;
    if (currentNwc === undefined || priorNwc === undefined) {
      missingFields.push(`${fiscalYear}.deltaNWC`);
    } else {
      const currentAssetsHit = currentAssets.get(end)!;
      provenance.push({
        field: "deltaNWC",
        fiscalYear,
        tag: "AssetsCurrent, LiabilitiesCurrent (derived Δ NWC level)",
        form: currentAssetsHit.form,
        accessionNumber: currentAssetsHit.accessionNumber,
        filingDate: currentAssetsHit.filingDate,
        periodEnd: end,
      });
      deltaNWCValue = {
        value: currentNwc - priorNwc,
        source: `SEC EDGAR 10-K (derived: Δ[(AssetsCurrent − Cash) − (LiabilitiesCurrent − current debt)])`,
        asOf: end,
      };
    }

    if (
      revenueValue &&
      ebitValue &&
      daValue &&
      taxRateValue &&
      netIncomeValue &&
      cashValue &&
      totalDebtValue &&
      dilutedSharesValue &&
      ocfValue &&
      capexValue &&
      deltaNWCValue
    ) {
      historicals.push({
        fiscalYear,
        revenue: revenueValue,
        ebit: ebitValue,
        da: daValue,
        taxRate: taxRateValue,
        netIncome: netIncomeValue,
        cash: cashValue,
        totalDebt: totalDebtValue,
        dilutedShares: dilutedSharesValue,
        operatingCashFlow: ocfValue,
        capex: capexValue,
        deltaNWC: deltaNWCValue,
        cashLikeInvestments: cashLikeInvestmentsValue,
      });
    }
  }

  if (missingFields.length > 0 || historicals.length < yearsWanted) {
    return {
      status: "insufficient-data",
      reason: `Could not resolve ${missingFields.length} required field(s) across the ${yearsWanted}-year window.`,
      missingFields,
    };
  }

  // Note: EBITDA is never computed here — only EBIT and D&A are mapped above.
  // It only ever exists via `deriveEbitda`/`deriveHistoricalMetrics` in `/lib/engine`.
  return { status: "ok", historicals, provenance };
}
