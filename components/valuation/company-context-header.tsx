import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/brand/container";

type CompanyContextHeaderProps = {
  companySlug: string;
  /** Real resolved data — omit to render the honest "not yet resolved" placeholder (e.g. Phase 1 shell). */
  data?: { ticker: string; name: string; tier: "featured" | "searched" };
};

/**
 * Persistent company context header (Design spec §3): ticker, name, tier
 * badge, price + as-of — visible from every workspace tab. Current price
 * stays honestly "unavailable" even for resolved companies — no clean,
 * stable, keyless price source was available this phase (CLAUDE.md — never
 * fabricate a sourced value; price is not required for the DCF math).
 */
export function CompanyContextHeader({ companySlug, data }: CompanyContextHeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium tracking-wide uppercase">
            {data?.ticker ?? companySlug}
          </span>
          {data ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{data.name}</span>
              <Badge variant="secondary" className="font-mono text-[10px] tracking-wide uppercase">
                {data.tier === "featured" ? "Featured" : "Searched"}
              </Badge>
            </>
          ) : (
            <Badge variant="outline" className="font-mono text-[10px] tracking-wide uppercase">
              Not yet resolved
            </Badge>
          )}
        </div>
        <p className="font-mono text-xs text-muted-foreground">Price unavailable</p>
      </Container>
    </div>
  );
}
