import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { MenuOptionGroup } from "@/lib/menu";

export type MenuItemDto = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  isSoldOut: boolean;
  optionGroups: MenuOptionGroup[];
};

export type MenuCategoryDto = {
  id: string;
  name: string;
  items: MenuItemDto[];
};

export type MenuResponse = {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    description: string;
    address: string;
    currency: string;
    isOpen: boolean;
    isServiceActive: boolean;
  };
  categories: MenuCategoryDto[];
};

export type SelectedOptionDto = {
  groupName: string;
  optionName: string;
  priceCents: number;
};

export type StaffOrderDto = {
  id: string;
  orderCode: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalCents: number;
  customerName: string | null;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant: { name: string; currency: string };
  items: {
    id: string;
    name: string;
    quantity: number;
    note: string | null;
    selectedOptions: SelectedOptionDto[];
    lineTotalCents: number;
  }[];
};
