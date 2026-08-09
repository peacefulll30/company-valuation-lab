import Link from "next/link";
import { Container } from "@/components/brand/container";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="rounded-sm text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Company Valuation{" "}
          <span className="font-display italic">Lab</span>
        </Link>
        <Link
          href="/valuation"
          className="rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Start Valuation
        </Link>
      </Container>
    </header>
  );
}
