import Link from "next/link";
import { Container } from "@/components/brand/container";

/** Shared top bar for the Company Selection page and the workspace shell (Design spec §3). */
export function AppTopBar() {
  return (
    <header className="border-b border-border">
      <Container className="flex h-14 items-center justify-between">
        <Link
          href="/"
          className="rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Company Valuation <span className="font-display italic">Lab</span>
        </Link>
        <Link
          href="/valuation"
          className="rounded-sm font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Featured
        </Link>
      </Container>
    </header>
  );
}
