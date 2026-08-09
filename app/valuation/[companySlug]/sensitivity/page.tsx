import type { Metadata } from "next";
import { SensitivityTab } from "@/components/valuation/tabs/sensitivity-tab";

export const metadata: Metadata = { title: "Sensitivity — Company Valuation Lab" };

export default function SensitivityPage() {
  return <SensitivityTab />;
}
