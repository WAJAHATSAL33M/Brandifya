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
        title: "Here when you need us",
        text: "Shop by category, review product details, and follow your order from checkout to delivery. Contact our Islamabad team whenever you need help.",
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
        text: "Add available products to your cart, enter your delivery details, choose a payment method shown at checkout and place your order. Keep the order reference from your confirmation page.",
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
        title: "Where can I check prices and product details?",
        text: "Check each product page for its current price and available details. Stock and the final order total are checked again at checkout. Contact us if you need clarification before ordering.",
      },
      {
        title: "How can I check delivery or returns?",
        text: "Visit Shipping Information and Return & Refund Policy. Your delivery charge is shown at checkout; contact our team for product-specific return questions.",
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
        text: "Checkout shows the supported delivery country. Enter a complete street address, city and reachable phone number so our team can process your delivery.",
      },
      {
        title: "Charges and timing",
        text: "Delivery charges are shown before you place your order. Follow preparation and dispatch updates on Order Tracking. Any courier delivery estimate is provided through the carrier tracking link.",
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
        title: "Returns and product support",
        text: "Contact our team with your order reference to request a return or report a product issue. We will review the item and explain the applicable return instructions before you send it back.",
      },
      {
        title: "Requesting a return",
        text: "Contact our support team with your order reference, the product and the reason for your request. Wait for return instructions before sending an item.",
      },
      {
        title: "Product condition and eligibility",
        text: "Keep the packaging, accessories and proof of purchase. Tell our team whether the item has been opened, used or personalized so they can advise on its eligibility.",
      },
      {
        title: "Damaged or incorrect items",
        text: "Keep the packaging and document the issue. Contact support with your order details so the merchant can review the delivery and advise on the next steps.",
      },
      {
        title: "Refunds",
        text: "After reviewing your request, our team will explain the available resolution, applicable charges and refund arrangements. Payment-provider processing times may apply. Contact us for the status of an agreed refund.",
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
        text: "Brand E uses the information you provide to operate your account, process orders, arrange delivery and respond to support requests. Contact us using the details on our Contact Us page with questions about your information.",
      },
      {
        title: "Cart and Favorites",
        text: "The store saves cart items and Favorites in your browser’s local storage. This information helps restore your selections on later visits in the same browser. Clearing browser storage removes those local selections.",
      },
      {
        title: "Orders and payments",
        text: "Delivery and order information is used to process purchases and provide tracking. Card details are handled by the payment provider rather than stored in our order database. Available payment methods are shown at checkout.",
      },
      {
        title: "Newsletter",
        text: "When you subscribe, your email address is stored for newsletter communications. Contact our team to request subscription or personal-data assistance.",
      },
      {
        title: "Service providers and retention",
        text: "Hosting, database, email and payment services process information needed to operate the store. Order records support delivery, customer service and transaction administration. Contact us to ask about the information held for your account or order.",
      },
      {
        title: "Your requests",
        text: "Contact our support team for questions about access, correction or deletion of your information. We may need to verify your identity before acting on a request.",
      },
      {
        title: "Customer accounts",
        text: "When accounts are configured, we store your name, email, password hash, saved delivery profile and account-linked order history. Passwords are stored as hashes, not readable text. Only the signed-in account can access its linked orders. Changing profile details does not alter the delivery information recorded for past orders. Verification and recovery emails use the configured email service. Google, Apple or Facebook sign-in uses the identity and profile information shared by that provider.",
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    description: "Information about using and shopping with Brande.",
    sections: [
      {
        title: "Shopping with Brand E",
        text: "Browse available products, review the full order and enter accurate delivery details at checkout. A cart selection alone does not place an order. Your confirmation page shows the order reference and recorded status.",
      },
      {
        title: "Product information",
        text: "Check product descriptions, prices and availability before ordering. Contact us about dimensions, compatibility or other details that matter to your purchase.",
      },
      {
        title: "Ordering and payment",
        text: "Checkout shows your order total and available payment methods. Card orders require payment confirmation; cash-on-delivery orders are payable on delivery. Contact us promptly about a change or cancellation before dispatch.",
      },
      {
        title: "Shipping and returns",
        text: "Read Shipping Information and the Return & Refund Policy before ordering. Keep your order reference for delivery enquiries or return requests.",
      },
      {
        title: "Using the website",
        text: "Use the site for lawful shopping and browsing. Do not attempt to disrupt its operation, access other customers’ information or misuse checkout and subscription features.",
      },
      {
        title: "Questions about your purchase",
        text: "Contact Brand E through the Contact Us page if you have a question about an order or these terms. We will explain the next steps for your enquiry.",
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
        text: "Essential cookies support account sign-in and social authentication. Payment-provider pages may use their own cookies while processing a payment. Cart items and Favorites use browser local storage.",
      },
      {
        title: "Managing your browser",
        text: "You can clear cookies and site storage in your browser settings. Clearing site storage removes locally saved cart items and Favorites. Blocking storage may prevent those features from persisting.",
      },
      {
        title: "Future changes",
        text: "This page is updated when the store’s use of cookies or browser storage changes. You can contact our team with questions about the services used on the website.",
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
        text: "Choose from the methods shown at checkout. Browsing or adding a product to the cart does not collect payment. Review your order total before submitting.",
      },
      {
        title: "Payment brands",
        text: "The methods available for your purchase are listed at checkout. Footer payment logos identify payment brands and do not guarantee that every method is offered for every order.",
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
        text: "Check the measurements and sizing information on the product page. If a measurement you need is missing, contact our team before choosing your size.",
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
        text: "Ask our support team about the product reference whenever you need help with size or fit. Product images alone may not show an item’s scale.",
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
        text: "Use your order reference and checkout phone number or email to view store updates. Courier tracking details appear when our team assigns them to your order.",
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
        text: "Contact our team and describe the page, device and task that caused difficulty. Accessibility improvements are an ongoing part of maintaining the store.",
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Website Disclaimer",
    description: "About product information and using this website.",
    sections: [
      {
        title: "Product information",
        text: "Review product descriptions, current prices and availability before ordering. Contact us if you notice an inconsistency or need more information. Checkout validates stock and the final order total.",
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
        title: "Get in touch",
        text: "For product, delivery or order enquiries, contact our team with the relevant product name or order reference.",
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
        text: "Review the product, quantity, delivery charges and return policy before submitting checkout. Choose around your routine and budget.",
      },
    ],
  },
];
