import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "AI Analyst — Company Valuation Lab" };

export default function AnalystPage() {
  return <WorkspaceJourney initialSlug="analyst" />;
}
