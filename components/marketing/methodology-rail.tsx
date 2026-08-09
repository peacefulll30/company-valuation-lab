import { Container } from "@/components/brand/container";
import { CompactStory } from "@/components/marketing/compact-story";
import type { StageVisualKey } from "@/components/marketing/stage-visual";
import { methodologySteps, siteConfig } from "@/lib/site-config";

const VISUALS: StageVisualKey[] = ["historicals", "forecast", "dcf", "scenarios"];

/** "How the valuation is built" — all 4 stages visible at once, linked by a progress rail (Design spec §2). */
export function MethodologyRail() {
  return (
    <div>
      <CompactStory
        eyebrow="How the valuation is built"
        heading="A guided process, not a black box"
        items={methodologySteps.map((s, i) => ({ step: s.step, title: s.label, description: s.detail, visual: VISUALS[i] }))}
        showProgressPath
      />
      <Container className="pb-14 sm:pb-16">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every figure traces to a filing or a stated assumption — SEC EDGAR for financials, dated
          defaults for market inputs.
        </p>
        <p className="mt-3 max-w-2xl text-xs text-muted-foreground">{siteConfig.disclaimer}</p>
      </Container>
    </div>
  );
}
