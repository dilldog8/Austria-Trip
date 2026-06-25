import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valuator AI — Internal Drafting Tool",
  description: "Internal AI-assisted valuation report drafting tool.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
