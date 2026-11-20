import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitSmart",
  description: "Share expenses and track balances in your groups.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
