import type { Metadata } from "next";
import { ScenariosTab } from "@/components/valuation/tabs/scenarios-tab";

export const metadata: Metadata = { title: "Scenarios — Company Valuation Lab" };

export default function ScenariosPage() {
  return <ScenariosTab />;
}
