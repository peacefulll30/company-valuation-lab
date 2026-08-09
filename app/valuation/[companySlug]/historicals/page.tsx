import type { Metadata } from "next";
import { HistoricalsTab } from "@/components/valuation/tabs/historicals-tab";

export const metadata: Metadata = { title: "Historical Financials — Company Valuation Lab" };

export default function HistoricalsPage() {
  return <HistoricalsTab />;
}
