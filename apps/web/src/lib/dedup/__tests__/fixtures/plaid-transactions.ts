/**
 * Test Fixtures: Plaid-style Transaction Data
 *
 * These are FICTIONAL transactions designed to test deduplication.
 * Plaid typically provides cleaner merchant names than CSV exports.
 * 
 * Location: Fictional "Riverdale" in state "XX"
 */

export interface PlaidTestTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  plaidMerchantName?: string;
  plaidAuthorizedDate?: string;
  plaidPostedDate?: string;
}

/**
 * Plaid transactions with clean merchant names.
 */
export const plaidTransactions: PlaidTestTransaction[] = [
  // Fast food - clean Plaid names
  {
    id: "plaid-1",
    description: "Burrito Barn",
    amount: -22.77,
    date: "2025-01-15",
    plaidMerchantName: "Burrito Barn",
    plaidAuthorizedDate: "2025-01-15",
    plaidPostedDate: "2025-01-16",
  },
  {
    id: "plaid-2",
    description: "Burrito Barn",
    amount: -15.73,
    date: "2025-01-20",
    plaidMerchantName: "Burrito Barn",
    plaidAuthorizedDate: "2025-01-20",
    plaidPostedDate: "2025-01-21",
  },
  {
    id: "plaid-3",
    description: "Chicken Shack",
    amount: -26.45,
    date: "2025-01-22",
    plaidMerchantName: "Chicken Shack",
    plaidAuthorizedDate: "2025-01-22",
    plaidPostedDate: "2025-01-23",
  },
  {
    id: "plaid-4",
    description: "Chicken Shack",
    amount: -12.22,
    date: "2025-01-25",
    plaidMerchantName: "Chicken Shack",
    plaidAuthorizedDate: "2025-01-25",
    plaidPostedDate: "2025-01-26",
  },
  {
    id: "plaid-5",
    description: "Burger Joint",
    amount: -12.52,
    date: "2025-02-01",
    plaidMerchantName: "Burger Joint",
    plaidAuthorizedDate: "2025-02-01",
    plaidPostedDate: "2025-02-02",
  },
  {
    id: "plaid-6",
    description: "Burger Joint",
    amount: -9.89,
    date: "2025-02-05",
    plaidMerchantName: "Burger Joint",
    plaidAuthorizedDate: "2025-02-05",
    plaidPostedDate: "2025-02-06",
  },
  {
    id: "plaid-7",
    description: "Fried Chicken Company",
    amount: -25.49,
    date: "2025-02-10",
    plaidMerchantName: "Fried Chicken Company",
    plaidAuthorizedDate: "2025-02-10",
    plaidPostedDate: "2025-02-11",
  },
  {
    id: "plaid-8",
    description: "Fried Chicken Company",
    amount: -26.14,
    date: "2025-02-15",
    plaidMerchantName: "Fried Chicken Company",
    plaidAuthorizedDate: "2025-02-15",
    plaidPostedDate: "2025-02-16",
  },

  // Grocery stores
  {
    id: "plaid-9",
    description: "Mega Mart",
    amount: -64.98,
    date: "2025-01-10",
    plaidMerchantName: "Mega Mart",
    plaidAuthorizedDate: "2025-01-10",
    plaidPostedDate: "2025-01-11",
  },
  {
    id: "plaid-10",
    description: "Mega Mart",
    amount: -32.39,
    date: "2025-01-12",
    plaidMerchantName: "Mega Mart",
    plaidAuthorizedDate: "2025-01-12",
    plaidPostedDate: "2025-01-13",
  },
  {
    id: "plaid-11",
    description: "Fresh Grocery",
    amount: -91.15,
    date: "2025-01-18",
    plaidMerchantName: "Fresh Grocery",
    plaidAuthorizedDate: "2025-01-18",
    plaidPostedDate: "2025-01-19",
  },
  {
    id: "plaid-12",
    description: "Super Store",
    amount: -315.14,
    date: "2025-01-28",
    plaidMerchantName: "Super Store",
    plaidAuthorizedDate: "2025-01-28",
    plaidPostedDate: "2025-01-29",
  },
  {
    id: "plaid-13",
    description: "Super Store",
    amount: -109.50,
    date: "2025-02-03",
    plaidMerchantName: "Super Store",
    plaidAuthorizedDate: "2025-02-03",
    plaidPostedDate: "2025-02-04",
  },

  // Restaurants
  {
    id: "plaid-14",
    description: "Steakhouse",
    amount: -106.32,
    date: "2025-01-26",
    plaidMerchantName: "Steakhouse",
    plaidAuthorizedDate: "2025-01-26",
    plaidPostedDate: "2025-01-27",
  },
  {
    id: "plaid-15",
    description: "Steakhouse",
    amount: -233.55,
    date: "2025-02-08",
    plaidMerchantName: "Steakhouse",
    plaidAuthorizedDate: "2025-02-08",
    plaidPostedDate: "2025-02-09",
  },
  {
    id: "plaid-16",
    description: "The Blue Lamb",
    amount: -166.50,
    date: "2025-02-12",
    plaidMerchantName: "The Blue Lamb",
    plaidAuthorizedDate: "2025-02-12",
    plaidPostedDate: "2025-02-13",
  },

  // Subscriptions
  {
    id: "plaid-17",
    description: "Music Stream",
    amount: -11.99,
    date: "2025-01-16",
    plaidMerchantName: "Music Stream",
    plaidAuthorizedDate: "2025-01-16",
    plaidPostedDate: "2025-01-16",
  },
  {
    id: "plaid-18",
    description: "Music Stream",
    amount: -11.99,
    date: "2025-02-16",
    plaidMerchantName: "Music Stream",
    plaidAuthorizedDate: "2025-02-16",
    plaidPostedDate: "2025-02-16",
  },
  {
    id: "plaid-19",
    description: "Video Plus",
    amount: -16.99,
    date: "2025-01-20",
    plaidMerchantName: "Video Plus",
    plaidAuthorizedDate: "2025-01-20",
    plaidPostedDate: "2025-01-20",
  },
  {
    id: "plaid-20",
    description: "Video Plus",
    amount: -16.99,
    date: "2025-02-20",
    plaidMerchantName: "Video Plus",
    plaidAuthorizedDate: "2025-02-20",
    plaidPostedDate: "2025-02-20",
  },

  // Tech services
  {
    id: "plaid-21",
    description: "CloudHost",
    amount: -3.29,
    date: "2025-01-02",
    plaidMerchantName: "CloudHost",
    plaidAuthorizedDate: "2025-01-02",
    plaidPostedDate: "2025-01-02",
  },
  {
    id: "plaid-22",
    description: "CloudHost",
    amount: -3.28,
    date: "2025-02-02",
    plaidMerchantName: "CloudHost",
    plaidAuthorizedDate: "2025-02-02",
    plaidPostedDate: "2025-02-02",
  },
  {
    id: "plaid-23",
    description: "AI Tools",
    amount: -10.00,
    date: "2025-01-19",
    plaidMerchantName: "AI Tools",
    plaidAuthorizedDate: "2025-01-19",
    plaidPostedDate: "2025-01-19",
  },
  {
    id: "plaid-24",
    description: "Code Editor Pro",
    amount: -60.00,
    date: "2025-01-22",
    plaidMerchantName: "Code Editor Pro",
    plaidAuthorizedDate: "2025-01-22",
    plaidPostedDate: "2025-01-22",
  },
  {
    id: "plaid-25",
    description: "Code Editor Pro",
    amount: -40.04,
    date: "2025-01-25",
    plaidMerchantName: "Code Editor Pro",
    plaidAuthorizedDate: "2025-01-25",
    plaidPostedDate: "2025-01-25",
  },

  // Retail
  {
    id: "plaid-26",
    description: "Big Box Store",
    amount: -37.00,
    date: "2025-01-20",
    plaidMerchantName: "Big Box Store",
    plaidAuthorizedDate: "2025-01-20",
    plaidPostedDate: "2025-01-21",
  },
  {
    id: "plaid-27",
    description: "Big Box Store",
    amount: -44.26,
    date: "2025-01-29",
    plaidMerchantName: "Big Box Store",
    plaidAuthorizedDate: "2025-01-29",
    plaidPostedDate: "2025-01-30",
  },
  {
    id: "plaid-28",
    description: "Big Box Store",
    amount: -15.14,
    date: "2025-02-05",
    plaidMerchantName: "Big Box Store",
    plaidAuthorizedDate: "2025-02-05",
    plaidPostedDate: "2025-02-05",
  },

  // Pharmacy
  {
    id: "plaid-29",
    description: "Drug Mart",
    amount: -3.17,
    date: "2025-01-21",
    plaidMerchantName: "Drug Mart",
    plaidAuthorizedDate: "2025-01-21",
    plaidPostedDate: "2025-01-22",
  },
  {
    id: "plaid-30",
    description: "Drug Mart",
    amount: -15.12,
    date: "2025-02-07",
    plaidMerchantName: "Drug Mart",
    plaidAuthorizedDate: "2025-02-07",
    plaidPostedDate: "2025-02-08",
  },
  {
    id: "plaid-31",
    description: "Health Pharma",
    amount: -5.65,
    date: "2025-01-18",
    plaidMerchantName: "Health Pharma",
    plaidAuthorizedDate: "2025-01-18",
    plaidPostedDate: "2025-01-19",
  },

  // Gas
  {
    id: "plaid-32",
    description: "Fuel Stop",
    amount: -20.98,
    date: "2025-01-20",
    plaidMerchantName: "Fuel Stop",
    plaidAuthorizedDate: "2025-01-20",
    plaidPostedDate: "2025-01-21",
  },
  {
    id: "plaid-33",
    description: "Fuel Stop",
    amount: -43.09,
    date: "2025-02-19",
    plaidMerchantName: "Fuel Stop",
    plaidAuthorizedDate: "2025-02-19",
    plaidPostedDate: "2025-02-20",
  },

  // Travel
  {
    id: "plaid-34",
    description: "Sky Airways",
    amount: -5.60,
    date: "2025-01-06",
    plaidMerchantName: "Sky Airways",
    plaidAuthorizedDate: "2025-01-06",
    plaidPostedDate: "2025-01-06",
  },
  {
    id: "plaid-35",
    description: "Sky Airways",
    amount: -5.60,
    date: "2025-01-06",
    plaidMerchantName: "Sky Airways",
    plaidAuthorizedDate: "2025-01-06",
    plaidPostedDate: "2025-01-06",
  },
  {
    id: "plaid-36",
    description: "Sky Airways",
    amount: -20.00,
    date: "2025-01-07",
    plaidMerchantName: "Sky Airways",
    plaidAuthorizedDate: "2025-01-07",
    plaidPostedDate: "2025-01-07",
  },

  // Rideshare
  {
    id: "plaid-37",
    description: "Rideshare",
    amount: -28.98,
    date: "2025-01-09",
    plaidMerchantName: "Rideshare",
    plaidAuthorizedDate: "2025-01-09",
    plaidPostedDate: "2025-01-09",
  },
  {
    id: "plaid-38",
    description: "Rideshare",
    amount: -75.96,
    date: "2025-01-13",
    plaidMerchantName: "Rideshare",
    plaidAuthorizedDate: "2025-01-13",
    plaidPostedDate: "2025-01-13",
  },
  {
    id: "plaid-39",
    description: "Rideshare Eats",
    amount: -86.53,
    date: "2025-01-15",
    plaidMerchantName: "Rideshare Eats",
    plaidAuthorizedDate: "2025-01-15",
    plaidPostedDate: "2025-01-15",
  },

  // Pizza
  {
    id: "plaid-40",
    description: "Tony's Pizza",
    amount: -3.01,
    date: "2025-01-14",
    plaidMerchantName: "Tony's Pizza",
    plaidAuthorizedDate: "2025-01-14",
    plaidPostedDate: "2025-01-15",
  },
  {
    id: "plaid-41",
    description: "Tony's Pizza",
    amount: -14.01,
    date: "2025-01-26",
    plaidMerchantName: "Tony's Pizza",
    plaidAuthorizedDate: "2025-01-26",
    plaidPostedDate: "2025-01-27",
  },
  {
    id: "plaid-42",
    description: "Tony's Pizza",
    amount: -19.79,
    date: "2025-02-10",
    plaidMerchantName: "Tony's Pizza",
    plaidAuthorizedDate: "2025-02-10",
    plaidPostedDate: "2025-02-11",
  },

  // Craft store
  {
    id: "plaid-43",
    description: "Craft World",
    amount: -96.16,
    date: "2025-01-20",
    plaidMerchantName: "Craft World",
    plaidAuthorizedDate: "2025-01-20",
    plaidPostedDate: "2025-01-21",
  },
  {
    id: "plaid-44",
    description: "Craft World",
    amount: -57.63,
    date: "2025-02-03",
    plaidMerchantName: "Craft World",
    plaidAuthorizedDate: "2025-02-03",
    plaidPostedDate: "2025-02-04",
  },

  // Bulk club
  {
    id: "plaid-45",
    description: "Bulk Club",
    amount: -266.65,
    date: "2025-01-06",
    plaidMerchantName: "Bulk Club",
    plaidAuthorizedDate: "2025-01-06",
    plaidPostedDate: "2025-01-07",
  },
  {
    id: "plaid-46",
    description: "Bulk Club",
    amount: -179.26,
    date: "2025-01-25",
    plaidMerchantName: "Bulk Club",
    plaidAuthorizedDate: "2025-01-25",
    plaidPostedDate: "2025-01-26",
  },
  {
    id: "plaid-47",
    description: "Bulk Club",
    amount: -289.85,
    date: "2025-02-05",
    plaidMerchantName: "Bulk Club",
    plaidAuthorizedDate: "2025-02-05",
    plaidPostedDate: "2025-02-06",
  },

  // Wine store
  {
    id: "plaid-48",
    description: "Wine Depot",
    amount: -15.89,
    date: "2025-01-19",
    plaidMerchantName: "Wine Depot",
    plaidAuthorizedDate: "2025-01-19",
    plaidPostedDate: "2025-01-20",
  },
  {
    id: "plaid-49",
    description: "Wine Depot",
    amount: -62.52,
    date: "2025-01-21",
    plaidMerchantName: "Wine Depot",
    plaidAuthorizedDate: "2025-01-21",
    plaidPostedDate: "2025-01-22",
  },
  {
    id: "plaid-50",
    description: "Wine Depot",
    amount: -10.59,
    date: "2025-02-13",
    plaidMerchantName: "Wine Depot",
    plaidAuthorizedDate: "2025-02-13",
    plaidPostedDate: "2025-02-14",
  },

  // Gym
  {
    id: "plaid-51",
    description: "Fitness World",
    amount: -15.00,
    date: "2025-01-07",
    plaidMerchantName: "Fitness World",
    plaidAuthorizedDate: "2025-01-07",
    plaidPostedDate: "2025-01-08",
  },
  {
    id: "plaid-52",
    description: "Fitness World",
    amount: -3.17,
    date: "2025-02-11",
    plaidMerchantName: "Fitness World",
    plaidAuthorizedDate: "2025-02-11",
    plaidPostedDate: "2025-02-12",
  },
  {
    id: "plaid-53",
    description: "Fitness World",
    amount: -220.00,
    date: "2025-02-17",
    plaidMerchantName: "Fitness World",
    plaidAuthorizedDate: "2025-02-17",
    plaidPostedDate: "2025-02-18",
  },

  // Breakfast
  {
    id: "plaid-54",
    description: "Pancake House",
    amount: -48.78,
    date: "2025-01-16",
    plaidMerchantName: "Pancake House",
    plaidAuthorizedDate: "2025-01-16",
    plaidPostedDate: "2025-01-17",
  },
  {
    id: "plaid-55",
    description: "Pancake House",
    amount: -45.43,
    date: "2025-02-24",
    plaidMerchantName: "Pancake House",
    plaidAuthorizedDate: "2025-02-24",
    plaidPostedDate: "2025-02-25",
  },

  // Auto
  {
    id: "plaid-56",
    description: "Auto Insure",
    amount: -84.22,
    date: "2025-01-08",
    plaidMerchantName: "Auto Insure",
    plaidAuthorizedDate: "2025-01-08",
    plaidPostedDate: "2025-01-08",
  },
  {
    id: "plaid-57",
    description: "Car Dealer",
    amount: -1146.47,
    date: "2025-01-20",
    plaidMerchantName: "Car Dealer",
    plaidAuthorizedDate: "2025-01-20",
    plaidPostedDate: "2025-01-21",
  },

  // Cloud CDN - same day, different amounts (NOT duplicates of each other)
  {
    id: "plaid-58",
    description: "Cloud CDN",
    amount: -10.46,
    date: "2025-01-18",
    plaidMerchantName: "Cloud CDN",
    plaidAuthorizedDate: "2025-01-18",
    plaidPostedDate: "2025-01-18",
  },
  {
    id: "plaid-59",
    description: "Cloud CDN",
    amount: -14.20,
    date: "2025-01-18",
    plaidMerchantName: "Cloud CDN",
    plaidAuthorizedDate: "2025-01-18",
    plaidPostedDate: "2025-01-18",
  },
];

/**
 * Expected behavior stats.
 */
export const expectedStats = {
  csvTransactionCount: 72,
  plaidTransactionCount: 59,
  // When Plaid syncs after CSV import, most should match
  expectedDuplicatesWhenPlaidSyncsAfterCsv: 59,
  // When CSV imports after Plaid sync, most should match
  expectedDuplicatesWhenCsvImportsAfterPlaid: 59,
};
