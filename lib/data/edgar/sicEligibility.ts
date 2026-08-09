/**
 * SIC-code eligibility check (CLAUDE.md — "No banks, insurers, or other
 * financial institutions in the V1 valuation engine... detected/blocked
 * via SIC-code eligibility check for any searched company"). Centralized
 * and testable in isolation so both the Featured pipeline and (later)
 * Search-tier retrieval share one blocklist — never two.
 *
 * Ranges cover the standard SIC "Finance, Insurance, and Real Estate"
 * division's financial-institution codes: depository institutions,
 * non-depository credit institutions, security/commodity brokers,
 * insurance carriers/agents, and holding & other investment offices
 * (which includes REITs, SIC 6798). Ordinary (non-REIT) real estate
 * operators (6500–6599) are deliberately NOT blocked — they aren't the
 * "financial institution" case the invariant targets. Architecture §18
 * flags this list as needing a first real review pass against edge cases
 * (e.g. diversified holding companies with financial subsidiaries); this
 * is that documented starting point, not a claim of completeness.
 */
const BLOCKED_SIC_RANGES: Array<[number, number, string]> = [
  [6000, 6099, "Depository institutions (banks)"],
  [6100, 6199, "Non-depository credit institutions"],
  [6200, 6299, "Security & commodity brokers, dealers, exchanges & services"],
  [6300, 6399, "Insurance carriers"],
  [6400, 6499, "Insurance agents, brokers & service"],
  [6700, 6799, "Holding & other investment offices (including REITs)"],
];

export type SicEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string; sicCode: string; category: string };

export function checkSicEligibility(sicCode: string): SicEligibilityResult {
  const numericSic = Number.parseInt(sicCode, 10);

  if (!Number.isFinite(numericSic)) {
    // An unparseable SIC code can't be positively cleared — but the
    // eligibility layer's job here is narrow (only ever *block* on a
    // confirmed match); an unparseable code is a data-quality issue for
    // the caller, not this check, so it is not treated as a block.
    return { eligible: true };
  }

  for (const [min, max, category] of BLOCKED_SIC_RANGES) {
    if (numericSic >= min && numericSic <= max) {
      return {
        eligible: false,
        sicCode,
        category,
        reason: `SIC code ${sicCode} (${category}) is a financial institution — excluded from the V1 valuation engine.`,
      };
    }
  }

  return { eligible: true };
}
