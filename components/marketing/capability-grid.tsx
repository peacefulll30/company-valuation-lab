import { ScrollStory } from "@/components/marketing/scroll-story";
import type { StageVisualKey } from "@/components/marketing/stage-visual";
import { capabilities } from "@/lib/site-config";

const VISUALS: StageVisualKey[] = ["historicals", "forecast", "dcf", "analyst"];

/** "What can this platform do?" — progressive scroll story (Design spec §2 marketing shell). */
export function CapabilityGrid() {
  return (
    <ScrollStory
      eyebrow="What can this platform do?"
      heading="Four tools, one model"
      items={capabilities.map((c, i) => ({ step: c.step, title: c.title, description: c.description, visual: VISUALS[i] }))}
    />
  );
}
