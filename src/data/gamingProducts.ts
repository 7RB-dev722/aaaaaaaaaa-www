export interface GamingProduct {
  title: string;
  price: number;
  features: string[];
  description: string;
  safety: string;
  buyLink?: string;
  videoLink?: string;
  tier: 'basic' | 'premium' | 'exclusive';
  isPopular?: boolean;
  image?: string;
  brand: 'cheatloop' | 'sinki';
  purchase_image_id?: string | null;
}

export const gamingProducts: GamingProduct[] = [
  {
    title: "Cheatloop ESP",
    price: 40,
    features: ["Enemy Location Only (ESP)", "Lightweight & Fast", "No Aim Assist", "Tactical Advantage"],
    description: "A lightweight, safe tool that provides precise enemy location (ESP) without any aim assist or combat enhancements. Perfect for players who want a tactical edge without risking bans.",
    safety: "Safe for Main Accounts",
    buyLink: "https://checkout.thewayl.com/pay?id=cmcdygy8u005x9408h9rd85bm",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tier: "basic",
    image: "/cheatloop.png",
    brand: "cheatloop"
  },
  {
    title: "Cheatloop Normal",
    price: 45,
    features: ["ESP + Aimbot", "Smooth Combat System", "Enhanced Performance", "Account Protection"],
    description: "Combines accurate enemy detection with a smooth aimbot system. Designed for players who want better combat performance while keeping their main account secure.",
    safety: "Safe for Main Accounts",
    buyLink: "https://checkout.thewayl.com/pay?id=cmcdyeeft005w9408abqrir22",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tier: "premium",
    isPopular: true,
    image: "/cheatloop.png",
    brand: "cheatloop"
  },
  {
    title: "Cheatloop Exclusive",
    price: 50,
    features: ["ESP + Aimbot + Magic Bullet", "Wall Penetration", "Pro Player Features", "Maximum Control"],
    description: "The most powerful Cheatloop version. Includes magic bullet for shooting through walls, combined with aimbot and ESP. Built for pro players looking for full control with top-level protection.",
    safety: "Safe for Main Accounts",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tier: "exclusive",
    image: "/cheatloop.png",
    brand: "cheatloop"
  },
  {
    title: "Sinki Silver",
    price: 40,
    features: ["ESP Only", "Simple & Stable", "Wallhack Solution", "Information Advantage"],
    description: "Simple and stable wallhack solution that shows enemy positions only. Ideal for cautious players who want information without taking risks.",
    safety: "Safe for Main Accounts",
    buyLink: "https://checkout.thewayl.com/pay?id=cmcdygy8u005x9408h9rd85bm",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tier: "basic",
    image: "/sinki.jpg",
    brand: "sinki"
  },
  {
    title: "Sinki Gold",
    price: 45,
    features: ["ESP + Aimbot + Magic Bullet", "Premium Features", "Devastating Accuracy", "Combat Domination"],
    description: "A premium version combining ESP, powerful aimbot, and magic bullet for devastating accuracy. Great for dominating fights while staying protected from bans.",
    safety: "Safe for Main Accounts",
    buyLink: "https://checkout.thewayl.com/pay?id=cmcdyeeft005w9408abqrir22",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tier: "premium",
    image: "/sinki.jpg",
    brand: "sinki"
  },
  {
    title: "Sinki TDM (Streamer Edition)",
    price: 50,
    features: ["Overpowered TDM Abilities", "Streamer Optimized", "Warehouse/TDM Mode", "Legend Performance"],
    description: "Specially made for streamers and pro TDM players, this version provides superior combat power specifically for Warehouse/TDM mode in PUBG Mobile. Compete like a legend without fear of bans.",
    safety: "Safe for Main Accounts",
    buyLink: "https://checkout.thewayl.com/pay?id=cmcdyhxe9005y9408p4lsj477",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tier: "exclusive",
    image: "/sinki.jpg",
    brand: "sinki"
  }
];
