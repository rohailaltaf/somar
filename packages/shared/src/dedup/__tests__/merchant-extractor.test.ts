import { describe, it, expect } from "vitest";
import { extractMerchantName } from "../merchant-extractor";

describe("Merchant Name Extraction", () => {
  it("should extract merchant from AplPay prefix", () => {
    const extracted = extractMerchantName(
      "AplPay BURRITO BARN 1249RIVERDALE         XX"
    );
    expect(extracted).toContain("BURRITO BARN");
  });

  it("should extract merchant from TST* (Toast) prefix", () => {
    const extracted = extractMerchantName(
      "TST* STEAKHOUSE - RIRIVERDALE         XX"
    );
    expect(extracted).toContain("STEAKHOUSE");
  });

  it("should handle clean Plaid names", () => {
    expect(extractMerchantName("Burrito Barn")).toBe("BURRITO BARN");
  });

  it("should extract merchant from store numbers", () => {
    const extracted = extractMerchantName(
      "FRIED CHICKEN CO 724OAKVILLE            XX"
    );
    expect(extracted).toContain("FRIED CHICKEN");
  });

  it("should handle subscription services", () => {
    const extracted = extractMerchantName(
      "MUSIC STREAM USA    NEW YORK            NY"
    );
    expect(extracted).toContain("MUSIC STREAM");
  });

  it("should handle website domains", () => {
    const extracted = extractMerchantName(
      "Cloud Hosting Svcs  CLOUDHOST.COM       WA"
    );
    expect(extracted).toContain("CLOUD HOSTING");
  });
});
