import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { CapabilityGrid } from "@/components/marketing/capability-grid";
import { MethodologyRail } from "@/components/marketing/methodology-rail";
import { FeaturedPreviewSection } from "@/components/marketing/featured-preview-section";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
        <CapabilityGrid />
        <MethodologyRail />
        <FeaturedPreviewSection />
      </main>
      <SiteFooter />
    </div>
  );
}
