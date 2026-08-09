import { Container } from "@/components/brand/container";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <Container className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.disclaimer}</p>
        <p className="font-mono">Company Valuation Lab</p>
      </Container>
    </footer>
  );
}
