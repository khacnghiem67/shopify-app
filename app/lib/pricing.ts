export type Rule = {
  operation: "percentage";
  percent: number;
  roundTo99: boolean;
  setCompareAtToOriginal: boolean;
};

const MIN_PRICE = 0.01;

export function parseMoney(value: string | null | undefined): number | null {
  if (value == null) return null;
  // Shopify occasionally emits "" for a missing money field; Number("") === 0,
  // so guard the empty/blank string explicitly and treat it as "no price".
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(value: number): string {
  // Round to 2 decimals. The + Number.EPSILON nudge fixes the common float
  // artifact (e.g. 15.005 * 100 = 1500.4999...); it is an approximation, not a
  // exact decimal rounding, which is acceptable for display/price math here.
  return (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
}

export function applyPercentage(price: number, percent: number): number {
  return price * (1 + percent / 100);
}

export function roundTo99(price: number): number {
  return Math.floor(price) + 0.99;
}

export function computeNewPrice(price: number, rule: Rule): number {
  let next = price;
  if (rule.operation === "percentage") next = applyPercentage(next, rule.percent);
  if (rule.roundTo99) next = roundTo99(next);
  if (next <= 0) next = MIN_PRICE;
  return next;
}

export function buildVariantUpdate(
  variant: { id: string; price: string; compareAtPrice: string | null },
  rule: Rule,
): { id: string; price: string; compareAtPrice: string | null } | null {
  const original = parseMoney(variant.price);
  if (original === null) return null;

  const newPrice = computeNewPrice(original, rule);
  let compareAtPrice: string | null = variant.compareAtPrice;

  if (rule.setCompareAtToOriginal && newPrice < original) {
    compareAtPrice = formatMoney(original);
  }

  return { id: variant.id, price: formatMoney(newPrice), compareAtPrice };
}
