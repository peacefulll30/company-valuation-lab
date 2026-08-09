import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Historical Financials — Company Valuation Lab" };

export default function HistoricalsPage() {
  return <WorkspaceJourney initialSlug="historicals" />;
}
