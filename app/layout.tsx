import type { Metadata } from "next";
import "./globals.css";
import "./homepage.css";
import "./commerce.css";
import "./heading-style.css";
import StoreFooter from "./store-footer";
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
      <body>{children}<StoreFooter live={process.env.STORE_LIVE === "true"} /></body>
    </html>
  );
}

