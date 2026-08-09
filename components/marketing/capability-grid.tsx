import { ScrollStory } from "@/components/marketing/scroll-story";
import { capabilities } from "@/lib/site-config";

/** "What can this platform do?" — progressive scroll story (Design spec §2 marketing shell). */
export function CapabilityGrid() {
  return (
    <ScrollStory
      eyebrow="What can this platform do?"
      heading="Four tools, one model"
      items={capabilities.map((c) => ({ step: c.step, title: c.title, description: c.description }))}
    />
  );
}
