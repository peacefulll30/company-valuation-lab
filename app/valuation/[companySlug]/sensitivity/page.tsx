import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "Sensitivity — Company Valuation Lab" };

export default function SensitivityPage() {
  return <WorkspaceJourney initialSlug="sensitivity" />;
}
