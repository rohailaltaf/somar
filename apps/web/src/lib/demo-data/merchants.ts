/**
 * Demo merchant data.
 * Realistic merchants per category with typical amount ranges.
 */

export interface Merchant {
  name: string;
  minAmount: number;
  maxAmount: number;
}

export interface CategoryMerchants {
  categoryName: string;
  merchants: Merchant[];
  /** Monthly frequency range */
  monthlyFrequency: [number, number];
}

/**
 * Merchants organized by category.
 * Amount ranges are positive (will be negated for expenses).
 */
export const DEMO_MERCHANTS: CategoryMerchants[] = [
  {
    categoryName: "restaurant",
    merchants: [
      { name: "Starbucks", minAmount: 5, maxAmount: 15 },
      { name: "Chipotle", minAmount: 12, maxAmount: 20 },
      { name: "McDonald's", minAmount: 8, maxAmount: 18 },
      { name: "Panera Bread", minAmount: 12, maxAmount: 22 },
      { name: "The Cheesecake Factory", minAmount: 35, maxAmount: 80 },
      { name: "Olive Garden", minAmount: 25, maxAmount: 60 },
      { name: "Chick-fil-A", minAmount: 10, maxAmount: 20 },
      { name: "Subway", minAmount: 8, maxAmount: 15 },
      { name: "Thai Kitchen", minAmount: 18, maxAmount: 35 },
      { name: "Local Coffee Shop", minAmount: 5, maxAmount: 12 },
      { name: "DoorDash", minAmount: 20, maxAmount: 45 },
      { name: "Uber Eats", minAmount: 18, maxAmount: 40 },
    ],
    monthlyFrequency: [8, 14],
  },
  {
    categoryName: "grocery",
    merchants: [
      { name: "Whole Foods Market", minAmount: 40, maxAmount: 180 },
      { name: "Trader Joe's", minAmount: 35, maxAmount: 120 },
      { name: "Costco", minAmount: 80, maxAmount: 350 },
      { name: "Safeway", minAmount: 50, maxAmount: 150 },
      { name: "Target", minAmount: 30, maxAmount: 120 },
      { name: "Kroger", minAmount: 45, maxAmount: 160 },
      { name: "Aldi", minAmount: 40, maxAmount: 100 },
      { name: "Sprouts Farmers Market", minAmount: 35, maxAmount: 110 },
    ],
    monthlyFrequency: [4, 7],
  },
  {
    categoryName: "shopping",
    merchants: [
      { name: "Amazon", minAmount: 15, maxAmount: 150 },
      { name: "Target", minAmount: 20, maxAmount: 100 },
      { name: "Walmart", minAmount: 15, maxAmount: 80 },
      { name: "Best Buy", minAmount: 50, maxAmount: 400 },
      { name: "Apple Store", minAmount: 30, maxAmount: 500 },
      { name: "Nordstrom", minAmount: 50, maxAmount: 250 },
      { name: "Nike", minAmount: 60, maxAmount: 180 },
      { name: "Home Depot", minAmount: 30, maxAmount: 200 },
      { name: "IKEA", minAmount: 40, maxAmount: 300 },
      { name: "Etsy", minAmount: 20, maxAmount: 80 },
    ],
    monthlyFrequency: [2, 5],
  },
  {
    categoryName: "entertainment",
    merchants: [
      { name: "AMC Theatres", minAmount: 15, maxAmount: 40 },
      { name: "Regal Cinemas", minAmount: 14, maxAmount: 35 },
      { name: "Steam Games", minAmount: 10, maxAmount: 60 },
      { name: "PlayStation Store", minAmount: 15, maxAmount: 70 },
      { name: "Ticketmaster", minAmount: 50, maxAmount: 250 },
      { name: "StubHub", minAmount: 40, maxAmount: 200 },
      { name: "Bowling Alley", minAmount: 25, maxAmount: 60 },
      { name: "Mini Golf", minAmount: 15, maxAmount: 35 },
      { name: "Escape Room", minAmount: 30, maxAmount: 50 },
    ],
    monthlyFrequency: [2, 4],
  },
  {
    categoryName: "subscriptions",
    merchants: [
      { name: "Netflix", minAmount: 15.49, maxAmount: 15.49 },
      { name: "Spotify", minAmount: 10.99, maxAmount: 10.99 },
      { name: "Apple Music", minAmount: 10.99, maxAmount: 10.99 },
      { name: "Disney+", minAmount: 13.99, maxAmount: 13.99 },
      { name: "YouTube Premium", minAmount: 13.99, maxAmount: 13.99 },
      { name: "Hulu", minAmount: 17.99, maxAmount: 17.99 },
      { name: "HBO Max", minAmount: 15.99, maxAmount: 15.99 },
      { name: "Amazon Prime", minAmount: 14.99, maxAmount: 14.99 },
      { name: "iCloud Storage", minAmount: 2.99, maxAmount: 2.99 },
      { name: "Google One", minAmount: 2.99, maxAmount: 2.99 },
      { name: "Adobe Creative Cloud", minAmount: 54.99, maxAmount: 54.99 },
      { name: "Microsoft 365", minAmount: 12.99, maxAmount: 12.99 },
      { name: "Gym Membership", minAmount: 35, maxAmount: 35 },
    ],
    monthlyFrequency: [5, 8],
  },
  {
    categoryName: "travel",
    merchants: [
      { name: "United Airlines", minAmount: 200, maxAmount: 600 },
      { name: "Delta Air Lines", minAmount: 180, maxAmount: 550 },
      { name: "Southwest Airlines", minAmount: 150, maxAmount: 400 },
      { name: "Marriott Hotels", minAmount: 150, maxAmount: 400 },
      { name: "Hilton Hotels", minAmount: 140, maxAmount: 380 },
      { name: "Airbnb", minAmount: 120, maxAmount: 500 },
      { name: "Uber", minAmount: 15, maxAmount: 50 },
      { name: "Lyft", minAmount: 12, maxAmount: 45 },
      { name: "Enterprise Rent-A-Car", minAmount: 80, maxAmount: 200 },
      { name: "Gas Station", minAmount: 30, maxAmount: 80 },
    ],
    monthlyFrequency: [0, 2],
  },
  {
    categoryName: "car",
    merchants: [
      { name: "Shell Gas Station", minAmount: 35, maxAmount: 75 },
      { name: "Chevron", minAmount: 40, maxAmount: 80 },
      { name: "Exxon", minAmount: 35, maxAmount: 70 },
      { name: "Car Wash", minAmount: 15, maxAmount: 35 },
      { name: "Jiffy Lube", minAmount: 60, maxAmount: 120 },
      { name: "AutoZone", minAmount: 20, maxAmount: 100 },
      { name: "DMV", minAmount: 50, maxAmount: 200 },
      { name: "Parking Garage", minAmount: 10, maxAmount: 40 },
    ],
    monthlyFrequency: [3, 6],
  },
  {
    categoryName: "house",
    merchants: [
      { name: "Rent Payment", minAmount: 1800, maxAmount: 2400 },
      { name: "Electric Company", minAmount: 80, maxAmount: 200 },
      { name: "Gas Company", minAmount: 40, maxAmount: 120 },
      { name: "Water Utility", minAmount: 30, maxAmount: 80 },
      { name: "Internet Service", minAmount: 70, maxAmount: 120 },
      { name: "Home Insurance", minAmount: 80, maxAmount: 150 },
      { name: "Home Depot", minAmount: 30, maxAmount: 150 },
      { name: "Lowe's", minAmount: 25, maxAmount: 140 },
    ],
    monthlyFrequency: [4, 6],
  },
  {
    categoryName: "personal",
    merchants: [
      { name: "CVS Pharmacy", minAmount: 10, maxAmount: 60 },
      { name: "Walgreens", minAmount: 10, maxAmount: 50 },
      { name: "Hair Salon", minAmount: 40, maxAmount: 100 },
      { name: "Barber Shop", minAmount: 25, maxAmount: 45 },
      { name: "Dentist", minAmount: 50, maxAmount: 200 },
      { name: "Doctor's Office", minAmount: 30, maxAmount: 150 },
      { name: "Dry Cleaners", minAmount: 20, maxAmount: 50 },
      { name: "Pet Store", minAmount: 25, maxAmount: 80 },
    ],
    monthlyFrequency: [2, 5],
  },
  {
    categoryName: "work",
    merchants: [
      { name: "Office Supplies", minAmount: 15, maxAmount: 60 },
      { name: "Staples", minAmount: 20, maxAmount: 80 },
      { name: "WeWork", minAmount: 300, maxAmount: 500 },
      { name: "LinkedIn Premium", minAmount: 29.99, maxAmount: 29.99 },
      { name: "Domain Registration", minAmount: 12, maxAmount: 20 },
      { name: "AWS", minAmount: 10, maxAmount: 100 },
    ],
    monthlyFrequency: [1, 3],
  },
];

/**
 * Demo income sources.
 */
export const DEMO_INCOME_SOURCES: Merchant[] = [
  { name: "Payroll - Employer Direct Deposit", minAmount: 3200, maxAmount: 5500 },
  { name: "Side Project Income", minAmount: 200, maxAmount: 800 },
  { name: "Dividend Payment", minAmount: 50, maxAmount: 200 },
  { name: "Interest Payment", minAmount: 5, maxAmount: 30 },
  { name: "Cashback Reward", minAmount: 20, maxAmount: 100 },
];

/**
 * Demo transfer descriptions.
 */
export const DEMO_TRANSFERS: Merchant[] = [
  { name: "Transfer to Savings", minAmount: 500, maxAmount: 2000 },
  { name: "Transfer from Savings", minAmount: 200, maxAmount: 1000 },
  { name: "Credit Card Payment", minAmount: 500, maxAmount: 3000 },
  { name: "Venmo Transfer", minAmount: 20, maxAmount: 200 },
  { name: "Zelle Transfer", minAmount: 50, maxAmount: 500 },
];

/**
 * Demo account configurations.
 */
export const DEMO_ACCOUNTS = [
  { name: "Chase Checking", type: "checking", institution: "Chase" },
  { name: "Chase Savings", type: "savings", institution: "Chase" },
  { name: "Bank of America Checking", type: "checking", institution: "Bank of America" },
  { name: "Bank of America Savings", type: "savings", institution: "Bank of America" },
  { name: "Amex Platinum", type: "credit_card", institution: "American Express" },
  { name: "Chase Sapphire", type: "credit_card", institution: "Chase" },
] as const;

/**
 * Demo budget amounts by category.
 */
export const DEMO_BUDGETS: Record<string, number> = {
  restaurant: 400,
  grocery: 600,
  shopping: 300,
  entertainment: 200,
  subscriptions: 100,
  travel: 500,
  car: 400,
  house: 2800,
  personal: 200,
  work: 100,
};
