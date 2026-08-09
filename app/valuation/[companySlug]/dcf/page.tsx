import type { Metadata } from "next";
import { WorkspaceJourney } from "@/components/valuation/workspace-journey";

export const metadata: Metadata = { title: "DCF — Company Valuation Lab" };

export default function DcfPage() {
  return <WorkspaceJourney initialSlug="dcf" />;
}
