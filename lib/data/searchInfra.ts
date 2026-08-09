import { createEdgarClient, type EdgarClient } from "./edgar";
import { createInMemoryCache, type DataCache } from "./cache";

/**
 * Process-wide singletons for the live Search tier (Phase 5 brief item 7 —
 * "keep it simple; use in-memory/server caching if sufficient for V1
 * unless Redis is truly required now"). Shared by the `/api/search` route
 * and the workspace layout's own on-demand resolution, so a company that
 * was just searched doesn't trigger a second round-trip to SEC EDGAR when
 * its workspace page renders immediately after.
 *
 * Server-only by construction: nothing in this module is imported from any
 * "use client" file. Not shared across serverless instances/regions — an
 * explicit, documented limitation (see the Phase 5 report), not an oversight;
 * swap for Upstash Redis (Architecture §10) if that stops being good enough.
 */
let sharedClient: EdgarClient | undefined;
let sharedCache: DataCache | undefined;

export function getSearchEdgarClient(): EdgarClient {
  if (!sharedClient) sharedClient = createEdgarClient();
  return sharedClient;
}

export function getSearchCache(): DataCache {
  if (!sharedCache) sharedCache = createInMemoryCache();
  return sharedCache;
}
