import { siApple, siCaterpillar, siCocacola, siMcdonalds, siNvidia } from "simple-icons";

/**
 * Featured-company marks (Design spec §2 brief) — real brand SVG path
 * data from `simple-icons` (CC0-1.0, bundled locally, not a runtime
 * external image URL) where the brand is actually present in that
 * library; a clean monochrome monogram fallback everywhere else, per the
 * brief's own explicit instruction. `simple-icons` skews toward tech/
 * developer-tool brands, so several of the 10 Featured tickers (MSFT, HD,
 * WMT, COST, AMZN) genuinely aren't in it — confirmed by exhausting every
 * reasonable slug variant, not an oversight.
 */
export type CompanyMark = { type: "icon"; path: string; title: string } | { type: "monogram"; mark: string };

const ICONS: Record<string, { path: string; title: string }> = {
  AAPL: siApple,
  NVDA: siNvidia,
  KO: siCocacola,
  CAT: siCaterpillar,
  MCD: siMcdonalds,
};

const MONOGRAMS: Record<string, string> = {
  MSFT: "M",
  HD: "HD",
  WMT: "W",
  COST: "C",
  AMZN: "A",
};

export function getCompanyMark(ticker: string): CompanyMark {
  const key = ticker.toUpperCase();
  const icon = ICONS[key];
  if (icon) return { type: "icon", path: icon.path, title: icon.title };
  return { type: "monogram", mark: MONOGRAMS[key] ?? key.slice(0, 2) };
}
