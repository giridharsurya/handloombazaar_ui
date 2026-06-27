"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/Product/Product";

type ProductGridProps = {
  products: Product[];
  hideShop?: boolean;
  hideCategory?: boolean;
};

type BackendProduct = {
  id: number;
  name: string;
  image_url: string;
  shop_id: number;
  shop_name: string;
  shop_logo: string;
  price: number;
  discount_price?: number;
};

type BackendProductsResponse = {
  items: BackendProduct[];
};

export default function ProductGrid({ products, hideShop = false, hideCategory = false }: ProductGridProps) {
  const [backendProducts, setBackendProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/products/", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data: BackendProductsResponse = await response.json();

        if (!Array.isArray(data?.items)) {
          return;
        }

        const mappedProducts: Product[] = data.items.map((item) => ({
          id: item.id,
          name: item.name,
          image_url: item.image_url,
          shop_id: item.shop_id,
          shop_name: item.shop_name,
          shop_logo_url: item.shop_logo,
          price: item.price,
          discount_price: item.discount_price,
        }));

        setBackendProducts(mappedProducts);
      } catch {
        // Keep prop-driven products as fallback when backend is unavailable.
      }
    };

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const displayProducts = backendProducts ?? products;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          size="default"
          hideShop={hideShop}
          hideCategory={hideCategory}
        />
      ))}
    </div>
  );
}
