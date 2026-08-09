import type { Metadata } from "next";
import { ForecastTab } from "@/components/valuation/tabs/forecast-tab";

export const metadata: Metadata = { title: "Forecast — Company Valuation Lab" };

export default function ForecastPage() {
  return <ForecastTab />;
}
