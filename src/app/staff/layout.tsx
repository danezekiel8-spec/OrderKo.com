import type { Metadata } from "next";

export const metadata: Metadata = {
  applicationName: "OrderKo Staff",
  manifest: "/staff-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OrderKo Staff",
  },
};

export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
