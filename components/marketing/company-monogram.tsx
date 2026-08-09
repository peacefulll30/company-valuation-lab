import { getCompanyBrand } from "@/lib/company-brand";
import { cn } from "@/lib/utils";

/**
 * A clean, original monogram mark for a Featured company — see the Design
 * spec's "Company monogram note" for why this isn't a reproduced logo.
 */
export function CompanyMonogram({ ticker, className }: { ticker: string; className?: string }) {
  const { mark, hue } = getCompanyBrand(ticker);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border font-display text-sm font-medium",
        className
      )}
      style={{
        color: hue,
        borderColor: `color-mix(in srgb, ${hue} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${hue} 12%, transparent)`,
      }}
    >
      {mark}
    </span>
  );
}
