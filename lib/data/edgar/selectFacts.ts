import { REVENUE_TAGS } from "./xbrlTags";
import type { CompanyFactsResponse, XbrlConceptFacts, XbrlFactEntry } from "./types";

const DEFAULT_MIN_ANNUAL_DAYS = 300;
const DEFAULT_MAX_ANNUAL_DAYS = 380;

function durationDays(entry: XbrlFactEntry): number {
  if (!entry.start) return NaN;
  return (new Date(entry.end).getTime() - new Date(entry.start).getTime()) / (1000 * 60 * 60 * 24);
}

/** Picks, for each duplicate `end` date, the entry from the most recently filed accession (latest restatement wins). */
function dedupeByEndPreferringLatestFiled(entries: XbrlFactEntry[]): XbrlFactEntry[] {
  const byEnd = new Map<string, XbrlFactEntry>();
  for (const entry of entries) {
    const existing = byEnd.get(entry.end);
    if (!existing || entry.filed > existing.filed) byEnd.set(entry.end, entry);
  }
  return [...byEnd.values()].sort((a, b) => b.end.localeCompare(a.end));
}

/**
 * Selects one entry per full fiscal year from a duration concept's raw
 * fact list (10-K filings tag the current year alongside several prior
 * comparative quarters/years under the same accession — this filters to
 * ~full-year spans and collapses duplicates).
 */
export function selectAnnualFacts(
  entries: XbrlFactEntry[],
  opts: { form?: string; minDays?: number; maxDays?: number } = {}
): XbrlFactEntry[] {
  const form = opts.form ?? "10-K";
  const minDays = opts.minDays ?? DEFAULT_MIN_ANNUAL_DAYS;
  const maxDays = opts.maxDays ?? DEFAULT_MAX_ANNUAL_DAYS;

  const annual = entries.filter((e) => {
    if (e.form !== form || !e.start) return false;
    const days = durationDays(e);
    return days >= minDays && days <= maxDays;
  });

  return dedupeByEndPreferringLatestFiled(annual);
}

/** Selects one entry per fiscal-year-end from a balance-sheet (instant) concept's raw fact list. */
export function selectInstantFacts(
  entries: XbrlFactEntry[],
  opts: { form?: string } = {}
): XbrlFactEntry[] {
  const form = opts.form ?? "10-K";
  const instant = entries.filter((e) => e.form === form && !e.start);
  return dedupeByEndPreferringLatestFiled(instant);
}

function conceptEntries(
  facts: Record<string, XbrlConceptFacts> | undefined,
  tag: string
): XbrlFactEntry[] {
  const concept = facts?.[tag];
  if (!concept) return [];
  // Nearly every concept used here is USD; shares use the "shares" unit.
  return Object.values(concept.units).flat();
}

/**
 * Merges a tag-priority list into one end-date → entry map: for each
 * candidate tag (in priority order), its selected annual facts fill any
 * end-date not already covered by a higher-priority tag. This is what lets
 * a filer that switches XBRL tags mid-history (e.g. a revenue tag change
 * around ASC 606 adoption) still resolve every year from one call.
 */
export function collectAnnualFactsByTagPriority(
  usGaapFacts: Record<string, XbrlConceptFacts> | undefined,
  tagPriority: string[],
  selectOpts?: { minDays?: number; maxDays?: number }
): Map<string, { entry: XbrlFactEntry; tag: string }> {
  const byEnd = new Map<string, { entry: XbrlFactEntry; tag: string }>();

  for (const tag of tagPriority) {
    const annual = selectAnnualFacts(conceptEntries(usGaapFacts, tag), selectOpts);
    for (const entry of annual) {
      if (!byEnd.has(entry.end)) byEnd.set(entry.end, { entry, tag });
    }
  }

  return byEnd;
}

/** Instant-concept counterpart of `collectAnnualFactsByTagPriority`. */
export function collectInstantFactsByTagPriority(
  usGaapFacts: Record<string, XbrlConceptFacts> | undefined,
  tagPriority: string[]
): Map<string, { entry: XbrlFactEntry; tag: string }> {
  const byEnd = new Map<string, { entry: XbrlFactEntry; tag: string }>();

  for (const tag of tagPriority) {
    const instant = selectInstantFacts(conceptEntries(usGaapFacts, tag));
    for (const entry of instant) {
      if (!byEnd.has(entry.end)) byEnd.set(entry.end, { entry, tag });
    }
  }

  return byEnd;
}

/** The most recent N distinct fiscal-year-end dates found across a company's revenue facts. */
export function selectFiscalYearEnds(companyFacts: CompanyFactsResponse, count: number): string[] {
  const revenue = collectAnnualFactsByTagPriority(companyFacts.facts["us-gaap"], REVENUE_TAGS);
  return [...revenue.keys()].sort((a, b) => b.localeCompare(a)).slice(0, count);
}
