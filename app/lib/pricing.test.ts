import { describe, it, expect } from "vitest";
import {
  applyPercentage,
  roundTo99,
  computeNewPrice,
  parseMoney,
  formatMoney,
  buildVariantUpdate,
  type Rule,
} from "./pricing";

const base: Rule = { operation: "percentage", percent: 0, roundTo99: false, setCompareAtToOriginal: false };

describe("parseMoney/formatMoney", () => {
  it("parses a money string", () => expect(parseMoney("15.99")).toBe(15.99));
  it("returns null for junk", () => expect(parseMoney("abc")).toBeNull());
  it("returns null for null", () => expect(parseMoney(null)).toBeNull());
  it("formats to 2 decimals", () => expect(formatMoney(15.9)).toBe("15.90"));
  it("rounds half up to 2 decimals", () => expect(formatMoney(15.005)).toBe("15.01"));
});

describe("applyPercentage", () => {
  it("decreases by 20%", () => expect(applyPercentage(100, -20)).toBeCloseTo(80));
  it("increases by 10%", () => expect(applyPercentage(50, 10)).toBeCloseTo(55));
});

describe("roundTo99", () => {
  it("23.40 -> 23.99", () => expect(roundTo99(23.4)).toBeCloseTo(23.99));
  it("23.00 -> 23.99", () => expect(roundTo99(23)).toBeCloseTo(23.99));
});

describe("computeNewPrice", () => {
  it("percentage then round", () =>
    expect(computeNewPrice(100, { ...base, percent: -20, roundTo99: true })).toBeCloseTo(80.99));
  it("never returns <= 0 (clamps to 0.01)", () =>
    expect(computeNewPrice(10, { ...base, percent: -100 })).toBe(0.01));
});

describe("buildVariantUpdate", () => {
  const variant = { id: "gid://shopify/ProductVariant/1", price: "100.00", compareAtPrice: null };

  it("sets new price string", () => {
    const out = buildVariantUpdate(variant, { ...base, percent: -20 });
    expect(out).toEqual({ id: variant.id, price: "80.00", compareAtPrice: null });
  });

  it("sets compareAt to original when discounting and toggle on", () => {
    const out = buildVariantUpdate(variant, { ...base, percent: -20, setCompareAtToOriginal: true });
    expect(out).toEqual({ id: variant.id, price: "80.00", compareAtPrice: "100.00" });
  });

  it("does NOT set compareAt when price goes up", () => {
    const out = buildVariantUpdate(variant, { ...base, percent: 10, setCompareAtToOriginal: true });
    expect(out).toEqual({ id: variant.id, price: "110.00", compareAtPrice: null });
  });

  it("returns null when price is unparseable", () => {
    expect(buildVariantUpdate({ ...variant, price: "abc" }, base)).toBeNull();
  });
});
