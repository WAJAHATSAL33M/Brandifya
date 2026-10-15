import { storeContact, storeContactMessage } from "./store-contact";
export type SupportPage = {
  slug: string;
  title: string;
  description: string;
  sections: { title: string; text: string }[];
};
export const supportPages: SupportPage[] = [
  {
    slug: "about",
    title: "About Brande",
    description: "Everyday finds, thoughtfully brought together.",
    sections: [
      {
        title: "A store for everyday living",
        text: "Brande brings home essentials, fashion, accessories and technology into one easy-to-browse collection. Explore by category, compare products and save your favorites for later.",
      },
      {
        title: "A clearer shopping experience",
        text: "Product pages bring the price, available stock and product information together. Your cart keeps the items you select, while Favorites helps you return to products you like.",
      },
      {
        title: "Our store today",
        text: "This storefront is currently a design preview. Product prices, ratings and sales figures are sample content. Verified inventory, merchant details and final service policies will be supplied before live ordering.",
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact Us",
    description: "Find the right help for your question.",
    sections: [
      { title: "Email", text: storeContact.email },
      { title: "Phone", text: storeContact.phone },
      { title: "Our address", text: storeContact.address },
      {
        title: "Product questions",
        text: "Include the product name or reference and tell us what you would like to know. Check the product page for the information currently available.",
      },
      {
        title: "Order questions",
        text: "If you have an order reference, keep it ready together with the email used at checkout. Never send card details, passwords or one-time payment codes.",
      },
      {
        title: "Customer support",
        text: storeContactMessage,
      },
    ],
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    description: "Helpful answers before you shop.",
    sections: [
      {
        title: "Can I place an order now?",
        text: "Live ordering is currently disabled while the store is being prepared. Adding items to your cart lets you explore the shopping experience without placing an order.",
      },
      {
        title: "How do Favorites work?",
        text: "Open a product page and select Add to Favorite. Your selections are saved in this browser and can be found through Favorites in the menu.",
      },
      {
        title: "How do Buy Now and the cart icon work?",
        text: "Buy Now adds the selected quantity and opens your cart. The cart icon adds the product without leaving the page and shows a Go to Cart link.",
      },
      {
        title: "Are the ratings and prices final?",
        text: "The preview includes sample prices, ratings and sales figures. They are not verified customer feedback or final offers.",
      },
      {
        title: "How can I check delivery or returns?",
        text: "Visit Shipping Information and Return & Refund Policy. Final charges, delivery areas and return conditions will be confirmed before live ordering.",
      },
      {
        title: "Can I use Favorites on another device?",
        text: "Favorites and cart items are currently stored locally in your browser. They do not automatically sync between devices.",
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping Information",
    description: "Delivery details in one place.",
    sections: [
      {
        title: "Delivery availability",
        text: "Delivery countries, service areas and dispatch arrangements are awaiting merchant confirmation. Do not assume that every address is currently supported.",
      },
      {
        title: "Charges and timing",
        text: "Final shipping charges will be shown during checkout when ordering is enabled. Dispatch times and estimated delivery windows will be published before launch; no delivery date is promised in this preview.",
      },
      {
        title: "Your delivery address",
        text: "Check your recipient name, address and contact details before submitting an order. Address changes after submission may depend on dispatch status.",
      },
      {
        title: "Delivery concerns",
        text: "Provide your order reference when reporting a delivery issue. Use Order Tracking for the order information currently available.",
      },
    ],
  },
  {
    slug: "returns",
    title: "Return & Refund Policy",
    description: "Know what to check before requesting a return.",
    sections: [
      {
        title: "Policy status",
        text: "This policy is a draft for the current store preview. The merchant must confirm the return window, eligible products, fees and refund arrangements before accepting live orders.",
      },
      {
        title: "Requesting a return",
        text: "Contact our support team with your order reference, the product and the reason for your request. Wait for return instructions before sending an item.",
      },
      {
        title: "Product condition and eligibility",
        text: "Keep the packaging, accessories and proof of purchase. Product-specific exclusions and any rules for opened, used or personalized items will be published with the final policy.",
      },
      {
        title: "Damaged or incorrect items",
        text: "Keep the packaging and document the issue. Contact support with your order details so the merchant can review the delivery and advise on the next steps.",
      },
      {
        title: "Refunds",
        text: "The final policy will explain how returns are reviewed, which payment method is used for refunds, expected processing times and treatment of delivery charges. No refund timeframe is promised in this preview.",
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description: "How this store currently handles information.",
    sections: [
      {
        title: "About this notice",
        text: "This notice describes the current storefront implementation. The merchant’s legal identity, contact details, service providers and final retention rules must be confirmed before live launch.",
      },
      {
        title: "Cart and Favorites",
        text: "The store saves cart items and Favorites in your browser’s local storage. This information helps restore your selections on later visits in the same browser. Clearing browser storage removes those local selections.",
      },
      {
        title: "Orders and payments",
        text: "When live checkout is enabled, delivery and order information is processed to manage orders. Card details are handled by the configured payment provider rather than entered into a store-managed card database. Payment logos in the footer do not mean every method is currently enabled.",
      },
      {
        title: "Newsletter",
        text: "If newsletter signup is configured, the email address submitted with consent is stored for subscriptions. Contact the merchant through the verified support channel when available for subscription or data requests.",
      },
      {
        title: "Service providers and retention",
        text: "Hosting, database and payment services may process information needed to operate the store. The merchant must publish the relevant provider details, retention periods and any applicable international transfer information before launch.",
      },
      {
        title: "Your requests",
        text: "For questions about access, correction or deletion, contact our support team. Applicable rights and any verification requirements depend on the final merchant setup and relevant law.",
      },
      {
        title: "Customer accounts",
        text: "When accounts are configured, we store your name, email, password hash, saved delivery profile and account-linked order history. Passwords are stored as hashes, not readable text. Only the signed-in account can access its linked orders. Changing profile details does not alter the delivery information recorded for past orders. Verification and recovery emails use the configured email service. Google or Facebook sign-in uses the identity and profile information shared by that provider.",
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    description: "Information about using and shopping with Brande.",
    sections: [
      {
        title: "Store status",
        text: "The website currently demonstrates a store design. Sample products, prices and ratings are illustrative. Live orders and payments are disabled until merchant setup is complete.",
      },
      {
        title: "Product information",
        text: "Check product descriptions, variants, prices and availability before placing an order. The final merchant catalog must verify specifications and images. A cart selection alone does not create an accepted order.",
      },
      {
        title: "Ordering and payment",
        text: "Once enabled, checkout will show the order details and available payment methods. Final rules for acceptance, cancellations, pricing errors and payment confirmation must be supplied by the merchant.",
      },
      {
        title: "Shipping and returns",
        text: "Read Shipping Information and the Return & Refund Policy before ordering. Final delivery commitments, return conditions and charges will be published before live sales.",
      },
      {
        title: "Using the website",
        text: "Use the site for lawful shopping and browsing. Do not attempt to disrupt its operation, access other customers’ information or misuse checkout and subscription features.",
      },
      {
        title: "Final terms",
        text: "The merchant must confirm its legal identity, applicable jurisdiction, statutory customer protections and complete contractual terms before launch. This preview does not replace those final terms.",
      },
    ],
  },
  {
    slug: "cookies-policy",
    title: "Cookies Policy",
    description: "Understand the browser storage used by this store.",
    sections: [
      {
        title: "Local storage",
        text: "The current storefront uses browser local storage for cart items and Favorites. Local storage differs from cookies and stays on your device until it is cleared or replaced.",
      },
      {
        title: "Cookies and other services",
        text: "No optional analytics or advertising consent system has been configured in this preview. Hosting and payment integrations may introduce cookies or similar technologies when configured; the merchant must verify these before launch.",
      },
      {
        title: "Managing your browser",
        text: "You can clear cookies and site storage in your browser settings. Clearing site storage removes locally saved cart items and Favorites. Blocking storage may prevent those features from persisting.",
      },
      {
        title: "Future changes",
        text: "Before adding optional tracking, the merchant must update this notice with the technologies, providers, purposes and durations actually used and implement any applicable consent controls.",
      },
      {
        title: "Account sign-in cookies",
        text: "Configured customer accounts use an essential, HttpOnly session cookie lasting up to 14 days. It is Secure on HTTPS and uses SameSite protection. Social sign-in also uses a short-lived, essential cookie to check that the returning sign-in request belongs to your browser. Signing out removes the current session. These cookies are used for authentication, not advertising.",
      },
    ],
  },
  {
    slug: "payments",
    title: "Payment Information",
    description: "A clear view of payment options.",
    sections: [
      {
        title: "Current availability",
        text: "Live payments are disabled in this preview. No payment is collected when you explore products or add them to the cart.",
      },
      {
        title: "Payment brands",
        text: "Visa, MasterCard, EasyPaisa, JazzCash and PayFast marks appear in the footer. The payment methods actually available for an order will be shown at checkout after configuration.",
      },
      {
        title: "Payment safety",
        text: "Only use the store’s configured checkout flow. Never share your card security code, account password or one-time code with someone claiming to help with an order.",
      },
      {
        title: "Confirmation",
        text: "A confirmed order page will show the recorded order status. An interrupted or cancelled payment should not be treated as a successful payment.",
      },
    ],
  },
  {
    slug: "size-guide",
    title: "Size Guide",
    description: "Check the fit before choosing.",
    sections: [
      {
        title: "Use the product’s measurements",
        text: "Check the measurements and sizing information on each product page. Final size charts have not yet been supplied for the sample catalog.",
      },
      {
        title: "Clothing and footwear",
        text: "Compare the merchant’s product-specific chart with your measurements. Size labels can differ between brands and styles; do not rely on a generic conversion alone.",
      },
      {
        title: "Bags and home products",
        text: "Check the dimensions of the item against your intended use, available space or the items you need it to hold.",
      },
      {
        title: "Need clarification?",
        text: "Ask support about the product reference using the contact details on our Contact Us page. Do not assume a sample image confirms size or fit.",
      },
    ],
  },
  {
    slug: "order-tracking",
    title: "Order Tracking",
    description: "Find the status associated with your order.",
    sections: [
      {
        title: "Your order reference",
        text: "After a real order is submitted, keep the order reference from the confirmation page. The existing order page displays order details when a valid confirmation is available.",
      },
      {
        title: "Tracking availability",
        text: "Courier tracking and a customer order lookup service have not yet been configured. This preview does not offer a live parcel tracker.",
      },
      {
        title: "Need help?",
        text: "Share your order reference and the checkout email through the merchant’s verified channel. Do not share payment credentials.",
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    description: "An easier store to browse and use.",
    sections: [
      {
        title: "Using the store",
        text: "The store supports keyboard navigation, visible focus styles and labels for icon controls. Responsive layouts adapt to desktop, tablet and mobile screens.",
      },
      {
        title: "Motion preferences",
        text: "Automatic animations respect your device’s reduced-motion setting. Product images can be enlarged on the product page.",
      },
      {
        title: "Report a difficulty",
        text: "Once support details are confirmed, describe the page, device and task that caused difficulty. Accessibility improvements are an ongoing part of maintaining the store.",
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Website Disclaimer",
    description: "About the information in this preview.",
    sections: [
      {
        title: "Sample content",
        text: "Products, prices, promotional information, ratings and sales counts shown in the preview may be sample content. They should not be interpreted as verified offers or customer reviews.",
      },
      {
        title: "Editorial information",
        text: "Journal articles provide general shopping and organization ideas. Check product instructions and verified specifications for any product you intend to buy.",
      },
      {
        title: "Brands and images",
        text: "Brand names and payment marks identify the displayed brands. Their appearance does not establish reseller authorization or confirm that a payment method is enabled.",
      },
      {
        title: "Before launch",
        text: "The merchant must review the final catalog, editorial information, contact details and policies before accepting orders.",
      },
    ],
  },
];
export type JournalPost = {
  slug: string;
  title: string;
  tag: string;
  image: string;
  description: string;
  sections: { title: string; text: string }[];
};
export const posts: JournalPost[] = [
  {
    slug: "a-calmer-home",
    title: "A Calmer Home, One Corner at a Time",
    tag: "HOME & LIVING",
    image: "/heroes/home-tech.webp",
    description:
      "Simple ways to make a useful, comfortable corner without filling every inch.",
    sections: [
      {
        title: "Start with one purpose",
        text: "Choose a corner and decide what you want it to do: reading, preparing a drink or keeping daily essentials within reach. A clear purpose makes it easier to choose what belongs there.",
      },
      {
        title: "Measure before you browse",
        text: "Note the available width and depth, nearby sockets and the space needed to walk past. Compare those measurements with the product information rather than judging scale from a photo.",
      },
      {
        title: "Let everyday use guide the details",
        text: "Keep the objects you reach for most within easy reach. Choose storage around what you actually own and leave a little space for changing routines.",
      },
      {
        title: "Build gradually",
        text: "Start with a useful piece and see how the corner feels in everyday use. Add lighting, texture or storage only when it solves something you have noticed.",
      },
    ],
  },
  {
    slug: "everyday-bag-checklist",
    title: "The Everyday Bag Checklist",
    tag: "FASHION & ACCESSORIES",
    image: "/heroes/fashion.webp",
    description:
      "Think about capacity, comfort and your routine before choosing a daily bag.",
    sections: [
      {
        title: "Know what you carry",
        text: "Lay out your daily essentials. Include your laptop or notebook, charger, keys and the extras you regularly use. Check the bag’s measurements against the largest item.",
      },
      {
        title: "Consider the journey",
        text: "Think about how long you carry the bag and whether you walk, commute or travel. Check strap dimensions and the merchant’s material information; appearance alone cannot confirm comfort.",
      },
      {
        title: "Choose useful organization",
        text: "A few accessible compartments can be more practical than many pockets you rarely use. Consider where keys, a phone and other small items will go.",
      },
      {
        title: "Check care and construction",
        text: "Read care instructions and verified details about closures, lining and materials. Ask questions before ordering when a feature matters to you.",
      },
    ],
  },
  {
    slug: "thoughtful-shopping",
    title: "Make Room for More Thoughtful Shopping",
    tag: "EVERYDAY IDEAS",
    image: "/heroes/everyday.webp",
    description:
      "A practical approach to comparing products and deciding what earns a place in your day.",
    sections: [
      {
        title: "Start with a need",
        text: "Describe the task you want a product to help with. This keeps your browsing focused and helps you recognize when a feature is useful to you.",
      },
      {
        title: "Compare the details",
        text: "Look at dimensions, compatibility, materials and care instructions. Check which details have been verified and ask for missing information before buying.",
      },
      {
        title: "Use Favorites as a shortlist",
        text: "Save a product from its product page, then return to Favorites to reconsider your options. A shortlist gives you time to compare without keeping every item in your cart.",
      },
      {
        title: "Review the full order",
        text: "When live ordering becomes available, review the product, quantity, delivery charges and return policy before submitting checkout. Choose around your routine and budget.",
      },
    ],
  },
];

