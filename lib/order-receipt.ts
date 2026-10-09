export type OrderReceipt = {
  id: string;
  status: string;
  paymentMethod: "cod" | "stripe";
  currency: string;
  totalMinor: number;
  shippingMinor: number;
  createdAt: string;
  customer: Record<string, string>;
  items: {
    id: number;
    name: string;
    price_minor: number;
    quantity: number;
    image?: string;
    color?: string;
  }[];
};
