import Link from "next/link";
import { Container } from "@/components/brand/container";
import { FeaturedCompanies } from "@/components/valuation/featured-companies";

export function FeaturedPreviewSection() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="featured-heading">
      <Container>
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="featured-heading"
            className="font-display text-2xl font-medium sm:text-3xl"
          >
            Featured companies
          </h2>
          <Link
            href="/valuation"
            className="rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse all &rarr;
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A small set of companies verified by hand to always produce a complete,
          correct analysis. Every other public operating company can be searched —
          on a best-effort basis.
        </p>
        <FeaturedCompanies variant="preview" className="mt-6" />
      </Container>
    </section>
  );
}
