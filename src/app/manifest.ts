import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrderKo.com",
    short_name: "OrderKo",
    description: "Lightweight QR ordering for small restaurants and cafes.",
    start_url: "/r/g-cafe",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f5",
    theme_color: "#0f766e",
    categories: ["food", "business", "productivity"],
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
