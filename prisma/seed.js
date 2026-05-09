/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const root = path.resolve(__dirname, "..");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return "";
  const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.*)$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

const databaseUrl = readDatabaseUrl();
if (process.env.NODE_ENV === "production" || (databaseUrl && !databaseUrl.startsWith("file:"))) {
  throw new Error("prisma/seed.js is destructive and is only allowed against local SQLite development databases.");
}

const prisma = new PrismaClient();

const optionGroups = {
  milkTea: [
    {
      name: "Sugar",
      required: true,
      maxChoices: 1,
      options: [
        { name: "25%", priceCents: 0 },
        { name: "50%", priceCents: 0 },
        { name: "100%", priceCents: 0 },
      ],
    },
    {
      name: "Add-ons",
      required: false,
      maxChoices: 3,
      options: [
        { name: "Pearls", priceCents: 80 },
        { name: "Grass Jelly", priceCents: 90 },
        { name: "Cream Cheese", priceCents: 120 },
      ],
    },
  ],
  food: [
    {
      name: "Heat",
      required: false,
      maxChoices: 1,
      options: [
        { name: "Mild", priceCents: 0 },
        { name: "Medium", priceCents: 0 },
        { name: "Hot", priceCents: 0 },
      ],
    },
    {
      name: "Extras",
      required: false,
      maxChoices: 2,
      options: [
        { name: "Extra Chicken", priceCents: 250 },
        { name: "Extra Egg", priceCents: 180 },
      ],
    },
  ],
};

async function main() {
  await prisma.orderStatusEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();

  const restaurant = await prisma.restaurant.create({
    data: {
      slug: "g-cafe",
      name: "G-Cafe",
      description: "Fast counter ordering for coffee, milk tea, rice meals, and quick bites.",
      address: "Maglanque St, Concepcion, San Simon, 2015 Pampanga, Philippines",
      currency: "PHP",
      categories: {
        create: [
          { name: "Milk Tea", sortOrder: 1 },
          { name: "Rice Bowls", sortOrder: 2 },
          { name: "Coffee", sortOrder: 3 },
          { name: "Sides", sortOrder: 4 },
        ],
      },
    },
    include: { categories: true },
  });

  const byName = new Map(restaurant.categories.map((category) => [category.name, category.id]));

  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        categoryId: byName.get("Milk Tea"),
        name: "Brown Sugar Pearl Milk",
        description: "Fresh milk, brown sugar syrup, and warm pearls.",
        priceCents: 9900,
        imageUrl: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80",
        optionGroupsJson: JSON.stringify(optionGroups.milkTea),
        sortOrder: 1,
      },
      {
        restaurantId: restaurant.id,
        categoryId: byName.get("Milk Tea"),
        name: "Jasmine Milk Tea",
        description: "Light floral tea with a smooth milk finish.",
        priceCents: 8900,
        imageUrl: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=900&q=80",
        optionGroupsJson: JSON.stringify(optionGroups.milkTea),
        sortOrder: 2,
      },
      {
        restaurantId: restaurant.id,
        categoryId: byName.get("Rice Bowls"),
        name: "Teriyaki Chicken Bowl",
        description: "Grilled chicken, steamed rice, slaw, and teriyaki glaze.",
        priceCents: 15900,
        imageUrl: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=900&q=80",
        optionGroupsJson: JSON.stringify(optionGroups.food),
        sortOrder: 1,
      },
      {
        restaurantId: restaurant.id,
        categoryId: byName.get("Rice Bowls"),
        name: "Crispy Tofu Bowl",
        description: "Crispy tofu, pickled vegetables, herbs, and sesame sauce.",
        priceCents: 14900,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
        optionGroupsJson: JSON.stringify(optionGroups.food),
        sortOrder: 2,
      },
      {
        restaurantId: restaurant.id,
        categoryId: byName.get("Coffee"),
        name: "Iced Latte",
        description: "Double espresso over milk and ice.",
        priceCents: 8900,
        imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
        optionGroupsJson: "[]",
        sortOrder: 1,
      },
      {
        restaurantId: restaurant.id,
        categoryId: byName.get("Sides"),
        name: "Loaded Fries",
        description: "Crispy fries with house sauce and spring onion.",
        priceCents: 10900,
        imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
        optionGroupsJson: "[]",
        sortOrder: 1,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
