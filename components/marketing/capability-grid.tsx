import { BarChart3, LineChart, Gauge, Sparkles } from "lucide-react";
import { Container } from "@/components/brand/container";
import { capabilities } from "@/lib/site-config";

const icons = [BarChart3, LineChart, Gauge, Sparkles];

export function CapabilityGrid() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="capabilities-heading">
      <Container>
        <h2
          id="capabilities-heading"
          className="font-display text-2xl font-medium sm:text-3xl"
        >
          What can this platform do?
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability, i) => {
            const Icon = icons[i];
            return (
              <div key={capability.title} className="bg-card p-5">
                <Icon className="size-4 text-brand-accent" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-medium">{capability.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
