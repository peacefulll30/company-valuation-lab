import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { CapabilityGrid } from "@/components/marketing/capability-grid";
import { MethodologyRail } from "@/components/marketing/methodology-rail";
import { FeaturedPreviewSection } from "@/components/marketing/featured-preview-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Landing page — the dark, cinematic marketing shell (Design spec §2).
 * `.dark` is scoped to this page only via the wrapper below; the in-app
 * workspace (`/valuation/[companySlug]/*`) is untouched and stays on the
 * Paper/Ink system.
 */
export default function Home() {
  return (
    <div className="dark flex min-h-full flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
        <CapabilityGrid />
        <MethodologyRail />
        <FeaturedPreviewSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
