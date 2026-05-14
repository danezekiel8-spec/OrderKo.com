import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OrderKo Super Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
