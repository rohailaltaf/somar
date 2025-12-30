import { describe, it, expect } from "vitest";
import { jaroWinkler, combinedSimilarity } from "../jaro-winkler";
import { extractMerchantName } from "../merchant-extractor";

describe("String Similarity", () => {
  it("should match merchant variations with AplPay prefix removed", () => {
    // After extraction: "BURRITO BARN" vs "Burrito Barn"
    const extracted = extractMerchantName(
      "AplPay BURRITO BARN 1249RIVERDALE         XX"
    );
    const score = jaroWinkler(extracted, "Burrito Barn");
    expect(score).toBe(1); // Perfect match after normalization
  });

  it("should match abbreviated names", () => {
    const score = combinedSimilarity(
      "FRIED CHICKEN",
      "Fried Chicken Company"
    );
    expect(score).toBeGreaterThan(0.6);
  });

  it("should NOT match different restaurants with low similarity", () => {
    // Jaro-Winkler alone may not perfectly distinguish all merchants
    // The full deduplication pipeline uses amount + date + merchant together
    const score = jaroWinkler("BURRITO BARN", "Taco Town");
    // Score should be relatively low but Jaro-Winkler is generous
    // The important thing is it's below our TIER1_THRESHOLD of 0.88
    expect(score).toBeLessThan(0.88);
  });

  it("should NOT match similar-sounding but different merchants", () => {
    const score = combinedSimilarity("BIG BOX STORE", "Discount Mart");
    expect(score).toBeLessThan(0.5);
  });
});
