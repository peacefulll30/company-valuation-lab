import { Container } from "@/components/brand/container";
import { FeaturedCompanies } from "@/components/valuation/featured-companies";

/** Featured Companies (Design spec §2 marketing shell) — clean, immediate, no explanatory clutter. */
export function FeaturedPreviewSection() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="featured-heading">
      <Container>
        <h2 id="featured-heading" className="font-display text-3xl font-medium sm:text-4xl">
          Featured companies
        </h2>
        <FeaturedCompanies className="mt-8" animateIn />
      </Container>
    </section>
  );
}
