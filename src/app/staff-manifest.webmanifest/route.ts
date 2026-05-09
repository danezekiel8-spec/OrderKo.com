import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    name: "OrderKo Staff",
    short_name: "OK Staff",
    description: "Cashier and kitchen operations for OrderKo restaurants.",
    id: "/orderko-staff",
    start_url: "/staff/login",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f5",
    theme_color: "#0f766e",
    categories: ["business", "productivity", "food"],
    icons: [
      {
        src: "/orderko-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/orderko-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Cashier",
        short_name: "Cashier",
        description: "Open the cashier payment dashboard.",
        url: "/staff/cashier",
        icons: [{ src: "/orderko-icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Kitchen",
        short_name: "Kitchen",
        description: "Open the kitchen order queue.",
        url: "/staff/kitchen",
        icons: [{ src: "/orderko-icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  });
}
