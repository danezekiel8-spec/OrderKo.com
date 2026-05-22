import type { Metadata } from "next";

export const metadata: Metadata = {
  applicationName: "OrderKo Admin",
  robots: {
    index: false,
    follow: false,
  },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OrderKo Admin",
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
