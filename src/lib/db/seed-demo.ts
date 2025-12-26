import { db } from "./index";
import { v4 as uuidv4 } from "uuid";

// Import seed function for categories and rules
import { seedDatabase } from "./seed";

// ========================================
// MERCHANT DATA - Categorized by type
// ========================================

const merchants = {
  restaurant: [
    { name: "CHIPOTLE", locations: ["#1249", "#2341", "#5678"] },
    { name: "STARBUCKS", locations: ["#001234", "#007856", "#009123"] },
    { name: "MCDONALD'S", locations: ["#12453", "#89756", "#45234"] },
    { name: "PANERA BREAD", locations: ["#456", "#789", "#123"] },
    { name: "SHAKE SHACK", locations: ["SF", "OAKLAND", "BERKELEY"] },
    { name: "IN-N-OUT BURGER", locations: ["#123", "#456", "#789"] },
    { name: "CHICK-FIL-A", locations: ["#234", "#567", "#890"] },
    { name: "SUBWAY", locations: ["#3456", "#6789", "#9012"] },
    { name: "TACO BELL", locations: ["#1111", "#2222", "#3333"] },
    { name: "OLIVE GARDEN", locations: ["SAN FRANCISCO", "SAN JOSE", "OAKLAND"] },
    { name: "CHEESECAKE FACTORY", locations: ["SF", "PALO ALTO"] },
    { name: "DOMINO'S PIZZA", locations: ["#987", "#654", "#321"] },
    { name: "PANDA EXPRESS", locations: ["#444", "#555", "#666"] },
    { name: "DUNKIN'", locations: ["#777", "#888", "#999"] },
  ],
  grocery: [
    { name: "WHOLE FOODS", locations: ["SF MARKET ST", "OAKLAND", "BERKELEY"] },
    { name: "TRADER JOE'S", locations: ["SAN FRANCISCO", "PALO ALTO", "SAN JOSE"] },
    { name: "SAFEWAY", locations: ["#1234", "#5678", "#9012"] },
    { name: "COSTCO WHSE", locations: ["#123 SAN FRANCISCO", "#456 SAN JOSE"] },
    { name: "TARGET", locations: ["T-1234 SAN FRANCISCO", "T-5678 OAKLAND"] },
    { name: "WALMART", locations: ["#3456", "#6789"] },
    { name: "SPROUTS", locations: ["SAN FRANCISCO", "PALO ALTO"] },
    { name: "INSTACART", locations: [""] },
  ],
  shopping: [
    { name: "AMAZON.COM", locations: ["*AB12CD34 AMZN.COM/BILL", "*XY98ZW76", "*QR54ST32"] },
    { name: "AMAZON PRIME", locations: ["MEMBERSHIP", "ANNUAL"] },
    { name: "TARGET", locations: ["SAN FRANCISCO", "OAKLAND"] },
    { name: "BEST BUY", locations: ["#1234 SAN FRANCISCO", "#5678 SAN JOSE"] },
    { name: "APPLE STORE", locations: ["ONLINE", "UNION SQUARE SF"] },
    { name: "NORDSTROM", locations: ["SAN FRANCISCO", "PALO ALTO"] },
    { name: "MACY'S", locations: ["UNION SQUARE SF", "VALLEY FAIR"] },
    { name: "ZARA USA", locations: ["SF", "SAN JOSE"] },
    { name: "H&M", locations: ["#234 SF", "#567 OAKLAND"] },
    { name: "UNIQLO", locations: ["SAN FRANCISCO", "SF"] },
    { name: "HOME DEPOT", locations: ["#1234", "#5678"] },
    { name: "IKEA", locations: ["EAST PALO ALTO", "EMERYVILLE"] },
  ],
  subscriptions: [
    { name: "NETFLIX.COM", locations: [""] },
    { name: "SPOTIFY", locations: [""] },
    { name: "APPLE MUSIC", locations: [""] },
    { name: "HULU", locations: [""] },
    { name: "HBO MAX", locations: [""] },
    { name: "DISNEY PLUS", locations: [""] },
    { name: "YOUTUBE PREMIUM", locations: [""] },
    { name: "ADOBE CREATIVE", locations: [""] },
    { name: "DROPBOX", locations: [""] },
    { name: "ICLOUD STORAGE", locations: [""] },
    { name: "GOOGLE ONE", locations: [""] },
    { name: "CRUNCH FITNESS", locations: ["SAN FRANCISCO"] },
  ],
  travel: [
    { name: "UBER", locations: ["*PENDING", "*TRIP HELP.UBER.COM"] },
    { name: "LYFT", locations: ["*RIDE", "*RIDE SUN"] },
    { name: "UNITED AIRLINES", locations: ["TKT", "0169283745"] },
    { name: "DELTA AIR", locations: ["0016273849", "TKT"] },
    { name: "SOUTHWEST AIRLINES", locations: [""] },
    { name: "AIRBNB", locations: ["HMTY7DTJS5"] },
    { name: "MARRIOTT", locations: ["SAN FRANCISCO", "PALO ALTO"] },
    { name: "HILTON", locations: ["SAN JOSE", "SF UNION SQUARE"] },
  ],
  car: [
    { name: "SHELL OIL", locations: ["12345678 OAKLAND CA", "87654321 SF CA"] },
    { name: "CHEVRON", locations: ["#123456 SAN FRANCISCO", "#789012 SAN JOSE"] },
    { name: "BP#", locations: ["12345 OAKLAND", "67890 SF"] },
    { name: "EXXONMOBIL", locations: ["12345", "67890"] },
    { name: "PARKING", locations: ["SF MTA", "PIER 39", "DOWNTOWN"] },
  ],
  entertainment: [
    { name: "AMC THEATRES", locations: ["METREON 16", "KABUKI 8"] },
    { name: "REGAL CINEMAS", locations: ["JACK LONDON", "HACIENDA"] },
    { name: "STEAM GAMES", locations: [""] },
    { name: "PLAYSTATION STORE", locations: [""] },
    { name: "XBOX LIVE", locations: [""] },
    { name: "TICKETMASTER", locations: [""] },
  ],
  house: [
    { name: "PG&E", locations: ["WEB ONLINE"] },
    { name: "COMCAST", locations: ["INTERNET"] },
    { name: "AT&T", locations: ["BILL PAYMENT"] },
    { name: "WATER COMPANY", locations: ["SFWATER.ORG"] },
  ],
  work: [
    { name: "OFFICE DEPOT", locations: ["#1234", "#5678"] },
    { name: "STAPLES", locations: ["#234", "#567"] },
    { name: "FEDEX OFFICE", locations: ["SAN FRANCISCO", "OAKLAND"] },
    { name: "UPS STORE", locations: ["#1234", "#5678"] },
  ],
};

// Income sources
const incomeSources = [
  { name: "TECH CORP INC", type: "PAYROLL", suffix: "PPD" },
  { name: "TECH CORP INC", type: "DIR DEP", suffix: "DIRECT DEP" },
  { name: "FREELANCE CLIENT LLC", type: "ACH", suffix: "PAYMENT" },
];

// Recurring subscription amounts
const subscriptionAmounts: Record<string, number> = {
  "NETFLIX.COM": 15.99,
  "SPOTIFY": 10.99,
  "APPLE MUSIC": 10.99,
  "HULU": 14.99,
  "HBO MAX": 15.99,
  "DISNEY PLUS": 10.99,
  "YOUTUBE PREMIUM": 11.99,
  "ADOBE CREATIVE": 54.99,
  "DROPBOX": 11.99,
  "ICLOUD STORAGE": 2.99,
  "GOOGLE ONE": 9.99,
  "CRUNCH FITNESS": 89.99,
  "AMAZON PRIME": 14.99,
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatDescription(merchant: string, location: string, prefix: string = "POS"): string {
  if (location) {
    return `${prefix} ${merchant} ${location}`.trim();
  }
  return `${prefix} ${merchant}`.trim();
}

function generateRandomDate(monthsAgo: number): string {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  
  // Random day within the month
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  
  const date = new Date(targetDate.getFullYear(), targetDate.getMonth(), randomDay);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

function generateAmount(category: string, isRecurring: boolean = false): number {
  const ranges: Record<string, [number, number]> = {
    restaurant: [8, 75],
    grocery: [25, 250],
    shopping: [15, 350],
    subscriptions: [5, 90],
    travel: [15, 450],
    car: [35, 85],
    entertainment: [12, 65],
    house: [50, 250],
    work: [10, 120],
    personal: [10, 200],
  };
  
  const [min, max] = ranges[category] || [10, 100];
  
  // For recurring, return consistent amounts
  if (isRecurring) {
    return Math.round((min + max) / 2 * 100) / 100;
  }
  
  // Weighted toward smaller amounts (logarithmic distribution)
  const range = max - min;
  const random = Math.random();
  const weighted = Math.pow(random, 1.5); // Bias toward lower values
  
  return Math.round((min + weighted * range) * 100) / 100;
}

function shouldBeConfirmed(): boolean {
  return Math.random() < 0.7; // 70% confirmed
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ========================================
// MAIN SEED FUNCTION
// ========================================

export async function seedDemoDatabase() {
  console.log("🌱 Seeding demo database...");
  
  // First, seed categories and preset rules
  await seedDatabase();
  
  // Get categories for reference
  const categories = await db.category.findMany();
  const categoryMap: Record<string, string> = {};
  categories.forEach((cat) => {
    categoryMap[cat.name] = cat.id;
  });
  
  console.log("✅ Categories and rules seeded");
  
  // ========================================
  // CREATE MOCK PLAID ITEMS
  // ========================================
  
  const plaidItems = [
    {
      id: uuidv4(),
      institutionId: "ins_109508",
      institutionName: "Chase",
      accessToken: "access-sandbox-demo-chase-token",
    },
    {
      id: uuidv4(),
      institutionId: "ins_127989",
      institutionName: "American Express",
      accessToken: "access-sandbox-demo-amex-token",
    },
    {
      id: uuidv4(),
      institutionId: "ins_108022",
      institutionName: "Fidelity Investments",
      accessToken: "access-sandbox-demo-fidelity-token",
    },
  ];
  
  for (const item of plaidItems) {
    await db.plaidItem.create({
      data: {
        ...item,
        cursor: null,
        lastSyncedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      },
    });
  }
  
  console.log("✅ Mock Plaid items created");
  
  // ========================================
  // CREATE ACCOUNTS
  // ========================================
  
  const accounts = [
    {
      id: uuidv4(),
      name: "Chase Checking",
      type: "checking",
      plaidItemId: plaidItems[0].id,
      plaidAccountId: "demo-chase-checking-123",
    },
    {
      id: uuidv4(),
      name: "Personal Savings",
      type: "checking",
      plaidItemId: null,
      plaidAccountId: null,
    },
    {
      id: uuidv4(),
      name: "Amex Blue Cash",
      type: "credit_card",
      plaidItemId: plaidItems[1].id,
      plaidAccountId: "demo-amex-credit-456",
    },
    {
      id: uuidv4(),
      name: "Visa Signature",
      type: "credit_card",
      plaidItemId: null,
      plaidAccountId: null,
    },
    {
      id: uuidv4(),
      name: "Fidelity 401k",
      type: "investment",
      plaidItemId: plaidItems[2].id,
      plaidAccountId: "demo-fidelity-401k-789",
    },
    {
      id: uuidv4(),
      name: "Emergency Fund",
      type: "checking",
      plaidItemId: null,
      plaidAccountId: null,
    },
  ];
  
  for (const account of accounts) {
    await db.account.create({
      data: {
        ...account,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
      },
    });
  }
  
  console.log("✅ Accounts created");
  
  // ========================================
  // CREATE BUDGETS
  // ========================================
  
  const spendingCategories = categories.filter((cat) => cat.type === "spending");
  const budgetAmounts: Record<string, number> = {
    restaurant: 500,
    grocery: 600,
    shopping: 300,
    subscriptions: 150,
    travel: 400,
    car: 200,
    entertainment: 200,
    house: 2000,
    work: 100,
    personal: 200,
  };
  
  const now = new Date();
  const startMonth = `${now.getFullYear()}-${String(now.getMonth() - 11).padStart(2, "0")}`; // 12 months ago
  
  for (const category of spendingCategories) {
    const amount = budgetAmounts[category.name] || 200;
    await db.categoryBudget.create({
      data: {
        id: uuidv4(),
        categoryId: category.id,
        amount,
        startMonth,
        createdAt: new Date().toISOString(),
      },
    });
  }
  
  console.log("✅ Budgets created");
  
  // ========================================
  // CREATE TRANSACTIONS
  // ========================================
  
  const transactions: Array<{
    accountId: string;
    description: string;
    amount: number;
    date: string;
    categoryId: string | null;
    isConfirmed: boolean;
    excluded: boolean;
    plaidTransactionId?: string;
  }> = [];
  
  // Helper to add transaction
  function addTransaction(
    accountId: string,
    description: string,
    amount: number,
    date: string,
    categoryName: string | null,
    isConfirmed: boolean = true,
    hasPlaidId: boolean = false
  ) {
    const categoryId = categoryName ? categoryMap[categoryName] : null;
    const isTransfer = categoryName === "transfers" || categoryName === "credit card payments";
    
    transactions.push({
      accountId,
      description,
      amount,
      date,
      categoryId,
      isConfirmed,
      excluded: isTransfer, // Transfers are automatically excluded
      plaidTransactionId: hasPlaidId ? `plaid-demo-${uuidv4()}` : undefined,
    });
  }
  
  // Generate transactions for the past 12 months
  const checkingAccount = accounts[0].id; // Chase Checking
  const creditAccount = accounts[2].id; // Amex Blue Cash
  
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - monthsAgo);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    
    // ===== INCOME (2-3 per month) =====
    // Regular paycheck (twice a month)
    const paycheckDates = [7, 22]; // 7th and 22nd
    for (const day of paycheckDates) {
      const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
      const incomeSource = getRandomItem(incomeSources);
      addTransaction(
        checkingAccount,
        `${incomeSource.name} ${incomeSource.type} ${incomeSource.suffix}`,
        4250.00, // Positive = income (money in)
        dateStr,
        "job income",
        true,
        true
      );
    }
    
    // Occasional freelance income
    if (Math.random() < 0.3) {
      addTransaction(
        checkingAccount,
        "FREELANCE CLIENT LLC ACH PAYMENT",
        1500.00, // Positive = income
        generateRandomDate(monthsAgo),
        "job income",
        true,
        true
      );
    }
    
    // ===== RECURRING SUBSCRIPTIONS =====
    Object.entries(subscriptionAmounts).forEach(([merchant, amount]) => {
      const day = Math.floor(Math.random() * 28) + 1;
      const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
      addTransaction(
        creditAccount,
        formatDescription(merchant, "", "PURCHASE"),
        -amount, // Negative = expense
        dateStr,
        "subscriptions",
        true,
        true
      );
    });
    
    // ===== HOUSE (Rent + Utilities) =====
    // Rent on 1st
    addTransaction(
      checkingAccount,
      "PROPERTY MGMT RENT PAYMENT",
      -2400.00, // Negative = expense
      `${monthStr}-01`,
      "house",
      true,
      true
    );
    
    // Utilities
    addTransaction(creditAccount, "PG&E WEB ONLINE", -generateAmount("house"), `${monthStr}-15`, "house", true, true);
    addTransaction(creditAccount, "COMCAST INTERNET", -89.99, `${monthStr}-10`, "house", true, true);
    
    // ===== GROCERIES (8-12 per month) =====
    const groceryCount = Math.floor(Math.random() * 5) + 8;
    for (let i = 0; i < groceryCount; i++) {
      const merchantData = getRandomItem(merchants.grocery);
      const location = getRandomItem(merchantData.locations);
      addTransaction(
        Math.random() < 0.5 ? checkingAccount : creditAccount,
        formatDescription(merchantData.name, location),
        -generateAmount("grocery"), // Negative = expense
        generateRandomDate(monthsAgo),
        "grocery",
        shouldBeConfirmed(),
        Math.random() < 0.7
      );
    }
    
    // ===== RESTAURANTS (10-15 per month) =====
    const restaurantCount = Math.floor(Math.random() * 6) + 10;
    for (let i = 0; i < restaurantCount; i++) {
      const merchantData = getRandomItem(merchants.restaurant);
      const location = getRandomItem(merchantData.locations);
      addTransaction(
        Math.random() < 0.3 ? checkingAccount : creditAccount,
        formatDescription(merchantData.name, location),
        -generateAmount("restaurant"), // Negative = expense
        generateRandomDate(monthsAgo),
        "restaurant",
        shouldBeConfirmed(),
        Math.random() < 0.7
      );
    }
    
    // ===== SHOPPING (3-8 per month) =====
    const shoppingCount = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < shoppingCount; i++) {
      const merchantData = getRandomItem(merchants.shopping);
      const location = getRandomItem(merchantData.locations);
      addTransaction(
        creditAccount,
        formatDescription(merchantData.name, location, Math.random() < 0.8 ? "POS" : "ONLINE"),
        -generateAmount("shopping"), // Negative = expense
        generateRandomDate(monthsAgo),
        "shopping",
        shouldBeConfirmed(),
        Math.random() < 0.7
      );
    }
    
    // ===== CAR/GAS (4-6 per month) =====
    const carCount = Math.floor(Math.random() * 3) + 4;
    for (let i = 0; i < carCount; i++) {
      const merchantData = getRandomItem(merchants.car);
      const location = getRandomItem(merchantData.locations);
      addTransaction(
        Math.random() < 0.6 ? checkingAccount : creditAccount,
        formatDescription(merchantData.name, location),
        -generateAmount("car"), // Negative = expense
        generateRandomDate(monthsAgo),
        "car",
        shouldBeConfirmed(),
        Math.random() < 0.7
      );
    }
    
    // ===== ENTERTAINMENT (2-4 per month) =====
    const entertainmentCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < entertainmentCount; i++) {
      const merchantData = getRandomItem(merchants.entertainment);
      const location = getRandomItem(merchantData.locations);
      addTransaction(
        creditAccount,
        formatDescription(merchantData.name, location),
        -generateAmount("entertainment"), // Negative = expense
        generateRandomDate(monthsAgo),
        "entertainment",
        shouldBeConfirmed(),
        Math.random() < 0.7
      );
    }
    
    // ===== TRAVEL (occasional) =====
    if (Math.random() < 0.4) {
      const travelCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < travelCount; i++) {
        const merchantData = getRandomItem(merchants.travel);
        const location = getRandomItem(merchantData.locations);
        addTransaction(
          creditAccount,
          formatDescription(merchantData.name, location),
          -generateAmount("travel"), // Negative = expense
          generateRandomDate(monthsAgo),
          "travel",
          shouldBeConfirmed(),
          Math.random() < 0.8
        );
      }
    }
    
    // ===== WORK EXPENSES (occasional) =====
    if (Math.random() < 0.3) {
      const merchantData = getRandomItem(merchants.work);
      const location = getRandomItem(merchantData.locations);
      addTransaction(
        creditAccount,
        formatDescription(merchantData.name, location),
        -generateAmount("work"), // Negative = expense
        generateRandomDate(monthsAgo),
        "work",
        shouldBeConfirmed(),
        Math.random() < 0.7
      );
    }
    
    // ===== CREDIT CARD PAYMENT =====
    // Pay off credit card around the 25th
    const ccPaymentAmount = Math.floor(Math.random() * 2000) + 1500;
    addTransaction(
      checkingAccount,
      "CREDIT CARD PAYMENT AMERICAN EXPRESS",
      -ccPaymentAmount, // Negative = expense (transfer out)
      `${monthStr}-25`,
      "credit card payments",
      true,
      true
    );
  }
  
  // Insert all transactions
  console.log(`💳 Creating ${transactions.length} transactions...`);
  
  for (const txn of transactions) {
    await db.transaction.create({
      data: {
        id: uuidv4(),
        ...txn,
        createdAt: new Date().toISOString(),
      },
    });
  }
  
  console.log("✅ Transactions created");
  console.log(`\n🎉 Demo database seeded successfully!`);
  console.log(`   - ${accounts.length} accounts`);
  console.log(`   - ${plaidItems.length} Plaid connections (mock)`);
  console.log(`   - ${transactions.length} transactions`);
  console.log(`   - ${spendingCategories.length} budgets`);
  console.log(`\n🚀 Run 'npm run demo' to start the dev server with demo data!`);
}

// Run seed if called directly
if (require.main === module) {
  seedDemoDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error seeding demo database:", err);
      process.exit(1);
    });
}

