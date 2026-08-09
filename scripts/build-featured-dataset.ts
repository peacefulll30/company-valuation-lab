/**
 * Offline Featured-company dataset builder (Architecture §4/§13, Phase 3
 * brief item 8). Fetches live SEC EDGAR data for the V1 Featured ticker
 * list, normalizes it through the shared `resolveCompany` pipeline (the
 * same pipeline Search-tier retrieval will use), and commits one validated
 * JSON record per successfully-normalized company to `/data/featured/`.
 *
 * Run with: `npm run build:featured`
 *
 * A ticker that can't be normalized reliably is reported and skipped —
 * never forced with a partial/zeroed record (CLAUDE.md; Phase 3 brief).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { featuredCompanyRecordSchema } from "@/lib/schemas";
import { createEdgarClient } from "@/lib/data/edgar";
import { resolveCompany } from "@/lib/data/resolveCompany";

// GOOGL and NKE were dropped after Phase 3: GOOGL is missing a diluted-shares
// tag for FY2021 in EDGAR's feed, and NKE's 10-K has no OperatingIncomeLoss
// (or equivalent) tag at all. Both would require reconstructing a required
// field from an unvalidated assumption — reported as failures instead
// (Phase 3 brief), replaced here with AMZN and MCD per the Phase 4 decision.
const FEATURED_TICKERS = ["AAPL", "MSFT", "NVDA", "KO", "HD", "CAT", "WMT", "COST", "AMZN", "MCD"];

const OUTPUT_DIR = path.resolve(process.cwd(), "data", "featured");

async function main() {
  const client = createEdgarClient();
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const succeeded: string[] = [];
  const failed: { ticker: string; status: string; reason: string }[] = [];

  for (const ticker of FEATURED_TICKERS) {
    process.stdout.write(`Resolving ${ticker}... `);
    try {
      const result = await resolveCompany(client, ticker, { tier: "featured" });

      if (result.status !== "success") {
        console.log(`${result.status.toUpperCase()} — ${result.reason}`);
        failed.push({ ticker, status: result.status, reason: result.reason });
        continue;
      }

      const record = {
        meta: result.meta,
        financials: result.financials,
        provenance: result.provenance,
        generatedAt: new Date().toISOString(),
      };

      const parsed = featuredCompanyRecordSchema.safeParse(record);
      if (!parsed.success) {
        console.log(`INSUFFICIENT-DATA — committed-record schema validation failed: ${parsed.error.message}`);
        failed.push({ ticker, status: "insufficient-data", reason: parsed.error.message });
        continue;
      }

      const outputPath = path.join(OUTPUT_DIR, `${ticker}.json`);
      writeFileSync(outputPath, `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");
      console.log(`OK — wrote ${path.relative(process.cwd(), outputPath)}`);
      succeeded.push(ticker);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`ERROR — ${reason}`);
      failed.push({ ticker, status: "error", reason });
    }
  }

  console.log("\n--- Featured dataset build summary ---");
  console.log(`Succeeded (${succeeded.length}/${FEATURED_TICKERS.length}): ${succeeded.join(", ") || "none"}`);
  if (failed.length > 0) {
    console.log(`Failed (${failed.length}/${FEATURED_TICKERS.length}):`);
    for (const f of failed) {
      console.log(`  - ${f.ticker} [${f.status}]: ${f.reason}`);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error building Featured dataset:", error);
  process.exitCode = 1;
});
