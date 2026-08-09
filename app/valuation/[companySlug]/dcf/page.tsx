import type { Metadata } from "next";
import { DcfTab } from "@/components/valuation/tabs/dcf-tab";

export const metadata: Metadata = { title: "DCF — Company Valuation Lab" };

export default function DcfPage() {
  return <DcfTab />;
}
