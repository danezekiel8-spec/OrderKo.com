import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { hashStaffPin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";
import { superAdminRestaurantCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const starterCategories = [
  { name: "Drinks", sortOrder: 1 },
  { name: "Meals", sortOrder: 2 },
  { name: "Snacks", sortOrder: 3 },
  { name: "Specials", sortOrder: 4 },
];

export async function GET(request: NextRequest) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isOpen: true,
      currency: true,
      createdAt: true,
      _count: { select: { categories: true, menuItems: true, orders: true } },
    },
  });

  return NextResponse.json({
    restaurants: restaurants.map((restaurant) => ({
      ...restaurant,
      createdAt: restaurant.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = superAdminRestaurantCreateSchema.parse(await request.json());
    const restaurant = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurant.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          address: body.address,
          currency: body.currency,
          isOpen: false,
          categories: { create: starterCategories },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isOpen: true,
          currency: true,
          createdAt: true,
        },
      });

      await tx.staffCredential.createMany({
        data: [
          {
            restaurantId: created.id,
            role: "admin",
            label: "Admin",
            pinHash: hashStaffPin(created.id, "admin", body.adminPin),
          },
          {
            restaurantId: created.id,
            role: "cashier",
            label: "Cashier",
            pinHash: hashStaffPin(created.id, "cashier", body.cashierPin),
          },
          {
            restaurantId: created.id,
            role: "kitchen",
            label: "Kitchen",
            pinHash: hashStaffPin(created.id, "kitchen", body.kitchenPin),
          },
        ],
      });

      return created;
    });

    return NextResponse.json(
      {
        restaurant: {
          ...restaurant,
          createdAt: restaurant.createdAt.toISOString(),
          _count: { categories: starterCategories.length, menuItems: 0, orders: 0 },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Check the restaurant details and try again.", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That restaurant slug is already taken." }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create restaurant." },
      { status: 400 },
    );
  }
}
