import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "OfficeStore",
  description: "Office supplies e-commerce platform",
  icons: {
    icon: "/logo_vpp.jpg",
    shortcut: "/logo_vpp.jpg",
    apple: "/logo_vpp.jpg",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
