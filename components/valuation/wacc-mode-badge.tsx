import { Badge } from "@/components/ui/badge";
import { waccModeLabel } from "@/lib/featured/waccMode";
import type { WaccMode } from "@/lib/featured/ValuationWorkspaceContext";
import type { WaccExplanation } from "@/lib/featured/defaultAssumptions";

/**
 * "AUTO — Estimated WACC" / "AUTO — CAPM proxy (no live price)" / "MANUAL —
 * User assumption" — the single indicator of which regime WACC is in,
 * shared between Forecast's input and DCF's Advanced ledger so the two
 * never drift out of sync. Text-labeled, not color-only (a11y).
 */
export function WaccModeBadge({ waccMode, method }: { waccMode: WaccMode; method: WaccExplanation["method"] }) {
  return (
    <Badge
      variant={waccMode === "manual" ? "outline" : "secondary"}
      className="text-[10px] font-medium tracking-wide uppercase"
    >
      {waccModeLabel(waccMode, method)}
    </Badge>
  );
}
