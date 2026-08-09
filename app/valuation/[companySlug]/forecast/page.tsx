import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Forecast — Company Valuation Lab" };

export default function ForecastPage() {
  return <WorkspaceJourney initialSlug="forecast" />;
}
