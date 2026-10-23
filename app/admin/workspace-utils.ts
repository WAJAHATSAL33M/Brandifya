import { exportCsv } from "../../lib/admin-input";
export type Row = Record<string, any>;
export type AdminApi = (
  url: string,
  method?: string,
  body?: unknown,
) => Promise<any>;
export const money = (
  minor: number,
  currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR",
) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(minor || 0) / 100);
export const date = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString() : "—";
export function downloadCsv(name: string, rows: Row[]) {
  const blob = new Blob(["\ufeff" + exportCsv(rows)], {
      type: "text/csv;charset=utf-8",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
