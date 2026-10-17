import {
  Monitor,
  Shirt,
  House,
  ShoppingCart,
  Dumbbell,
  Flower2,
  Watch,
  ShoppingBag,
} from "lucide-react";
export const departments = [
  {
    name: "Electronics",
    category: "Tech",
    icon: Monitor,
    links: [
      "Mobile Phones",
      "Laptops & Computers",
      "Audio & Accessories",
      "Cameras & Photography",
      "Gaming & Consoles",
      "Smart Wearables",
    ],
  },
  {
    name: "Fashion",
    category: "Fashion",
    icon: Shirt,
    links: [
      "Men’s Fashion",
      "Women’s Fashion",
      "Kid’s Fashion",
      "Shoes & Sneakers",
      "Bags & Luggage",
      "Watches",
    ],
  },
  {
    name: "Home",
    category: "Home",
    icon: House,
    links: [
      "Kitchen Appliances",
      "Home Decor",
      "Furniture",
      "Bedding & Bath",
      "Storage & Organization",
      "Lighting",
    ],
  },
  {
    name: "Grocery & Food",
    short: "Grocery",
    category: "Grocery",
    icon: ShoppingCart,
    links: [
      "Fruits & Vegetables",
      "Beverages",
      "Snacks & Packaged Food",
      "Dairy & Breakfast",
      "Cooking Essentials",
      "Organic & Healthy Food",
    ],
  },
  {
    name: "Sports",
    category: "Sports",
    icon: Dumbbell,
    links: [
      "Exercise Equipment",
      "Fitness Accessories",
      "Outdoor & Camping",
      "Sportswear",
      "Cycling & Bikes",
      "Nutrition & Supplements",
    ],
  },
  {
    name: "Beauty & Personal Care",
    short: "Beauty",
    category: "Beauty",
    icon: Flower2,
    links: [
      "Skincare",
      "Hair Care",
      "Makeup",
      "Fragrances",
      "Personal Hygiene",
      "Beauty Tools",
    ],
  },
  {
    name: "Watches",
    category: "Accessories",
    icon: Watch,
    links: [
      "Men’s Watches",
      "Women’s Watches",
      "Smart Watches",
      "Luxury Watches",
      "Kids’ Watches",
      "Watch Accessories",
    ],
  },
  {
    name: "Accessories",
    category: "Accessories",
    icon: ShoppingBag,
    links: [
      "Bags & Backpacks",
      "Sunglasses",
      "Jewelry & Fashion Jewelry",
      "Belts & Wallets",
      "Hats & Caps",
      "Travel Accessories",
    ],
  },
];
export const categoryTiles = [
  { name: "Electronics", category: "Tech", image: "/categories/electronics.webp" },
  { name: "Fashion", category: "Fashion", image: "/categories/fashion.webp" },
  { name: "Grocery", category: "Grocery", image: "/categories/grocery.webp" },
  { name: "Home", category: "Home", image: "/categories/home-decor.webp" },
  { name: "Kitchen", category: "Kitchen", image: "/categories/home.webp" },
  { name: "Sports", category: "Sports", image: "/categories/fitness.webp" },
  { name: "Gadgets", category: "Gadgets", image: "/categories/gadgets.webp" },
];
export const referencePrices = [
  "$89.99",
  "$49.99",
  "$69.99",
  "$79.99",
  "$59.99",
  "$64.99",
  "$89.99",
  "$49.99",
];
export type ReferenceProduct = {
  name: string;
  description: string;
  price: string;
  old: string;
  badge?: string;
  rating: string;
  sold: string;
  hot?: string;
};
export const dealProducts: ReferenceProduct[] = [
  {
    name: "Brande Classic Sunglasses for Everyday Styling, Travel Outfits and Casual Accessories Collections Throughout the Seasons",
    description: "Timeless style with all-day UV protection.",
    price: "$59.00",
    old: "$79.00",
    rating: "4.8",
    sold: "2.1K sold",
    hot: "5.3K+ Sold",
  },
  {
    name: "Brande SafeView Safety Sunglasses for Everyday Accessories Collections, Outdoor Outfit Styling and Your Travel Essentials",
    description: "Rugged protection for work and adventure.",
    price: "$63.00",
    old: "$79.00",
    rating: "4.7",
    sold: "1.8K sold",
    hot: "3.2K+ Sold",
  },
  {
    name: "Brande Vogue Sunglasses for Everyday Fashion Collections, Casual Weekend Outfits and Your Favourite Seasonal Accessories",
    description: "Effortless style for everyday moments.",
    price: "$49.00",
    old: "$59.00",
    rating: "4.6",
    sold: "1.2K sold",
    hot: "2.6K+ Sold",
  },
  {
    name: "Brande Travel Shoe Bags Set of Two for Organising Footwear, Planning Your Packing List and Keeping Travel Essentials Together",
    description: "Keep your shoes organised wherever you go.",
    price: "$34.00",
    old: "$49.00",
    rating: "4.8",
    sold: "2.4K sold",
    hot: "4.1K+ Sold",
  },
  {
    name: "Brande Sneaker Cleaning Kit for Everyday Footwear Care Routines, Shoe Collections and Your Personal Wardrobe Essentials",
    description: "Everything you need for fresh, clean kicks.",
    price: "$29.00",
    old: "$39.00",
    rating: "4.7",
    sold: "1.9K sold",
    hot: "3.9K+ Sold",
  },
  {
    name: "Brande Wall-Mounted Shoehorn for Your Everyday Footwear Routine, Entrance Organisation and Thoughtfully Arranged Home Spaces",
    description: "A simple, elegant solution for everyday ease.",
    price: "$27.00",
    old: "$35.00",
    rating: "4.6",
    sold: "1.1K sold",
    hot: "1.8K+ Sold",
  },
];
export const bestProducts: ReferenceProduct[] = [
  {
    name: "Wireless Noise Cancelling Headphones for Everyday Listening, Personal Audio Collections and Music at Home or on the Go",
    badge: "Best Seller",
    description: "",
    price: "$79.00",
    old: "$129.00",
    rating: "4.8",
    sold: "2.1K sold",
  },
  {
    name: "Smart Watch with Health Tracking for Everyday Wear, Personal Activity Routines and Your Favourite Daily Accessories Collection",
    description: "",
    price: "$59.00",
    old: "$89.00",
    rating: "4.7",
    sold: "1.8K sold",
  },
  {
    name: "Elegant Tote Handbag for Everyday Use, Daily Essentials, Office Outfit Styling and Your Favourite Weekend Accessories Collection",
    description: "",
    price: "$49.00",
    old: "$69.00",
    rating: "4.8",
    sold: "3.2K sold",
  },
  {
    name: "Casual Sneakers for Daily Comfort, Everyday Outfit Styling, Relaxed Weekend Looks and Your Seasonal Footwear Collection",
    badge: "Trending",
    description: "",
    price: "$39.00",
    old: "$59.00",
    rating: "4.6",
    sold: "2.9K sold",
  },
  {
    name: "Aroma Diffuser with LED Light for Everyday Home Styling, Relaxing Corners and Your Favourite Interior Accessories Collection",
    description: "",
    price: "$29.00",
    old: "$39.00",
    rating: "4.7",
    sold: "1.4K sold",
  },
  {
    name: "Classic Sunglasses with UV Protection for Everyday Outfit Styling, Casual Travel Looks and Your Seasonal Accessories Collection",
    description: "",
    price: "$34.00",
    old: "$49.00",
    rating: "4.6",
    sold: "2.0K sold",
  },
];
export const journalPosts = [
  {
    "title": "A Calmer Home, One Corner at a Time",
    "tag": "HOME & LIVING",
    "slug": "a-calmer-home",
    "image": "/heroes/home-tech.webp"
  },
  {
    "title": "The Everyday Bag Checklist",
    "tag": "FASHION & ACCESSORIES",
    "slug": "everyday-bag-checklist",
    "image": "/heroes/fashion.webp"
  },
  {
    "title": "Make Room for More Thoughtful Shopping",
    "tag": "EVERYDAY IDEAS",
    "slug": "thoughtful-shopping",
    "image": "/heroes/everyday.webp"
  }
];

export const referenceNames = [
  "Vintage Leather Backpack",
  "Ceramic Aroma Diffuser",
  "Smart Fitness Band",
  "Women’s Tote Bag",
  "Electric Kettle 1.7L",
  "Skincare Serum Set",
  "Casual Loafers",
  "Portable Bluetooth Speaker",
];

