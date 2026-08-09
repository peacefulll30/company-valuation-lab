import type { CompsCompanyInput, CompsCompanyMultiples, CompsResult } from "./results";
import { assertValidDilutedShares } from "./validate";

/**
 * EV/Revenue, EV/EBITDA, and P/E for one company (PRD FR-41). A negative or
 * zero net income makes P/E meaningless, so it's `null` rather than a
 * misleading negative multiple — never silently shown as a number.
 */
export function computeCompanyMultiples(input: CompsCompanyInput): CompsCompanyMultiples {
  const marketCap = input.price * input.dilutedShares;
  const enterpriseValue = marketCap + input.totalDebt - input.cash;

  return {
    ticker: input.ticker,
    enterpriseValue,
    evRevenue: input.revenue !== 0 ? enterpriseValue / input.revenue : null,
    evEbitda: input.ebitda !== 0 ? enterpriseValue / input.ebitda : null,
    peRatio: input.netIncome > 0 ? marketCap / input.netIncome : null,
  };
}

/**
 * Derives an implied per-share range (FR-42) from the min/max of peer
 * EV/EBITDA multiples applied to the subject's own (derived) EBITDA — a
 * simple, documented Phase 2 method; kept structurally separate from the
 * DCF range (never blended, per FR-42).
 */
function deriveImpliedRange(
  subject: CompsCompanyInput,
  peerMultiples: CompsCompanyMultiples[]
): { low: number; high: number } | null {
  const evEbitdaMultiples = peerMultiples
    .map((p) => p.evEbitda)
    .filter((m): m is number => m !== null);

  if (evEbitdaMultiples.length === 0) return null;

  assertValidDilutedShares(subject.dilutedShares);
  const netDebt = subject.totalDebt - subject.cash;

  const impliedPrice = (multiple: number) => {
    const impliedEV = multiple * subject.ebitda;
    const impliedEquityValue = impliedEV - netDebt;
    return impliedEquityValue / subject.dilutedShares;
  };

  const prices = evEbitdaMultiples.map(impliedPrice);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/** Computes multiples for the subject and its hand-curated peer set, plus the peer-implied range (FR-40/§8). */
export function computeComps(subject: CompsCompanyInput, peers: CompsCompanyInput[]): CompsResult {
  const subjectMultiples = computeCompanyMultiples(subject);
  const peerMultiples = peers.map(computeCompanyMultiples);

  return {
    subject: subjectMultiples,
    peers: peerMultiples,
    impliedRange: deriveImpliedRange(subject, peerMultiples),
  };
}
