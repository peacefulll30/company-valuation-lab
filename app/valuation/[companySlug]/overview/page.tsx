import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Overview — Company Valuation Lab" };

export default function OverviewPage() {
  return <WorkspaceJourney initialSlug="overview" />;
}
