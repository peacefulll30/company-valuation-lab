import type { CompanyFactsResponse, XbrlConceptFacts, XbrlFactEntry } from "@/lib/data/edgar/types";

/**
 * A synthetic 6-year (2019 baseline + 2020-2024 reported) company facts
 * fixture with clean, hand-verifiable numbers — used across the data-layer
 * test suite instead of hitting live SEC EDGAR. Revenue grows 1000→1400,
 * a flat 20% effective tax rate, and a constant -10/year ΔNWC (working
 * capital release) by construction, so expected values can be computed
 * by hand rather than independently re-implementing the normalizer.
 */

function durationEntry(
  year: number,
  val: number,
  opts: { form?: string; filed?: string; accn?: string } = {}
): XbrlFactEntry {
  const fy = year + 1; // mimics a 10-K filed the following year, like real EDGAR data
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    val,
    accn: opts.accn ?? `0000000000-${fy}-000001`,
    fy,
    fp: "FY",
    form: opts.form ?? "10-K",
    filed: opts.filed ?? `${fy}-02-15`,
  };
}

function instantEntry(
  year: number,
  val: number,
  opts: { form?: string; filed?: string; accn?: string } = {}
): XbrlFactEntry {
  const fy = year + 1;
  return {
    end: `${year}-12-31`,
    val,
    accn: opts.accn ?? `0000000000-${fy}-000001`,
    fy,
    fp: "FY",
    form: opts.form ?? "10-K",
    filed: opts.filed ?? `${fy}-02-15`,
  };
}

function concept(entries: XbrlFactEntry[], unit: "USD" | "shares" = "USD"): XbrlConceptFacts {
  return { units: { [unit]: entries } };
}

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];
const REVENUE = { 2019: 900, 2020: 1000, 2021: 1100, 2022: 1200, 2023: 1300, 2024: 1400 };
const EBIT = { 2020: 200, 2021: 220, 2022: 240, 2023: 260, 2024: 280 };
const DA = { 2020: 50, 2021: 55, 2022: 60, 2023: 65, 2024: 70 };
// Flat 20% effective tax rate: pretax income == EBIT (no non-operating items in this fixture).
const TAX_EXPENSE = { 2020: 40, 2021: 44, 2022: 48, 2023: 52, 2024: 56 };
const NET_INCOME = { 2020: 160, 2021: 176, 2022: 192, 2023: 208, 2024: 224 };
const OCF = { 2020: 210, 2021: 230, 2022: 250, 2023: 270, 2024: 290 };
const CAPEX = { 2020: 60, 2021: 65, 2022: 70, 2023: 75, 2024: 80 };
const DILUTED_SHARES = { 2020: 100, 2021: 100, 2022: 100, 2023: 100, 2024: 100 };

const CASH = { 2019: 300, 2020: 320, 2021: 340, 2022: 360, 2023: 380, 2024: 400 };
const LT_DEBT = { 2019: 500, 2020: 510, 2021: 520, 2022: 530, 2023: 540, 2024: 550 };
const CURRENT_ASSETS = { 2019: 800, 2020: 820, 2021: 840, 2022: 860, 2023: 880, 2024: 900 };
const CURRENT_LIABILITIES = { 2019: 400, 2020: 410, 2021: 420, 2022: 430, 2023: 440, 2024: 450 };

/** Expected ΔNWC per year, derived by hand from the balance sheet numbers above: constant -10/year. */
export const EXPECTED_DELTA_NWC = -10;
export const EXPECTED_TAX_RATE = 0.2;
export const WANTED_YEARS = [2020, 2021, 2022, 2023, 2024];

export function buildCompanyFacts(
  overrides: Partial<Record<string, XbrlConceptFacts>> = {}
): CompanyFactsResponse {
  const usGaap: Record<string, XbrlConceptFacts> = {
    RevenueFromContractWithCustomerExcludingAssessedTax: concept(
      YEARS.map((y) => durationEntry(y, REVENUE[y as keyof typeof REVENUE]))
    ),
    OperatingIncomeLoss: concept(
      Object.entries(EBIT).map(([y, v]) => durationEntry(Number(y), v))
    ),
    DepreciationDepletionAndAmortization: concept(
      Object.entries(DA).map(([y, v]) => durationEntry(Number(y), v))
    ),
    IncomeTaxExpenseBenefit: concept(
      Object.entries(TAX_EXPENSE).map(([y, v]) => durationEntry(Number(y), v))
    ),
    IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest: concept(
      Object.entries(EBIT).map(([y, v]) => durationEntry(Number(y), v)) // pretax == EBIT in this fixture
    ),
    NetIncomeLoss: concept(Object.entries(NET_INCOME).map(([y, v]) => durationEntry(Number(y), v))),
    NetCashProvidedByUsedInOperatingActivities: concept(
      Object.entries(OCF).map(([y, v]) => durationEntry(Number(y), v))
    ),
    PaymentsToAcquirePropertyPlantAndEquipment: concept(
      Object.entries(CAPEX).map(([y, v]) => durationEntry(Number(y), v))
    ),
    WeightedAverageNumberOfDilutedSharesOutstanding: concept(
      Object.entries(DILUTED_SHARES).map(([y, v]) => durationEntry(Number(y), v)),
      "shares"
    ),
    CashAndCashEquivalentsAtCarryingValue: concept(
      Object.entries(CASH).map(([y, v]) => instantEntry(Number(y), v))
    ),
    LongTermDebtNoncurrent: concept(Object.entries(LT_DEBT).map(([y, v]) => instantEntry(Number(y), v))),
    AssetsCurrent: concept(Object.entries(CURRENT_ASSETS).map(([y, v]) => instantEntry(Number(y), v))),
    LiabilitiesCurrent: concept(
      Object.entries(CURRENT_LIABILITIES).map(([y, v]) => instantEntry(Number(y), v))
    ),
    ...overrides,
  };

  return {
    cik: 1234567,
    entityName: "Test Corp",
    facts: { "us-gaap": usGaap },
  };
}
