const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** e.g. "$142.07" — a per-share price or other exact dollar figure. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** e.g. "$383.3B" — for large aggregate figures (revenue, EV, market cap). */
export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

/** e.g. "8.4%". `value` is a fraction (0.084), not a whole-number percent. */
export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(1)}x`;
}
