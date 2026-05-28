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

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z
    .string()
    .trim()
    .min(5, "Enter a valid email.")
    .max(180)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email."),
  restaurantName: z.string().trim().min(2, "Enter the restaurant name.").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  companyWebsite: z.string().trim().max(200).optional().or(z.literal("")),
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

const weakPins = new Set(["000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999", "123456", "654321", "112233", "121212"]);

function isSimpleSequence(pin: string) {
  if (pin.length < 6) return false;
  const digits = pin.split("").map(Number);
  const firstStep = digits[1] - digits[0];
  if (Math.abs(firstStep) !== 1) return false;
  return digits.every((digit, index) => index === 0 || digit - digits[index - 1] === firstStep);
}

export const restaurantPinSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "PIN must contain numbers only.")
  .min(6, "PIN must be at least 6 digits.")
  .max(12, "PIN must be 12 digits or fewer.")
  .refine((pin) => !/^(\d)\1+$/.test(pin), "PIN cannot use the same digit repeated.")
  .refine((pin) => !weakPins.has(pin), "Choose a less common PIN.")
  .refine((pin) => !isSimpleSequence(pin), "PIN cannot be a simple sequence.");

const optionalRestaurantPinSchema = restaurantPinSchema.optional().or(z.literal(""));

export const staffCredentialsMutationSchema = z.object({
  cashierPin: optionalRestaurantPinSchema,
  kitchenPin: optionalRestaurantPinSchema,
  adminPin: optionalRestaurantPinSchema,
});

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
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerImageUrl: z.string().url().optional().or(z.literal("")),
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
