import type { Metadata } from "next";
import { SummaryTab } from "@/components/valuation/tabs/summary-tab";

export const metadata: Metadata = { title: "Valuation Summary — Company Valuation Lab" };

export default function SummaryPage() {
  return <SummaryTab />;
}
