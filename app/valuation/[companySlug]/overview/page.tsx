import type { Metadata } from "next";
import { OverviewTab } from "@/components/valuation/tabs/overview-tab";

export const metadata: Metadata = { title: "Overview — Company Valuation Lab" };

export default function OverviewPage() {
  return <OverviewTab />;
}
