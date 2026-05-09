import type { OrderStatus } from "@prisma/client";

export const customerStatuses: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "ALMOST_READY",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

export const statusLabels: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PREPARING: "Preparing",
  ALMOST_READY: "Almost Ready",
  READY_FOR_PICKUP: "Ready for Pickup",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_PAYMENT: ["PAYMENT_CONFIRMED", "CANCELED"],
  PAYMENT_CONFIRMED: ["PREPARING", "CANCELED"],
  PREPARING: ["ALMOST_READY", "READY_FOR_PICKUP", "CANCELED"],
  ALMOST_READY: ["READY_FOR_PICKUP", "CANCELED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to);
}

export function minutesSince(date: Date | string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}
