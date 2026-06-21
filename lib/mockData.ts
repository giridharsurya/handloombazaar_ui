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

// Sarees for each shop
export const mockShopSarees: { [shopId: number]: { id: string; title: string; image_url?: string }[] } = {
  1: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop1-saree${i + 1}`,
    title: `Saree House - Traditional Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  2: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop2-saree${i + 1}`,
    title: `Silk Studio - Pure Silk Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  3: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop3-saree${i + 1}`,
    title: `Handloom Co - Artisan Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  4: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop4-saree${i + 1}`,
    title: `WeaveWorks - Designer Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  5: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop5-saree${i + 1}`,
    title: `Loom & Love - Contemporary Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  6: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop6-saree${i + 1}`,
    title: `Tradition Threads - Heritage Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  7: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop7-saree${i + 1}`,
    title: `Silk Route - Luxury Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  8: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop8-saree${i + 1}`,
    title: `Cotton Comforts - Everyday Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  9: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop9-saree${i + 1}`,
    title: `Weaver's Pride - Handmade Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  10: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop10-saree${i + 1}`,
    title: `Drape Studio - Designer Drape ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  11: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop11-saree${i + 1}`,
    title: `Palace Weaves - Royal Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  12: Array.from({ length: 8 }).map((_, i) => ({
    id: `shop12-saree${i + 1}`,
    title: `Indie Looms - Indie Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
};

// Sarees for each category
export const mockCategorySarees: { [categoryId: string]: { id: string; title: string; image_url?: string }[] } = {
  k1: Array.from({ length: 8 }).map((_, i) => ({
    id: `kanjivaram-saree${i + 1}`,
    title: `Kanjivaram Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  b1: Array.from({ length: 8 }).map((_, i) => ({
    id: `banarasi-saree${i + 1}`,
    title: `Banarasi Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  ch1: Array.from({ length: 8 }).map((_, i) => ({
    id: `chiffon-saree${i + 1}`,
    title: `Chiffon Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  ge1: Array.from({ length: 8 }).map((_, i) => ({
    id: `georgette-saree${i + 1}`,
    title: `Georgette Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  po1: Array.from({ length: 8 }).map((_, i) => ({
    id: `pochampally-saree${i + 1}`,
    title: `Pochampally Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  ta1: Array.from({ length: 8 }).map((_, i) => ({
    id: `tussar-saree${i + 1}`,
    title: `Tussar Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  ma1: Array.from({ length: 8 }).map((_, i) => ({
    id: `mysore-saree${i + 1}`,
    title: `Mysore Silk Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  kh1: Array.from({ length: 8 }).map((_, i) => ({
    id: `khadar-saree${i + 1}`,
    title: `Khadar Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  ph1: Array.from({ length: 8 }).map((_, i) => ({
    id: `phulkari-saree${i + 1}`,
    title: `Phulkari Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  pa1: Array.from({ length: 8 }).map((_, i) => ({
    id: `patola-saree${i + 1}`,
    title: `Patola Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  ch2: Array.from({ length: 8 }).map((_, i) => ({
    id: `chanderi-saree${i + 1}`,
    title: `Chanderi Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
  or1: Array.from({ length: 8 }).map((_, i) => ({
    id: `orissa-saree${i + 1}`,
    title: `Orissa Ikat Saree ${i + 1}`,
    image_url: `/images/feat${(i % 6) + 1}.svg`,
  })),
};

// All sarees
export const mockSarees = [
  { id: 's1', title: 'Kanjivaram Silk Saree', price: 15000, category: 'Kanjivaram', shop_name: 'Saree House', shop_id: 1, shop_logo_url: '/images/shop1.jpg', image_url: '/images/feat1.svg', description: 'Traditional Kanjivaram silk with intricate zari work' },
  { id: 's2', title: 'Banarasi Silk Saree', price: 12000, category: 'Banarasi', shop_name: 'Silk Studio', shop_id: 2, shop_logo_url: '/images/shop2.jpg', image_url: '/images/feat2.svg', description: 'Authentic Banarasi with heavy embroidery' },
  { id: 's3', title: 'Chiffon Saree', price: 8000, category: 'Chiffon', shop_name: 'Handloom Co', shop_id: 3, shop_logo_url: '/images/shop3.jpg', image_url: '/images/feat3.svg', description: 'Light and elegant chiffon saree' },
  { id: 's4', title: 'Georgette Saree', price: 9000, category: 'Georgette', shop_name: 'WeaveWorks', shop_id: 4, shop_logo_url: '/images/shop4.jpg', image_url: '/images/feat4.svg', description: 'Designer georgette with modern prints' },
  { id: 's5', title: 'Pochampally Saree', price: 6500, category: 'Pochampally', shop_name: 'Loom & Love', shop_id: 5, shop_logo_url: '/images/shop5.jpg', image_url: '/images/feat5.svg', description: 'Ikat weave from Pochampally' },
  { id: 's6', title: 'Tussar Silk Saree', price: 10000, category: 'Tussar', shop_name: 'Tradition Threads', shop_id: 6, shop_logo_url: '/images/shop6.jpg', image_url: '/images/feat6.svg', description: 'Traditional tussar with natural colors' },
  { id: 's7', title: 'Mysore Silk Saree', price: 14000, category: 'Mysore Silk', shop_name: 'Silk Route', shop_id: 7, shop_logo_url: '/images/shop7.jpg', image_url: '/images/feat1.svg', description: 'Premium Mysore silk saree' },
  { id: 's8', title: 'Khadar Saree', price: 5000, category: 'Khadar', shop_name: 'Cotton Comforts', shop_id: 8, shop_logo_url: '/images/shop8.jpg', image_url: '/images/feat2.svg', description: 'Handwoven khadar cotton saree' },
  { id: 's9', title: 'Phulkari Saree', price: 11000, category: 'Phulkari', shop_name: "Weaver's Pride", shop_id: 9, shop_logo_url: '/images/shop9.jpg', image_url: '/images/feat3.svg', description: 'Beautiful phulkari embroidery' },
  { id: 's10', title: 'Patola Saree', price: 18000, category: 'Patola', shop_name: 'Drape Studio', shop_id: 10, shop_logo_url: '/images/shop10.jpg', image_url: '/images/feat4.svg', description: 'Rare double ikat patola saree' },
  { id: 's11', title: 'Chanderi Saree', price: 7500, category: 'Chanderi', shop_name: 'Palace Weaves', shop_id: 11, shop_logo_url: '/images/shop11.jpg', image_url: '/images/feat5.svg', description: 'Lightweight chanderi with gold zari' },
  { id: 's12', title: 'Orissa Ikat Saree', price: 9500, category: 'Orissa Ikat', shop_name: 'Indie Looms', shop_id: 12, shop_logo_url: '/images/shop12.jpg', image_url: '/images/feat6.svg', description: 'Handwoven Orissa ikat' },
  { id: 's13', title: 'Premium Kanjivaram', price: 20000, category: 'Kanjivaram', shop_name: 'Saree House', shop_id: 1, shop_logo_url: '/images/shop1.jpg', image_url: '/images/feat1.svg', description: 'Premium pure silk Kanjivaram' },
  { id: 's14', title: 'Cotton Silk Blend', price: 6000, category: 'Chiffon', shop_name: 'Silk Studio', shop_id: 2, shop_logo_url: '/images/shop2.jpg', image_url: '/images/feat2.svg', description: 'Cotton silk blend saree' },
  { id: 's15', title: 'Art Silk Saree', price: 4500, category: 'Georgette', shop_name: 'Handloom Co', shop_id: 3, shop_logo_url: '/images/shop3.jpg', image_url: '/images/feat3.svg', description: 'Affordable art silk saree' },
  { id: 's16', title: 'Designer Saree', price: 25000, category: 'Banarasi', shop_name: 'WeaveWorks', shop_id: 4, shop_logo_url: '/images/shop4.jpg', image_url: '/images/feat4.svg', description: 'Designer exclusive banarasi' },
];
