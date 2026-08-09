import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Valuation Summary — Company Valuation Lab" };

export default function SummaryPage() {
  return <WorkspaceJourney initialSlug="summary" />;
}
