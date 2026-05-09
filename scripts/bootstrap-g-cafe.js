/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const restaurantInput = {
  slug: "g-cafe",
  name: "G-Cafe",
  description: "Fast counter ordering for coffee, milk tea, rice meals, and quick bites.",
  address: "Maglanque St, Concepcion, San Simon, 2015 Pampanga, Philippines",
  currency: "PHP",
};

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

const categories = [
  { name: "Milk Tea", sortOrder: 1 },
  { name: "Rice Bowls", sortOrder: 2 },
  { name: "Coffee", sortOrder: 3 },
  { name: "Sides", sortOrder: 4 },
];

const menuItems = [
  {
    categoryName: "Milk Tea",
    name: "Brown Sugar Pearl Milk",
    description: "Fresh milk, brown sugar syrup, and warm pearls.",
    priceCents: 9900,
    imageUrl: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80",
    optionGroupsJson: JSON.stringify(optionGroups.milkTea),
    sortOrder: 1,
  },
  {
    categoryName: "Milk Tea",
    name: "Jasmine Milk Tea",
    description: "Light floral tea with a smooth milk finish.",
    priceCents: 8900,
    imageUrl: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=900&q=80",
    optionGroupsJson: JSON.stringify(optionGroups.milkTea),
    sortOrder: 2,
  },
  {
    categoryName: "Rice Bowls",
    name: "Teriyaki Chicken Bowl",
    description: "Grilled chicken, steamed rice, slaw, and teriyaki glaze.",
    priceCents: 15900,
    imageUrl: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=900&q=80",
    optionGroupsJson: JSON.stringify(optionGroups.food),
    sortOrder: 1,
  },
  {
    categoryName: "Rice Bowls",
    name: "Crispy Tofu Bowl",
    description: "Crispy tofu, pickled vegetables, herbs, and sesame sauce.",
    priceCents: 14900,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    optionGroupsJson: JSON.stringify(optionGroups.food),
    sortOrder: 2,
  },
  {
    categoryName: "Coffee",
    name: "Iced Latte",
    description: "Double espresso over milk and ice.",
    priceCents: 8900,
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
    optionGroupsJson: "[]",
    sortOrder: 1,
  },
  {
    categoryName: "Sides",
    name: "Loaded Fries",
    description: "Crispy fries with house sauce and spring onion.",
    priceCents: 10900,
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
    optionGroupsJson: "[]",
    sortOrder: 1,
  },
];

async function findOrCreateCategory(restaurantId, input) {
  const existing = await prisma.category.findFirst({
    where: { restaurantId, name: input.name },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { sortOrder: input.sortOrder },
    });
  }

  return prisma.category.create({
    data: {
      restaurantId,
      name: input.name,
      sortOrder: input.sortOrder,
    },
  });
}

async function findOrCreateMenuItem(restaurantId, categoryId, input) {
  const existing = await prisma.menuItem.findFirst({
    where: { restaurantId, name: input.name },
  });
  const data = {
    restaurantId,
    categoryId,
    name: input.name,
    description: input.description,
    priceCents: input.priceCents,
    imageUrl: input.imageUrl,
    optionGroupsJson: input.optionGroupsJson,
    sortOrder: input.sortOrder,
    isActive: true,
  };

  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.menuItem.create({ data });
}

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: restaurantInput.slug },
    update: restaurantInput,
    create: restaurantInput,
  });

  const categoryByName = new Map();
  for (const categoryInput of categories) {
    const category = await findOrCreateCategory(restaurant.id, categoryInput);
    categoryByName.set(category.name, category);
  }

  for (const item of menuItems) {
    const category = categoryByName.get(item.categoryName);
    if (!category) throw new Error(`Missing category ${item.categoryName}.`);
    await findOrCreateMenuItem(restaurant.id, category.id, item);
  }

  console.log(`Bootstrapped ${restaurant.name} (${restaurant.slug}) without deleting existing orders.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
