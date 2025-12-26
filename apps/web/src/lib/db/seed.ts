import { db } from "./index";
import { v4 as uuidv4 } from "uuid";

// Category colors mapping
const categoryColors: Record<string, string> = {
  personal: "oklch(0.65 0.15 280)",
  reimbursed: "oklch(0.7 0.15 150)",
  restaurant: "oklch(0.65 0.2 30)",
  work: "oklch(0.55 0.15 250)",
  house: "oklch(0.6 0.12 80)",
  entertainment: "oklch(0.65 0.2 330)",
  travel: "oklch(0.6 0.18 200)",
  shopping: "oklch(0.65 0.18 350)",
  car: "oklch(0.5 0.12 240)",
  grocery: "oklch(0.65 0.18 140)",
  subscriptions: "oklch(0.6 0.15 300)",
  "job income": "oklch(0.7 0.2 140)",
  "transfers": "oklch(0.5 0.08 220)",
  "credit card payments": "oklch(0.5 0.08 200)",
};

// Default categories to seed with their types
const defaultCategories: Array<{ name: string; type: "spending" | "income" | "transfer" }> = [
  { name: "personal", type: "spending" },
  { name: "reimbursed", type: "transfer" },
  { name: "restaurant", type: "spending" },
  { name: "work", type: "spending" },
  { name: "house", type: "spending" },
  { name: "entertainment", type: "spending" },
  { name: "travel", type: "spending" },
  { name: "shopping", type: "spending" },
  { name: "car", type: "spending" },
  { name: "grocery", type: "spending" },
  { name: "subscriptions", type: "spending" },
  { name: "job income", type: "income" },
  { name: "transfers", type: "transfer" },
  { name: "credit card payments", type: "transfer" },
];

// Preset categorization rules (merchant patterns -> category)
const presetRules: { pattern: string; category: string }[] = [
  // Restaurant
  { pattern: "UBER EATS", category: "restaurant" },
  { pattern: "DOORDASH", category: "restaurant" },
  { pattern: "GRUBHUB", category: "restaurant" },
  { pattern: "POSTMATES", category: "restaurant" },
  { pattern: "MCDONALD", category: "restaurant" },
  { pattern: "STARBUCKS", category: "restaurant" },
  { pattern: "CHIPOTLE", category: "restaurant" },
  { pattern: "SUBWAY", category: "restaurant" },
  { pattern: "PIZZA", category: "restaurant" },
  { pattern: "RESTAURANT", category: "restaurant" },
  { pattern: "CAFE", category: "restaurant" },
  { pattern: "COFFEE", category: "restaurant" },
  { pattern: "DINER", category: "restaurant" },
  { pattern: "BURGER", category: "restaurant" },
  { pattern: "TACO", category: "restaurant" },
  { pattern: "SUSHI", category: "restaurant" },

  // Grocery
  { pattern: "WHOLE FOODS", category: "grocery" },
  { pattern: "TRADER JOE", category: "grocery" },
  { pattern: "SAFEWAY", category: "grocery" },
  { pattern: "KROGER", category: "grocery" },
  { pattern: "PUBLIX", category: "grocery" },
  { pattern: "COSTCO", category: "grocery" },
  { pattern: "WALMART", category: "grocery" },
  { pattern: "TARGET", category: "grocery" },
  { pattern: "GROCERY", category: "grocery" },
  { pattern: "MARKET", category: "grocery" },
  { pattern: "ALDI", category: "grocery" },
  { pattern: "INSTACART", category: "grocery" },

  // Shopping
  { pattern: "AMAZON", category: "shopping" },
  { pattern: "EBAY", category: "shopping" },
  { pattern: "ETSY", category: "shopping" },
  { pattern: "BEST BUY", category: "shopping" },
  { pattern: "APPLE STORE", category: "shopping" },
  { pattern: "NORDSTROM", category: "shopping" },
  { pattern: "MACYS", category: "shopping" },
  { pattern: "ZARA", category: "shopping" },
  { pattern: "H&M", category: "shopping" },
  { pattern: "UNIQLO", category: "shopping" },
  { pattern: "GAP", category: "shopping" },
  { pattern: "OLD NAVY", category: "shopping" },

  // Subscriptions
  { pattern: "NETFLIX", category: "subscriptions" },
  { pattern: "SPOTIFY", category: "subscriptions" },
  { pattern: "APPLE MUSIC", category: "subscriptions" },
  { pattern: "HULU", category: "subscriptions" },
  { pattern: "DISNEY+", category: "subscriptions" },
  { pattern: "HBO MAX", category: "subscriptions" },
  { pattern: "AMAZON PRIME", category: "subscriptions" },
  { pattern: "YOUTUBE PREMIUM", category: "subscriptions" },
  { pattern: "ADOBE", category: "subscriptions" },
  { pattern: "DROPBOX", category: "subscriptions" },
  { pattern: "ICLOUD", category: "subscriptions" },
  { pattern: "GOOGLE ONE", category: "subscriptions" },
  { pattern: "GYM", category: "subscriptions" },
  { pattern: "FITNESS", category: "subscriptions" },

  // Travel
  { pattern: "UBER", category: "travel" },
  { pattern: "LYFT", category: "travel" },
  { pattern: "AIRBNB", category: "travel" },
  { pattern: "HOTEL", category: "travel" },
  { pattern: "AIRLINE", category: "travel" },
  { pattern: "UNITED", category: "travel" },
  { pattern: "DELTA", category: "travel" },
  { pattern: "SOUTHWEST", category: "travel" },
  { pattern: "AMERICAN AIR", category: "travel" },
  { pattern: "EXPEDIA", category: "travel" },
  { pattern: "BOOKING.COM", category: "travel" },
  { pattern: "KAYAK", category: "travel" },

  // Car
  { pattern: "SHELL", category: "car" },
  { pattern: "CHEVRON", category: "car" },
  { pattern: "EXXON", category: "car" },
  { pattern: "BP ", category: "car" },
  { pattern: "GAS", category: "car" },
  { pattern: "FUEL", category: "car" },
  { pattern: "AUTO", category: "car" },
  { pattern: "PARKING", category: "car" },
  { pattern: "TOLL", category: "car" },
  { pattern: "DMV", category: "car" },
  { pattern: "CAR WASH", category: "car" },

  // Entertainment
  { pattern: "CINEMA", category: "entertainment" },
  { pattern: "THEATER", category: "entertainment" },
  { pattern: "MOVIE", category: "entertainment" },
  { pattern: "AMC", category: "entertainment" },
  { pattern: "REGAL", category: "entertainment" },
  { pattern: "CONCERT", category: "entertainment" },
  { pattern: "TICKETMASTER", category: "entertainment" },
  { pattern: "STUBHUB", category: "entertainment" },
  { pattern: "GAME", category: "entertainment" },
  { pattern: "STEAM", category: "entertainment" },
  { pattern: "PLAYSTATION", category: "entertainment" },
  { pattern: "XBOX", category: "entertainment" },
  { pattern: "NINTENDO", category: "entertainment" },

  // House
  { pattern: "HOME DEPOT", category: "house" },
  { pattern: "LOWES", category: "house" },
  { pattern: "IKEA", category: "house" },
  { pattern: "BED BATH", category: "house" },
  { pattern: "WAYFAIR", category: "house" },
  { pattern: "ELECTRIC", category: "house" },
  { pattern: "UTILITY", category: "house" },
  { pattern: "WATER BILL", category: "house" },
  { pattern: "INTERNET", category: "house" },
  { pattern: "COMCAST", category: "house" },
  { pattern: "ATT", category: "house" },
  { pattern: "VERIZON", category: "house" },
  { pattern: "RENT", category: "house" },
  { pattern: "MORTGAGE", category: "house" },
];

export async function seedDatabase() {
  console.log("Seeding database...");

  // Insert default categories
  const categoryMap: Record<string, string> = {};

  for (const category of defaultCategories) {
    const id = uuidv4();
    categoryMap[category.name] = id;

    try {
      await db.category.upsert({
        where: { name: category.name },
        update: {},
        create: {
          id,
          name: category.name,
          type: category.type,
          color: categoryColors[category.name] || "#6366f1",
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Category might already exist, skip
      console.log(`Category ${category.name} might already exist`);
    }
  }

  // Get existing categories to map names to IDs
  const existingCategories = await db.category.findMany();
  for (const cat of existingCategories) {
    categoryMap[cat.name] = cat.id;
  }

  // Insert preset rules
  for (const rule of presetRules) {
    const categoryId = categoryMap[rule.category];
    if (!categoryId) continue;

    try {
      // Check if rule exists
      const existing = await db.categorizationRule.findFirst({
        where: { pattern: rule.pattern },
      });

      if (!existing) {
        await db.categorizationRule.create({
          data: {
            id: uuidv4(),
            pattern: rule.pattern,
            categoryId,
            isPreset: true,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      // Rule might already exist, skip
    }
  }

  console.log("Database seeded successfully!");
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

