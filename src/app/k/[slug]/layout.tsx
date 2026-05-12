import type { Metadata, Viewport } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    applicationName: "OrderKo Kiosk",
    manifest: `/k/${slug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "OrderKo Kiosk",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#d7b98a",
};

export default function KioskLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
