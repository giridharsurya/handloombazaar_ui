"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductDetails from "@/components/Product/ProductDetails";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import type { Product, Shop } from "@/types";

const pendingProductDetailsFetches = new Map<string, Promise<Product>>();

export default function SareeDetailsPage() {
  const { id } = useParams() as { id?: string };
  const api = useApi();
  const { auth, isLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [variants, setVariants] = useState<Product[]>([]);
  const [similarFromShop, setSimilarFromShop] = useState<Product[]>([]);
  const [similarFromOtherShops, setSimilarFromOtherShops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      if (!id) return;
      if (isLoading) return;

      setLoading(true);
      setError("");

      try {
        let responsePromise: Promise<Product>;

        if (pendingProductDetailsFetches.has(id)) {
          responsePromise = pendingProductDetailsFetches.get(id)!;
        } else {
          responsePromise = api.products
            .getProductDetails(id, {
              authenticated: !!auth,
            })
            .then((response) => response.product as Product);
          pendingProductDetailsFetches.set(id, responsePromise);
        }

        const fetchedProduct = await responsePromise;
        if (cancelled) return;

        setProduct(fetchedProduct);
        setShop(
          fetchedProduct.shop
            ? {
                id: fetchedProduct.shop.display_id,
                name: fetchedProduct.shop.name,
                logo_url: fetchedProduct.shop.shop_logo_url,
              }
            : null
        );
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Product not found");
      } finally {
        if (pendingProductDetailsFetches.get(id)) {
          pendingProductDetailsFetches.delete(id);
        }
        if (!cancelled) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, isLoading, api, auth]);

  useEffect(() => {
    let cancelled = false;

    const loadRibbons = async () => {
      if (!product || isLoading) return;

      const authenticated = !!auth;
      try {
        const [variantsResponse, similarShopResponse, similarOtherResponse] = await Promise.all([
          api.products.getProductVariants(product.display_id, { authenticated }),
          api.products.getSimilarProductsFromShop(product.display_id, { authenticated }),
          api.products.getSimilarProductsFromOtherShops(product.display_id, { authenticated }),
        ]);

        if (cancelled) return;
        setVariants(variantsResponse.data || []);
        setSimilarFromShop(similarShopResponse.data || []);
        setSimilarFromOtherShops(similarOtherResponse.data || []);
      } catch (err) {
        if (cancelled) return;
        setVariants([]);
        setSimilarFromShop([]);
        setSimilarFromOtherShops([]);
      }
    };

    loadRibbons();

    return () => {
      cancelled = true;
    };
  }, [product, isLoading, api, auth]);

  if (loading) {
    return <div className="px-4 py-8 text-sm text-slate-600">Loading product...</div>;
  }

  if (error) {
    return <div className="px-4 py-8 text-sm text-rose-600">{error}</div>;
  }

  if (!product) {
    return <div className="px-4 py-8 text-sm text-slate-600">Product not found.</div>;
  }

  return (
    <ProductDetails
      product={product}
      shop={shop}
      variants={variants}
      similarFromShop={similarFromShop}
      similarFromOtherShops={similarFromOtherShops}
    />
  );
}
