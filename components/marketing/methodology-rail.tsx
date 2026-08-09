import { Container } from "@/components/brand/container";
import { ScrollStory } from "@/components/marketing/scroll-story";
import { methodologySteps, siteConfig } from "@/lib/site-config";

/** "How the valuation is built" — progressive scroll story (Design spec §2 marketing shell), a guided process rather than a static table. */
export function MethodologyRail() {
  return (
    <div>
      <ScrollStory
        eyebrow="How the valuation is built"
        heading="A guided process, not a black box"
        items={methodologySteps.map((s) => ({ step: s.step, title: s.label, description: s.detail }))}
      />
      <Container className="pb-16 sm:pb-20">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every figure traces to a filing or a stated assumption — SEC EDGAR for financials, dated
          defaults for market inputs.
        </p>
        <p className="mt-3 max-w-2xl text-xs text-muted-foreground">{siteConfig.disclaimer}</p>
      </Container>
    </div>
  );
}
