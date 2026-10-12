"use client";
import type { ReactNode } from "react";
import { CommerceHeader } from "./commerce-ui";
import { useStore } from "./use-store";
import "./support.css";
export default function SupportFrame({children}:{children:ReactNode}) {
  const store = useStore();
  return <div className="hp commerce support-site"><CommerceHeader store={store}/><main className="commerce-container support-main" id="main-content">{children}</main></div>;
}
