import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Trading Comps — Company Valuation Lab" };

export default function CompsPage() {
  return <WorkspaceJourney initialSlug="comps" />;
}
