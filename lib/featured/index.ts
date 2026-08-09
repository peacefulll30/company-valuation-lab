import type { CompanyWorkspaceRecord } from "@/lib/data/types";
import aapl from "@/data/featured/AAPL.json";
import msft from "@/data/featured/MSFT.json";
import nvda from "@/data/featured/NVDA.json";
import ko from "@/data/featured/KO.json";
import hd from "@/data/featured/HD.json";
import cat from "@/data/featured/CAT.json";
import wmt from "@/data/featured/WMT.json";
import cost from "@/data/featured/COST.json";
import amzn from "@/data/featured/AMZN.json";
import mcd from "@/data/featured/MCD.json";

export type { CompanyWorkspaceRecord } from "@/lib/data/types";

/**
 * Featured company data is imported directly from `/data/featured/*.json`
 * — no API route, no live fetch in this path, ever (CLAUDE.md). Static
 * imports (not `fs.readFileSync`) so Next.js can statically analyze and
 * pre-render every Featured `companySlug` via `generateStaticParams`.
 */
const FEATURED_RECORDS = [aapl, msft, nvda, ko, hd, cat, wmt, cost, amzn, mcd] as CompanyWorkspaceRecord[];

const bySlug = new Map<string, CompanyWorkspaceRecord>(
  FEATURED_RECORDS.map((record) => [record.meta.ticker.toLowerCase(), record])
);

export const featuredSlugs: string[] = FEATURED_RECORDS.map((r) => r.meta.ticker.toLowerCase());

export function getFeaturedCompany(companySlug: string): CompanyWorkspaceRecord | null {
  return bySlug.get(companySlug.toLowerCase()) ?? null;
}

export function listFeaturedCompanies(): CompanyWorkspaceRecord[] {
  return FEATURED_RECORDS;
}
