"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { workspaceSections } from "@/lib/site-config";

type WorkspaceSidebarProps = {
  companySlug: string;
  className?: string;
  onNavigate?: () => void;
  /**
   * "full" = desktop rail with visible labels. "icon" = tablet rail
   * (Design spec §8 — "sidebar collapses to an icon rail"): the mono step
   * numeral stands in for the icon, full label stays reachable via
   * title/sr-only text rather than a hover-expand flyout — a deliberate
   * Phase 1 simplification of the spec's "(expandable)" detail.
   */
  variant?: "full" | "icon";
};

/**
 * The 9-tab left workspace rail (Design spec §3). Active state is a left
 * accent bar, never a filled pill. Numbered because this is a real guided
 * sequence, even though every step is also independently reachable.
 */
export function WorkspaceSidebar({
  companySlug,
  className,
  onNavigate,
  variant = "full",
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const isIcon = variant === "icon";

  return (
    <nav aria-label="Valuation workspace sections" className={className}>
      <ul className="flex flex-col">
        {workspaceSections.map((section) => {
          const href = `/valuation/${companySlug}/${section.slug}`;
          const isActive = pathname === href;
          return (
            <li key={section.slug}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                title={isIcon ? section.label : undefined}
                className={cn(
                  "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm outline-none",
                  "hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isIcon && "justify-center px-2",
                  isActive
                    ? "border-brand-accent font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {section.step}
                </span>
                <span className={cn(isIcon && "sr-only")}>{section.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
