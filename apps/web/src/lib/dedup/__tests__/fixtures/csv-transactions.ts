/**
 * Test Fixtures: CSV-style Transaction Data
 *
 * These are FICTIONAL transactions designed to test deduplication.
 * They preserve realistic formatting quirks without containing real data.
 * 
 * Location: Fictional "Riverdale" in state "XX"
 */

export interface TestTransaction {
  description: string;
  amount: number;
  date: string;
}

/**
 * CSV transactions as they appear from a credit card export.
 * Note the messy formatting: AplPay prefix, location suffixes, truncated names.
 */
export const csvTransactions: TestTransaction[] = [
  // Fast food - various formats
  { date: "2025-01-15", description: "AplPay BURRITO BARN 1249RIVERDALE         XX", amount: -22.77 },
  { date: "2025-01-20", description: "BURRITO BARN 1249 00RIVERDALE         XX", amount: -15.73 },
  { date: "2025-01-22", description: "AplPay CHICKEN SHACK RIVERDALE         XX", amount: -26.45 },
  { date: "2025-01-25", description: "CHICKEN SHACK       RIVERDALE         XX", amount: -12.22 },
  { date: "2025-02-01", description: "AplPay BURGER JOINT  RIVERDALE         XX", amount: -12.52 },
  { date: "2025-02-05", description: "BURGER JOINT        RIVERDALE         XX", amount: -9.89 },
  { date: "2025-02-10", description: "FRIED CHICKEN CO 724OAKVILLE            XX", amount: -25.49 },
  { date: "2025-02-15", description: "AplPay FRIED CHICKENOAKVILLE            XX", amount: -26.14 },

  // Grocery stores
  { date: "2025-01-10", description: "AplPay MEGA MART    RIVERDALE         XX", amount: -64.98 },
  { date: "2025-01-12", description: "MEGA MART           RIVERDALE         XX", amount: -32.39 },
  { date: "2025-01-18", description: "AplPay FRESH GROCERYPLAINVIEW           XX", amount: -91.15 },
  { date: "2025-01-28", description: "SUPER STORE CENTERMAPLEWOOD           XX", amount: -315.14 },
  { date: "2025-02-03", description: "SUPER STORE CENTERMAPLEWOOD           XX", amount: -109.50 },

  // Restaurants with Toast prefix
  { date: "2025-01-26", description: "AplPay TST* STEAKHOUSRIVERDALE         XX", amount: -106.32 },
  { date: "2025-02-08", description: "TST* STEAKHOUSE - RIRIVERDALE         XX", amount: -233.55 },
  { date: "2025-02-12", description: "TST* THE BLUE LAMB  OAKVILLE            XX", amount: -166.50 },

  // Subscriptions - clean names
  { date: "2025-01-16", description: "MUSIC STREAM USA    NEW YORK            NY", amount: -11.99 },
  { date: "2025-02-16", description: "MUSIC STREAM USA    NEW YORK            NY", amount: -11.99 },
  { date: "2025-01-20", description: "AplPay VIDEO PLUS   NEW YORK CITY       NY", amount: -16.99 },
  { date: "2025-02-20", description: "AplPay VIDEO PLUS   NEW YORK CITY       NY", amount: -16.99 },

  // Tech services - different formats
  { date: "2025-01-02", description: "Cloud Hosting Svcs  CLOUDHOST.COM       WA", amount: -3.29 },
  { date: "2025-02-02", description: "Cloud Hosting Svcs  CLOUDHOST.COM       WA", amount: -3.28 },
  { date: "2025-01-19", description: "AI TOOLS INC        SAN FRANCISCO       CA", amount: -10.00 },
  { date: "2025-01-22", description: "CODE EDITOR PRO, INCNEW YORK            NY", amount: -60.00 },
  { date: "2025-01-25", description: "CODE EDITOR USAGE NONEW YORK            NY", amount: -40.04 },

  // Retail
  { date: "2025-01-20", description: "AplPay BIG BOX STORERIVERDALE         XX", amount: -37.00 },
  { date: "2025-01-29", description: "AplPay BIG BOX STORERIVERDALE         XX", amount: -44.26 },
  { date: "2025-02-05", description: "BIGBOXSTORE.COM     800-591-3869        MN", amount: -15.14 },

  // Pharmacy
  { date: "2025-01-21", description: "AplPay DRUG MART    PLAINVIEW           XX", amount: -3.17 },
  { date: "2025-02-07", description: "DRUG MART           PLAINVIEW           XX", amount: -15.12 },
  { date: "2025-01-18", description: "AplPay HEALTH PHARMARIVERDALE         XX", amount: -5.65 },

  // Gas stations
  { date: "2025-01-20", description: "AplPay FUEL STOP 800HILLSIDE           XX", amount: -20.98 },
  { date: "2025-02-19", description: "FUEL STOP 8001264702HILLSIDE           XX", amount: -43.09 },

  // Travel
  { date: "2025-01-06", description: "AplPay SKY AIRWAYS  SKYAIR             NY", amount: -5.60 },
  { date: "2025-01-06", description: "SKY AIRWAYS 9010    SKYAIR             NY", amount: -5.60 },
  { date: "2025-01-07", description: "SKY AIRWAYS 9010    SKYAIR             NY", amount: -20.00 },

  // Payments - should be excluded/transfers
  { date: "2025-01-02", description: "MOBILE PAYMENT - THANK YOU", amount: 2000.00 },
  { date: "2025-02-01", description: "AUTOPAY PAYMENT - THANK YOU", amount: 1868.60 },

  // Rideshare - various
  { date: "2025-01-09", description: "RIDESHARE", amount: -28.98 },
  { date: "2025-01-13", description: "RIDESHARE", amount: -75.96 },
  { date: "2025-01-15", description: "AplPay RIDESHARE EATHELP.RIDESHARE.COM  CA", amount: -86.53 },

  // Local pizza place - different store numbers
  { date: "2025-01-14", description: "TONY'S PIZZA 0000000RIVERDALE         XX", amount: -3.01 },
  { date: "2025-01-26", description: "TONY'S PIZZA 0017   RIVERDALE         XX", amount: -14.01 },
  { date: "2025-02-10", description: "AplPay TONY'S PIZZA RIVERDALE         XX", amount: -19.79 },

  // Craft store - same store, different transactions
  { date: "2025-01-20", description: "CRAFT WORLD #808 000RIVERDALE         XX", amount: -96.16 },
  { date: "2025-02-03", description: "CRAFT WORLD #808 000RIVERDALE         XX", amount: -57.63 },

  // Wholesale club
  { date: "2025-01-06", description: "AplPay BULK CLUB    RIVERDALE         XX", amount: -266.65 },
  { date: "2025-01-25", description: "AplPay BULK CLUB    RIVERDALE         XX", amount: -179.26 },
  { date: "2025-02-05", description: "BULK CLUB WHOLESALE RIVERDALE         XX", amount: -289.85 },

  // Wine/liquor store
  { date: "2025-01-19", description: "AplPay WINE DEPOT & RIVERDALE         XX", amount: -15.89 },
  { date: "2025-01-21", description: "AplPay WINE DEPOT & RIVERDALE         XX", amount: -62.52 },
  { date: "2025-02-13", description: "WINE DEPOT & MORE 21RIVERDALE         XX", amount: -10.59 },

  // Gym
  { date: "2025-01-07", description: "FITNESS WORLD 45    RIVERDALE         XX", amount: -15.00 },
  { date: "2025-02-11", description: "FITNESS WORLD 45    RIVERDALE         XX", amount: -3.17 },
  { date: "2025-02-17", description: "FITNESS WORLD 45 4  RIVERDALE         XX", amount: -220.00 },

  // Breakfast chain
  { date: "2025-01-16", description: "PANCAKE HOUSE       RIVERDALE         XX", amount: -48.78 },
  { date: "2025-02-24", description: "PANCAKE HOUSE       RIVERDALE         XX", amount: -45.43 },

  // Auto
  { date: "2025-01-08", description: "AUTO INSURE CO      (800)841-3000       DC", amount: -84.22 },
  { date: "2025-01-20", description: "AplPay CAR DEALER OFHILLSIDE           XX", amount: -1146.47 },

  // Cloud services - same day, different amounts (NOT duplicates)
  { date: "2025-01-18", description: "CLOUD CDN INC       SAN FRANCISCO       CA", amount: -10.46 },
  { date: "2025-01-18", description: "CLOUD CDN INC       SAN FRANCISCO       CA", amount: -14.20 },
];

/**
 * Known duplicate pairs for validation.
 * These are transactions that SHOULD be detected as duplicates.
 */
export const knownDuplicatePairs: Array<{
  csvDescription: string;
  plaidDescription: string;
  amount: number;
  csvDate: string;
  plaidDate: string;
  reason: string;
}> = [
  {
    csvDescription: "AplPay BURRITO BARN 1249RIVERDALE         XX",
    plaidDescription: "Burrito Barn",
    amount: 22.77,
    csvDate: "2025-01-15",
    plaidDate: "2025-01-15",
    reason: "Same merchant, Plaid has clean name",
  },
  {
    csvDescription: "AplPay CHICKEN SHACK RIVERDALE         XX",
    plaidDescription: "Chicken Shack",
    amount: 26.45,
    csvDate: "2025-01-22",
    plaidDate: "2025-01-22",
    reason: "Same merchant, different formatting",
  },
  {
    csvDescription: "FRIED CHICKEN CO 724OAKVILLE            XX",
    plaidDescription: "Fried Chicken Company",
    amount: 25.49,
    csvDate: "2025-02-10",
    plaidDate: "2025-02-10",
    reason: "Same restaurant chain",
  },
  {
    csvDescription: "AplPay TST* STEAKHOUSRIVERDALE         XX",
    plaidDescription: "Steakhouse",
    amount: 106.32,
    csvDate: "2025-01-26",
    plaidDate: "2025-01-26",
    reason: "TST* prefix is Toast payment processor",
  },
  {
    csvDescription: "Cloud Hosting Svcs  CLOUDHOST.COM       WA",
    plaidDescription: "CloudHost",
    amount: 3.29,
    csvDate: "2025-01-02",
    plaidDate: "2025-01-02",
    reason: "Cloud Hosting Svcs abbreviation",
  },
];

/**
 * Known NON-duplicate pairs: These should NOT be detected as duplicates.
 */
export const knownNonDuplicatePairs: Array<{
  csvDescription: string;
  plaidDescription: string;
  csvAmount: number;
  plaidAmount: number;
  reason: string;
}> = [
  {
    csvDescription: "AplPay BURRITO BARN 1249RIVERDALE         XX",
    plaidDescription: "Taco Town",
    csvAmount: 22.77,
    plaidAmount: 22.77,
    reason: "Different restaurants (same cuisine, same amount is coincidence)",
  },
  {
    csvDescription: "AplPay BIG BOX STORERIVERDALE         XX",
    plaidDescription: "Discount Mart",
    csvAmount: 37.00,
    plaidAmount: 37.00,
    reason: "Different retailers",
  },
  {
    csvDescription: "TONY'S PIZZA 0000000RIVERDALE         XX",
    plaidDescription: "Pizza Palace",
    csvAmount: 14.01,
    plaidAmount: 14.01,
    reason: "Different pizza chains",
  },
];
