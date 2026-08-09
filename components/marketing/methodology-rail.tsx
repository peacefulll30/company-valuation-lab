import { Container } from "@/components/brand/container";
import { methodologySteps } from "@/lib/site-config";

export function MethodologyRail() {
  return (
    <section
      className="border-y border-border py-16 sm:py-20"
      aria-labelledby="methodology-heading"
    >
      <Container>
        <h2
          id="methodology-heading"
          className="font-display text-2xl font-medium sm:text-3xl"
        >
          How the valuation is built
        </h2>

        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {methodologySteps.map((s, i) => (
            <li key={s.step} className="relative pl-0">
              <div
                className="border-t border-brand-hairline pt-4"
                style={{
                  borderTopColor:
                    i === 0 ? "var(--brand-accent)" : undefined,
                }}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {s.step}
                </span>
                <h3 className="mt-1 text-sm font-medium">{s.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-10 max-w-2xl text-sm text-muted-foreground">
          Every figure traces to a filing or a stated assumption — SEC EDGAR for
          financials, dated defaults for market inputs. Nothing is shown without
          knowing where it came from.
        </p>
      </Container>
    </section>
  );
}
