"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Ribbon from "@/components/Ribbon/Ribbon";
import ProductCard from "@/components/Product/Product";
import type { Product, Shop } from "@/types";

type ProductDetailsProps = {
  product: Product;
  shop: Shop | null;
  variants: Product[];
  similarFromShop: Product[];
  similarFromOtherShops: Product[];
};

function inferFeatureFromProduct(product: Product) {
  const title = product.title.toLowerCase();

  const fabric = title.includes("silk")
    ? "Silk"
    : title.includes("cotton")
      ? "Cotton"
      : title.includes("chiffon")
        ? "Chiffon"
        : title.includes("georgette")
          ? "Georgette"
          : "Handloom Blend";

  const color = title.includes("gold")
    ? "Gold"
    : title.includes("red")
      ? "Red"
      : title.includes("blue")
        ? "Blue"
        : "Assorted";

  const craft = product.category;

  return { fabric, color, craft };
}

export default function ProductDetails({
  product,
  shop,
  variants,
  similarFromShop,
  similarFromOtherShops,
}: ProductDetailsProps) {
  const features = inferFeatureFromProduct(product);
  const shopName = shop?.name ?? product.shop_name;

  const galleryImages = useMemo(() => {
    const pool = [
      product.image_url,
      ...variants.map((item) => item.image_url),
      ...similarFromShop.map((item) => item.image_url),
      ...similarFromOtherShops.map((item) => item.image_url),
    ];

    const unique = pool.filter((url, index) => pool.indexOf(url) === index);
    return unique.slice(0, 8);
  }, [product.image_url, variants, similarFromShop, similarFromOtherShops]);

  const [selectedImage, setSelectedImage] = useState(product.image_url);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-amber-50/20 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 px-4 py-4">
      <div className="mb-4 text-xs tracking-wide text-gray-500 dark:text-gray-400">
        Home / Sarees / <span className="text-gray-700 dark:text-gray-200">{product.title}</span>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start pb-3">
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 pb-1">
          <div className="pr-1">
            <div className="flex flex-col gap-2">
              {galleryImages.map((imageUrl, index) => {
                const isActive = selectedImage === imageUrl;
                return (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(imageUrl)}
                    aria-label={`Preview image ${index + 1}`}
                    className={`relative w-[4rem] h-[5rem] rounded-md overflow-hidden transition-all ${
                      isActive
                        ? "ring-2 ring-rose-300 dark:ring-rose-500/40"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${product.title} preview ${index + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden pb-2">
            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto">
              <Image
                src={selectedImage}
                alt={product.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="p-2 lg:p-3">
            <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.title}
            </h1>

          <div className="mt-4 flex items-end gap-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">MRP</p>
            <p className="text-3xl font-bold text-rose-600">Rs. {product.price.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inclusive of all taxes</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-semibold text-gray-900 dark:text-white">Fabric:</span> {features.fabric}
            </p>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <p>
              <span className="font-semibold text-gray-900 dark:text-white">Color:</span> {features.color}
            </p>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <p>
              <span className="font-semibold text-gray-900 dark:text-white">Craft:</span> {features.craft}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={product.shop_logo_url}
                  alt={product.shop_name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Sold by</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{shopName}</p>
              </div>
            </div>
            <a href={`/shops/${product.shop_id}`} className="text-sm font-medium text-rose-600 hover:underline">
              Visit shop
            </a>
          </div>

          <div className="mt-6 border-t border-gray-300 dark:border-gray-700">
            <details className="group border-b border-gray-300 dark:border-gray-700" open={false}>
              <summary className="cursor-pointer py-3 text-sm font-semibold text-gray-900 dark:text-white list-none flex items-center justify-between">
                <span>Product Details</span>
                <span className="text-xl leading-none text-gray-700 dark:text-gray-300 transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="pb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-6">
                  {product.description}
                </p>
                <ul className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Care: Dry clean recommended</li>
                  <li>Blouse: Matching blouse piece included</li>
                  <li>Dispatch: Ships within 2 business days</li>
                </ul>
              </div>
            </details>

            <details className="group border-b border-gray-300 dark:border-gray-700" open={false}>
              <summary className="cursor-pointer py-3 text-sm font-semibold text-gray-900 dark:text-white list-none flex items-center justify-between">
                <span>Contact Details</span>
                <span className="text-xl leading-none text-gray-700 dark:text-gray-300 transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="pb-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">Shop:</span> {shopName}
                </p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">Phone:</span> +91 98765 43210
                </p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">Email:</span> support@handloombazaar.in
                </p>
                {shop?.description && (
                  <p>
                    <span className="font-medium text-gray-900 dark:text-white">About Shop:</span> {shop.description}
                  </p>
                )}
              </div>
            </details>
          </div>
        </div>
      </section>

      <div className="space-y-8 pb-8">
        <Ribbon
          title="Color Variants"
          action={<a href="/featured" className="text-sm text-rose-600 hover:underline">View more</a>}
          items={variants}
          renderItem={(item: Product) => <ProductCard product={item} size="compact" />}
        />

        <Ribbon
          title="Similar From This Shop"
          action={<a href="/shops" className="text-sm text-rose-600 hover:underline">View shop</a>}
          items={similarFromShop}
          renderItem={(item: Product) => <ProductCard product={item} size="compact" hideShop={true} />}
        />

        <Ribbon
          title="Similar From Other Shops"
          action={<a href="/sarees" className="text-sm text-rose-600 hover:underline">Browse all</a>}
          items={similarFromOtherShops}
          renderItem={(item: Product) => <ProductCard product={item} size="compact" />}
        />
      </div>
    </main>
  );
}
