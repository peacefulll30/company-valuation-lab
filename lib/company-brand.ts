/**
 * Tasteful, original monogram treatment for the 10 Featured companies —
 * not reproduced third-party logo artwork (Design spec §2 "Company
 * monogram note"). One brand-adjacent hue per ticker, used only as a
 * faint tint + hairline + letterform color, never a literal logo trace.
 */
export type CompanyBrand = { mark: string; hue: string };

export const COMPANY_BRAND: Record<string, CompanyBrand> = {
  AAPL: { mark: "A", hue: "#A8A8AC" },
  MSFT: { mark: "M", hue: "#4F8CC9" },
  NVDA: { mark: "N", hue: "#6FBF4F" },
  KO: { mark: "K", hue: "#D3492A" },
  HD: { mark: "HD", hue: "#E8823C" },
  CAT: { mark: "C", hue: "#E8B23C" },
  WMT: { mark: "W", hue: "#4F8CC9" },
  COST: { mark: "C", hue: "#5A78C0" },
  AMZN: { mark: "A", hue: "#E8823C" },
  MCD: { mark: "M", hue: "#D9A32A" },
};

export const DEFAULT_BRAND: CompanyBrand = { mark: "•", hue: "#9AA3B2" };

export function getCompanyBrand(ticker: string): CompanyBrand {
  return COMPANY_BRAND[ticker.toUpperCase()] ?? DEFAULT_BRAND;
}
