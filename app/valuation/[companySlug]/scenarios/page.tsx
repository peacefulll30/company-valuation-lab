import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Scenarios — Company Valuation Lab" };

export default function ScenariosPage() {
  return <WorkspaceJourney initialSlug="scenarios" />;
}
