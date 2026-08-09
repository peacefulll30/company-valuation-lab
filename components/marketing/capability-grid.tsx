import { CompactStory } from "@/components/marketing/compact-story";
import type { StageVisualKey } from "@/components/marketing/stage-visual";
import { capabilities } from "@/lib/site-config";

const VISUALS: StageVisualKey[] = ["historicals", "forecast", "dcf", "analyst"];

/** "What can this platform do?" — all 4 tools visible at once (Design spec §2 marketing shell). */
export function CapabilityGrid() {
  return (
    <CompactStory
      eyebrow="What can this platform do?"
      heading="Four tools, one model"
      items={capabilities.map((c, i) => ({ step: c.step, title: c.title, description: c.description, visual: VISUALS[i] }))}
    />
  );
}
