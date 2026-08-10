/**
 * us-gaap XBRL concept tags per `FinancialLineItems` field, in fallback
 * priority order. Real filers don't all tag the same concept identically
 * (e.g. Microsoft/Alphabet break D&A into `Depreciation` +
 * `AmortizationOfIntangibleAssets` rather than a single combined tag), so
 * every concept here is a priority list, not a single tag — calibrated
 * against live SEC EDGAR data for the 10 Featured tickers (AAPL, MSFT,
 * GOOGL, NVDA, KO, NKE, HD, CAT, WMT, COST) before being locked in.
 *
 * `capexPctRevenue`/`daPctRevenue`/etc. from the engine's Assumptions are
 * unrelated to this file — this only maps *historical* filed data.
 */

/** Duration (income statement / cash flow) concepts. */
export const REVENUE_TAGS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "Revenues",
];

export const EBIT_TAGS = ["OperatingIncomeLoss"];

/**
 * Primary: a single combined D&A tag. Fallback: sum of the two components
 * some filers (e.g. MSFT, GOOGL) report separately — `DA_COMPONENT_TAGS`
 * below, summed by `mapToFinancials.ts` when the primary list resolves
 * nothing for a given year.
 */
export const DA_TAGS = [
  "DepreciationDepletionAndAmortization",
  "DepreciationAmortizationAndAccretionNet",
  "DepreciationAndAmortization",
];
export const DA_COMPONENT_TAGS = ["Depreciation", "AmortizationOfIntangibleAssets"];

/**
 * `ProfitLoss` (total income including noncontrolling interest) is the
 * fallback for filers whose 10-K income statement tags that concept
 * instead of `NetIncomeLoss` directly (observed live for CAT) — confirmed
 * against CAT's proxy-statement-reported `NetIncomeLoss` figures, which
 * differ from `ProfitLoss` only by the small noncontrolling-interest
 * portion, so `ProfitLoss` is the correct "as reported on the 10-K" figure
 * in that case, not an approximation.
 */
export const NET_INCOME_TAGS = ["NetIncomeLoss", "ProfitLoss"];

export const INCOME_TAX_EXPENSE_TAGS = ["IncomeTaxExpenseBenefit"];
export const PRETAX_INCOME_TAGS = [
  "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
  "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
  "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic",
];

export const OPERATING_CASH_FLOW_TAGS = [
  "NetCashProvidedByUsedInOperatingActivities",
  "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
];

export const CAPEX_TAGS = [
  "PaymentsToAcquirePropertyPlantAndEquipment",
  "PaymentsForCapitalImprovements",
  "PaymentsToAcquireProductiveAssets",
];

export const DILUTED_SHARES_TAGS = ["WeightedAverageNumberOfDilutedSharesOutstanding"];

/** Instant (balance sheet) concepts. */
export const CASH_TAGS = [
  "CashAndCashEquivalentsAtCarryingValue",
  "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
];

/**
 * Total Debt is composited from whichever of these instant concepts a
 * filer actually reports for a given period end — there is no single
 * universal "Total Debt" tag in us-gaap. A sub-component that resolves to
 * "no tag found" contributes 0 (the company legitimately doesn't carry
 * that debt instrument); Total Debt is only marked missing if *none* of
 * these resolve for a period (see mapToFinancials.ts).
 */
export const LONG_TERM_DEBT_NONCURRENT_TAGS = ["LongTermDebtNoncurrent", "LongTermDebt"];
export const LONG_TERM_DEBT_CURRENT_TAGS = ["LongTermDebtCurrent", "DebtCurrent"];
export const COMMERCIAL_PAPER_TAGS = ["CommercialPaper"];
export const SHORT_TERM_BORROWINGS_TAGS = ["ShortTermBorrowings"];

/** Used only to derive ΔNWC via balance-sheet differencing (see mapToFinancials.ts). */
export const CURRENT_ASSETS_TAGS = ["AssetsCurrent"];
export const CURRENT_LIABILITIES_TAGS = ["LiabilitiesCurrent"];

/**
 * Marketable securities / cash-like investments — genuinely optional
 * (`mapToFinancials.ts` never fails a year for missing these, unlike every
 * other instant concept above). No single tag covers every filer:
 * calibrated against live SEC EDGAR data for the 10 Featured tickers.
 * `MarketableSecuritiesCurrent`/`Noncurrent` is what AAPL/AMZN/KO/NVDA use;
 * `ShortTermInvestments`/`LongTermInvestments` is what CAT/COST/MCD/MSFT
 * use; `AvailableForSaleSecuritiesCurrent` is HD's. A filer using none of
 * these (confirmed live for WMT) legitimately has no reliably-mappable
 * cash-like investments figure — not a mapping gap to keep chasing.
 */
export const CASH_LIKE_INVESTMENTS_CURRENT_TAGS = [
  "MarketableSecuritiesCurrent",
  "ShortTermInvestments",
  "AvailableForSaleSecuritiesCurrent",
];
export const CASH_LIKE_INVESTMENTS_NONCURRENT_TAGS = [
  "MarketableSecuritiesNoncurrent",
  "LongTermInvestments",
  "AvailableForSaleSecuritiesNoncurrent",
];
