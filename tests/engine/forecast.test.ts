import { describe, expect, it } from "vitest";
import { FORECAST_YEARS, generateForecast } from "@/lib/engine/forecast";
import { sampleAssumptions, sampleHistoricals } from "./fixtures";

describe("generateForecast", () => {
  const forecast = generateForecast(sampleHistoricals, sampleAssumptions);

  it("produces exactly 5 forecast years (PRD FR-15)", () => {
    expect(forecast).toHaveLength(FORECAST_YEARS);
    expect(forecast.map((y) => y.year)).toEqual([1, 2, 3, 4, 5]);
  });

  it("year 1: base revenue 1100 grown at 10%, margins/ratios per explicit advanced overrides", () => {
    const y1 = forecast[0];
    expect(y1.revenue).toBeCloseTo(1210, 8); // 1100 * 1.10
    expect(y1.ebitda).toBeCloseTo(302.5, 8); // 1210 * 0.25
    expect(y1.da).toBeCloseTo(60.5, 8); // 1210 * 0.05
    expect(y1.ebit).toBeCloseTo(242, 8); // 302.5 - 60.5
    expect(y1.capex).toBeCloseTo(72.6, 8); // 1210 * 0.06
    // NWC level 1210*0.05=60.5 vs base 1100*0.05=55 -> delta 5.5
    expect(y1.deltaNWC).toBeCloseTo(5.5, 8);
  });

  it("year 2: compounds correctly off year 1", () => {
    const y2 = forecast[1];
    expect(y2.revenue).toBeCloseTo(1331, 6); // 1210 * 1.10
    expect(y2.ebitda).toBeCloseTo(332.75, 6);
    expect(y2.da).toBeCloseTo(66.55, 6);
    expect(y2.ebit).toBeCloseTo(266.2, 6);
    expect(y2.capex).toBeCloseTo(79.86, 6);
    expect(y2.deltaNWC).toBeCloseTo(6.05, 6);
  });

  it("holds EBITDA = EBIT + D&A for every forecast year", () => {
    for (const year of forecast) {
      expect(year.ebitda).toBeCloseTo(year.ebit + year.da, 8);
    }
  });

  it("compounds revenue at the assumed growth rate every year", () => {
    for (let i = 1; i < forecast.length; i++) {
      expect(forecast[i].revenue).toBeCloseTo(
        forecast[i - 1].revenue * (1 + sampleAssumptions.revenueGrowth),
        6
      );
    }
  });

  it("falls back to base-year historical ratios when advanced overrides are omitted", () => {
    const noOverrides = generateForecast(sampleHistoricals, {
      ...sampleAssumptions,
      advanced: undefined,
    });
    const y1 = noOverrides[0];
    // base year (2023): da=55/revenue=1100 -> 0.05 default
    expect(y1.da).toBeCloseTo(1210 * (55 / 1100), 8);
    // base year capex=65/revenue=1100 -> default ratio
    expect(y1.capex).toBeCloseTo(1210 * (65 / 1100), 8);
  });

  it("defaults nwcPctRevenue to the historical average of deltaNWC/revenue", () => {
    // (10/1000 + 12/1100) / 2
    const expectedRatio = (10 / 1000 + 12 / 1100) / 2;
    const noOverrides = generateForecast(sampleHistoricals, {
      ...sampleAssumptions,
      advanced: undefined,
    });
    const baseRevenue = 1100;
    const year1Revenue = baseRevenue * 1.1;
    const expectedNwcLevel1 = year1Revenue * expectedRatio;
    const expectedNwcLevel0 = baseRevenue * expectedRatio;
    expect(noOverrides[0].deltaNWC).toBeCloseTo(expectedNwcLevel1 - expectedNwcLevel0, 8);
  });

  it("does not clamp negative EBITDA/EBIT when the margin assumption is negative", () => {
    const negativeMarginForecast = generateForecast(sampleHistoricals, {
      ...sampleAssumptions,
      ebitdaMargin: -0.1,
    });
    expect(negativeMarginForecast[0].ebitda).toBeLessThan(0);
    expect(negativeMarginForecast[0].ebit).toBeLessThan(0);
  });
});
