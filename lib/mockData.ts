import { Shop, Category } from "@/types";

export const mockShops: Shop[] = [
  { id: 1, name: "Saree House", logo_url: "/images/shop1.jpg", description: "Traditional weaves" },
  { id: 2, name: "Silk Studio", logo_url: "/images/shop2.jpg", description: "Pure silks" },
  { id: 3, name: "Handloom Co", logo_url: "/images/shop3.jpg", description: "Local artisans" },
  { id: 4, name: "WeaveWorks", logo_url: "/images/shop4.jpg", description: "Designer sarees" },
  { id: 5, name: "Loom & Love", logo_url: "/images/shop5.jpg", description: "Contemporary handlooms" },
  { id: 6, name: "Tradition Threads", logo_url: "/images/shop6.jpg", description: "Heritage collections" },
  { id: 7, name: "Silk Route", logo_url: "/images/shop7.jpg", description: "Luxury silks" },
  { id: 8, name: "Cotton Comforts", logo_url: "/images/shop8.jpg", description: "Everyday sarees" },
  { id: 9, name: "Weaver's Pride", logo_url: "/images/shop9.jpg", description: "Handmade classics" },
  { id: 10, name: "Drape Studio", logo_url: "/images/shop10.jpg", description: "Designer drapes" },
  { id: 11, name: "Palace Weaves", logo_url: "/images/shop11.jpg", description: "Royal patterns" },
  { id: 12, name: "Indie Looms", logo_url: "/images/shop12.jpg", description: "Indie artisans" }
];

export const mockCategories: Category[] = [
  { id: "k1", name: "Kanjivaram", icon_url: "/images/cat1.jpg" },
  { id: "b1", name: "Banarasi", icon_url: "/images/cat2.jpg" },
  { id: "ch1", name: "Chiffon", icon_url: "/images/cat3.jpg" },
  { id: "ge1", name: "Georgette", icon_url: "/images/cat4.jpg" },
  { id: "po1", name: "Pochampally", icon_url: "/images/cat5.jpg" },
  { id: "ta1", name: "Tussar", icon_url: "/images/cat6.jpg" },
  { id: "ma1", name: "Mysore Silk", icon_url: "/images/cat7.jpg" },
  { id: "kh1", name: "Khadar", icon_url: "/images/cat8.jpg" },
  { id: "ph1", name: "Phulkari", icon_url: "/images/cat9.jpg" },
  { id: "pa1", name: "Patola", icon_url: "/images/cat10.jpg" },
  { id: "ch2", name: "Chanderi", icon_url: "/images/cat11.jpg" },
  { id: "or1", name: "Orissa Ikat", icon_url: "/images/cat12.jpg" }
];

export const mockFeatured = Array.from({ length: 8 }).map((_, i) => ({
  id: `f${i + 1}`,
  title: `Featured Saree ${i + 1}`,
  image_url: `/images/feat${(i % 6) + 1}.svg`,
}));

export const mockAnnouncements = [
  { id: 'a1', title: 'Check Collections', image_url: '/images/announce1.svg', target: '/categories' },
  { id: 'a2', title: 'Summer Sale', image_url: '/images/announce2.svg', target: '/shops' },
  { id: 'a3', title: 'New Arrivals', image_url: '/images/announce3.svg', target: '/featured' },
  { id: 'a4', title: 'Festive Picks', image_url: '/images/announce4.svg', target: '/collections/festive' }
];
