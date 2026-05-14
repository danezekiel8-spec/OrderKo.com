import { z } from "zod";

export const selectedOptionSchema = z.object({
  groupName: z.string().min(1).max(80),
  optionName: z.string().min(1).max(80),
  priceCents: z.number().int().min(0).max(100000),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  note: z.string().max(300).optional().default(""),
  selectedOptions: z.array(selectedOptionSchema).max(12).default([]),
});

export const placeOrderSchema = z.object({
  submissionKey: z.string().min(12).max(120),
  customerName: z.string().max(80).optional().default(""),
  customerNote: z.string().max(300).optional().default(""),
  items: z.array(orderItemInputSchema).min(1).max(40),
});

export const menuItemMutationSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(500),
  priceCents: z.number().int().min(0).max(500000),
  categoryId: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  optionGroupsJson: z.string().default("[]"),
  isSoldOut: z.boolean().default(false),
});

export const categoryMutationSchema = z.object({
  name: z.string().min(2).max(80),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const staffCredentialsMutationSchema = z.object({
  cashierPin: z.string().trim().min(4).max(12).optional().or(z.literal("")),
  kitchenPin: z.string().trim().min(4).max(12).optional().or(z.literal("")),
  adminPin: z.string().trim().min(4).max(12).optional().or(z.literal("")),
});

export const reservedRestaurantSlugs = new Set(["admin", "staff", "api", "order", "k", "r", "super-admin", "login"]);

export const restaurantSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens between words.")
  .refine((slug) => !reservedRestaurantSlugs.has(slug), "This slug is reserved by OrderKo.");

const restaurantPinSchema = z.string().trim().min(4, "PIN must be at least 4 characters.").max(12, "PIN must be 12 characters or fewer.");

export const superAdminRestaurantCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: restaurantSlugSchema,
    description: z.string().trim().min(2).max(500),
    address: z.string().trim().min(2).max(300),
    currency: z.string().trim().toUpperCase().length(3, "Currency must be a 3-letter code.").default("PHP"),
    adminPin: restaurantPinSchema,
    adminPinConfirm: restaurantPinSchema,
    cashierPin: restaurantPinSchema,
    cashierPinConfirm: restaurantPinSchema,
    kitchenPin: restaurantPinSchema,
    kitchenPinConfirm: restaurantPinSchema,
  })
  .refine((data) => data.adminPin === data.adminPinConfirm, {
    message: "Admin PIN confirmation does not match.",
    path: ["adminPinConfirm"],
  })
  .refine((data) => data.cashierPin === data.cashierPinConfirm, {
    message: "Cashier PIN confirmation does not match.",
    path: ["cashierPinConfirm"],
  })
  .refine((data) => data.kitchenPin === data.kitchenPinConfirm, {
    message: "Kitchen PIN confirmation does not match.",
    path: ["kitchenPinConfirm"],
  });

export const restaurantSettingsSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(500),
  address: z.string().min(2).max(300),
  slug: restaurantSlugSchema,
  currency: z.string().min(3).max(3),
  isOpen: z.boolean().default(true),
});

export const staffOrderActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("markPaid") }),
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("setStatus"),
    status: z.enum([
      "AWAITING_PAYMENT",
      "PAYMENT_CONFIRMED",
      "PREPARING",
      "ALMOST_READY",
      "READY_FOR_PICKUP",
      "COMPLETED",
      "CANCELED",
    ]),
  }),
]);
