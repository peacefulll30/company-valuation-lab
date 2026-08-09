import { getCompanyMark } from "@/lib/company-brand";
import { cn } from "@/lib/utils";

/**
 * A Featured company's mark — a real, bundled brand SVG (via
 * `simple-icons`, never a runtime external image URL) where available,
 * rendered monochrome via `currentColor` (Design spec §2 brief — "keep
 * the presentation institutional and mostly monochrome"); a clean
 * monogram letterform everywhere else. Same visual slot either way, so
 * the Featured grid reads as one consistent system, not "5 real logos +
 * 5 placeholders."
 */
export function CompanyMonogram({ ticker, className }: { ticker: string; className?: string }) {
  const mark = getCompanyMark(ticker);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-foreground/80",
        "transition-colors duration-300 group-hover:border-brand-accent/40 group-hover:text-foreground",
        className
      )}
    >
      {mark.type === "icon" ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" role="img" aria-label={mark.title}>
          <path d={mark.path} />
        </svg>
      ) : (
        <span className="font-display text-sm font-medium">{mark.mark}</span>
      )}
    </span>
  );
}
