import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const kioskUrl = `/k/${slug}`;

  return NextResponse.json({
    name: "OrderKo Kiosk",
    short_name: "OK Kiosk",
    description: "Touchscreen kiosk ordering for OrderKo restaurants.",
    id: `/orderko-kiosk-${slug}`,
    start_url: kioskUrl,
    scope: "/k/",
    display: "fullscreen",
    orientation: "any",
    background_color: "#f7f4ed",
    theme_color: "#b42318",
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
    shortcuts: [
      {
        name: "Open kiosk",
        short_name: "Kiosk",
        description: "Open the restaurant kiosk ordering screen.",
        url: kioskUrl,
        icons: [{ src: "/orderko-icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  });
}
