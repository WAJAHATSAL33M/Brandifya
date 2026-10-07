import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Brande | Brandifya Store",
  description:
    "Discover home, fashion, electronics, and everyday essentials at Brande.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
