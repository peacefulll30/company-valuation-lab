import type { Metadata } from "next";
import { CompsTab } from "@/components/valuation/tabs/comps-tab";

export const metadata: Metadata = { title: "Trading Comps — Company Valuation Lab" };

export default function CompsPage() {
  return <CompsTab />;
}
