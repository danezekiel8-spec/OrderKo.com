import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrderKo.com",
    short_name: "OrderKo",
    description: "Lightweight QR ordering for small restaurants and cafes.",
    id: "/orderko-customer",
    start_url: "/r/g-cafe",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f5",
    theme_color: "#0f766e",
    categories: ["food", "business", "productivity"],
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
      {
        name: "Admin",
        short_name: "Admin",
        description: "Open the owner dashboard.",
        url: "/admin",
        icons: [{ src: "/orderko-icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
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
  };
}
