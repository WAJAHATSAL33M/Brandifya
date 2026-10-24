import { Check } from "lucide-react";
export default function OrderProgress({ status }: { status: string }) {
  const steps = ["Order placed", "Preparing", "Shipped", "Delivered"],
    index =
      status === "delivered"
        ? 3
        : status === "shipped"
          ? 2
          : status === "processing"
            ? 1
            : 0;
  if (status === "cancelled")
    return (
      <p className="customer-note">
        This order was cancelled. Contact us if you need help.
      </p>
    );
  if (status === "awaiting_payment")
    return (
      <p className="customer-note">
        Payment is pending. Your order will be confirmed once payment is
        received.
      </p>
    );
  return (
    <ol className="customer-progress" aria-label="Delivery progress">
      {steps.map((step, i) => (
        <li
          key={step}
          className={i <= index ? "complete" : ""}
          aria-current={i === index ? "step" : undefined}
        >
          <span>{i < index ? <Check size={12} /> : i + 1}</span>
          <small>{step}</small>
        </li>
      ))}
    </ol>
  );
}
