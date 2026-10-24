import type { Metadata } from "next";
import SupportFrame from "../support-frame";
import Tracker from "./tracker";
import "../account/account.css";
import "./tracking.css";
export const metadata: Metadata = {
  title: "Track your order | Brand E",
  description:
    "Follow your Brand E order, view delivery updates and find your courier tracking link.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function OrderTracking() {
  return (
    <SupportFrame>
      <Tracker />
    </SupportFrame>
  );
}
