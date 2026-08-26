"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import BackendImage from "@/components/BackendImage/BackendImage";
import Link from "next/link";
import Ribbon from "@/components/Ribbon/Ribbon";
import ProductCard from "@/components/Product/Product";
import ProductEditSidebar from "@/components/Product/ProductEditSidebar";
import { useAuth } from "@/lib/AuthContext";
import type { Product, Shop } from "@/types";

type ProductDetailsProps = {
  product: Product;
  shop: Shop | null;
  variants: Product[];
  similarFromShop: Product[];
  similarFromOtherShops: Product[];
};

export default function ProductDetails({
  product,
  shop,
  variants,
  similarFromShop,
  similarFromOtherShops,
}: ProductDetailsProps) {
  const { auth } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>(product);
  const hasDiscountPrice = currentProduct?.discount_price !== null && currentProduct?.discount_price !== undefined;

  const currentShopDisplayId =
    currentProduct?.shop?.display_id ||
    currentProduct?.shop_display_id ||
    (shop as any)?.display_id ||
    (shop as any)?.id ||
    "";

  const canEditProduct =
    auth?.role === "admin" ||
    (auth?.role === "shop_owner" && !!auth.shop_display_id && auth.shop_display_id === currentShopDisplayId);

  const productAttributes = useMemo(() => {
    const attrs = Array.isArray(currentProduct?.attributes) ? currentProduct.attributes : [];
    return attrs.filter((attr) => {
      const hasName = Boolean(String(attr?.name || "").trim());
      const hasValue = Boolean(String(attr?.value || "").trim());
      return hasName && hasValue;
    });
  }, [currentProduct?.attributes]);

  const topAttributeNames = new Set(["craft", "fabric", "color"]);
  const topAttributes = useMemo(
    () => productAttributes.filter((attr) => topAttributeNames.has(String(attr.name || "").trim().toLowerCase())),
    [productAttributes]
  );

  const shopName =
    shop?.name ||
    currentProduct?.shop?.name ||
    currentProduct?.shop_name ||
    "";

  const resolveItemImage = (item: any) => {
    if (!item) return undefined;
    if (item.image_url) return item.image_url;
    if (item.images && Array.isArray(item.images) && item.images.length) return item.images[0];
    return undefined;
  };

  const resolveItemImages = (item: any) => {
    if (!item) return [];
    if (item.images && Array.isArray(item.images) && item.images.length) return item.images.filter(Boolean);
    if (item.image_url) return [item.image_url];
    return [];
  };

  const galleryImages = useMemo(() => {
    const pool = [...resolveItemImages(currentProduct)];

    const filtered = pool.filter((url) => url && !String(url).startsWith("blob:"));
    const unique = filtered.filter((url, index) => filtered.indexOf(url) === index);
    return unique.slice(0, 8);
  }, [currentProduct]);

  const [selectedImage, setSelectedImage] = useState<string | undefined>(() => {
    const img = resolveItemImage(currentProduct);
    return img && !String(img).startsWith("blob:") ? img : undefined;
  });
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomContainerSize, setZoomContainerSize] = useState({ width: 0, height: 0 });
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  const pointerState = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const openZoom = () => {
    setIsZoomOpen(true);
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setZoomContainerSize({ width: 0, height: 0 });
  };

  const closeZoom = () => {
    setIsZoomOpen(false);
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setIsPanning(false);
    pointerState.current = null;
  };

  const handleZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = -event.deltaY / 240;
    setZoomScale((prev) => {
      const next = Number(Math.min(3, Math.max(1, prev + delta)).toFixed(2));
      if (next === 1) {
        setPanX(0);
        setPanY(0);
      }
      return next;
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    event.preventDefault();
    setIsPanning(true);
    pointerState.current = {
      x: event.clientX,
      y: event.clientY,
      panX,
      panY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const clampPan = (x: number, y: number) => {
    if (!zoomContainerSize.width || !zoomContainerSize.height) return { x, y };

    const imageWidth = zoomContainerSize.width * zoomScale;
    const imageHeight = zoomContainerSize.height * zoomScale;
    const maxOffsetX = Math.max(0, (imageWidth - zoomContainerSize.width) / 2);
    const maxOffsetY = Math.max(0, (imageHeight - zoomContainerSize.height) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !pointerState.current) return;
    event.preventDefault();
    const deltaX = event.clientX - pointerState.current.x;
    const deltaY = event.clientY - pointerState.current.y;
    const { x, y } = clampPan(pointerState.current.panX + deltaX, pointerState.current.panY + deltaY);
    setPanX(x);
    setPanY(y);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    event.preventDefault();
    setIsPanning(false);
    pointerState.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isZoomOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isZoomOpen]);

  React.useEffect(() => {
    if (!isZoomOpen || !zoomContainerRef.current) return;
    const rect = zoomContainerRef.current.getBoundingClientRect();
    setZoomContainerSize({ width: rect.width, height: rect.height });
  }, [isZoomOpen, selectedImage]);

  const createdOn = currentProduct.created_at ?? (currentProduct as any).created_on;
  const formattedCreatedOn = createdOn ? new Date(createdOn).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;

  React.useEffect(() => {
    const img = resolveItemImage(currentProduct);
    setSelectedImage(img && !String(img).startsWith("blob:") ? img : undefined);
  }, [currentProduct]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-rose-50/20 to-amber-50/20 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 px-4 py-4">
      <div className="mb-4 text-xs tracking-wide text-gray-500 dark:text-gray-400">
        Home / Sarees / <span className="text-gray-700 dark:text-gray-200">{currentProduct.name}</span>
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
                      {imageUrl ? (
                        <BackendImage src={imageUrl} alt={`${currentProduct.name} preview ${index + 1}`} fill style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden pb-2">
            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto group">
              {selectedImage ? (
                <>
                  <button
                    type="button"
                    onClick={openZoom}
                    className="absolute inset-0 z-10 rounded-xl bg-black/10 opacity-0 transition-opacity duration-200 hover:opacity-100 focus:outline-none"
                    aria-label="Open image zoom"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl text-sm font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
                    Click to zoom
                  </div>
                  <BackendImage
                    src={selectedImage}
                    alt={currentProduct.name}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </div>
          </div>

          {isZoomOpen && selectedImage ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={closeZoom}
              onWheelCapture={handleZoomWheel}
              onWheel={handleZoomWheel}
              role="dialog"
              aria-modal="true"
              style={{ touchAction: "none" }}
            >
              <div className="relative h-full w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black" onClick={(event) => event.stopPropagation()}>
                <div
                  className="relative h-full w-full transition-transform duration-150"
                  ref={zoomContainerRef}
                  style={{ transform: `scale(${zoomScale}) translate(${panX / zoomScale}px, ${panY / zoomScale}px)`, touchAction: "none", cursor: zoomScale > 1 ? (isPanning ? "grabbing" : "grab") : "auto" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onWheel={handleZoomWheel}
                >
                  <BackendImage
                    src={selectedImage}
                    alt={currentProduct.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-2 lg:p-3">
            <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {currentProduct.name}
          </h1>

          {currentProduct.display_id ? (
            <p className="mt-1 text-sm text-slate-500">SKU: {currentProduct.display_id}</p>
          ) : null}

            <div className="mt-2 flex items-center gap-2">
              {Number(currentProduct.stock_quantity ?? 0) <= 0 ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Out of stock</span>
              ) : null}
              {currentProduct.is_active === false ? (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">Inactive</span>
              ) : null}
            </div>

          {canEditProduct ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="rounded-full border border-rose-300 px-4 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Edit Product
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex items-end gap-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">MRP</p>
            {hasDiscountPrice ? (
              <>
                <p className="text-lg text-gray-500 line-through">Rs. {currentProduct.price.toLocaleString()}</p>
                <p className="text-3xl font-bold text-rose-600">Rs. {Number(currentProduct.discount_price).toLocaleString()}</p>
              </>
            ) : (
              <p className="text-3xl font-bold text-rose-600">Rs. {currentProduct.price.toLocaleString()}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">Inclusive of all taxes</p>
          </div>

          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Stock:</span> {currentProduct.stock_quantity ?? "N/A"}
          </div>

          {formattedCreatedOn ? (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Created on:</span> {formattedCreatedOn}
            </div>
          ) : null}

          {currentProduct.video_url ? (
            <div className="mt-2 text-sm">
              <a
                href={String(currentProduct.video_url)}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-rose-600 hover:underline"
              >
                Watch product video
              </a>
            </div>
          ) : null}

          {topAttributes.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
              {topAttributes.map((attr, index) => (
                <React.Fragment key={`${attr.definition_id}-${attr.option_id}-${index}`}>
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">{attr.name}:</span> {attr.value}
                  </p>
                  {index < topAttributes.length - 1 && (
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                {currentProduct.shop_logo_url && !String(currentProduct.shop_logo_url).startsWith("blob:") ? (
                  <BackendImage src={currentProduct.shop_logo_url} alt={shopName || "Shop"} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Sold by</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{shopName}</p>
              </div>
            </div>
            <a href={currentProduct?.shop?.shop_slug || shop?.shop_slug ? `/shops/${currentProduct?.shop?.shop_slug || shop?.shop_slug}` : '#'} className="text-sm font-medium text-rose-600 hover:underline" aria-disabled={!currentProduct?.shop?.shop_slug && !shop?.shop_slug}>
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
                  {currentProduct.description || "No description available."}
                </p>

                {productAttributes.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        {productAttributes.map((attr, index) => (
                          <tr key={`${attr.definition_id}-${attr.option_id}-${index}`} className="border-t border-slate-200 first:border-t-0">
                            <td className="w-1/2 bg-slate-50 px-3 py-2 font-medium text-slate-600">{attr.name}</td>
                            <td className="w-1/2 px-3 py-2 text-slate-900">{attr.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No product attributes available.</p>
                )}
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
                  <span className="font-medium text-gray-900 dark:text-white">Phone:</span> {currentProduct?.shop?.phone_number || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">Email:</span> {currentProduct?.shop?.email || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">City:</span> {currentProduct?.shop?.city || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-900 dark:text-white">Address:</span> {currentProduct?.shop?.address || "N/A"}
                </p>
                {currentProduct?.shop?.website_url && (
                  <p>
                    <span className="font-medium text-gray-900 dark:text-white">Website:</span> {currentProduct.shop.website_url}
                  </p>
                )}
              </div>
            </details>
          </div>
        </div>
      </section>

      <div className="space-y-8 pb-8">
        {currentProduct?.product_group_id ? (
          <Ribbon
            title="Color Variants"
            action={
              <Link
                href={`/sarees?product_group_id=${encodeURIComponent(String(currentProduct.product_group_id))}`}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100"
              >
                View all
              </Link>
            }
            items={variants}
            renderItem={(item: Product) => (
              <div className="w-[12.5rem] min-w-0 flex-shrink-0">
                <ProductCard product={item} size="default" />
              </div>
            )}
          />
        ) : null}

        <Ribbon
          title="Similar From This Shop"
          action={
            currentProduct?.shop?.display_id || currentProduct?.shop_display_id ? (
              <Link
                href={`/sarees?${(() => {
                  const params = new URLSearchParams();
                  params.append("shop_display_id", String(currentProduct?.shop?.display_id || currentProduct?.shop_display_id));
                  const attributes = Array.isArray(currentProduct?.attributes) ? currentProduct.attributes : [];
                  for (const attr of attributes) {
                    if (attr?.name && attr?.value) {
                      params.append("attribute_filters", `${String(attr.name).trim()}:${String(attr.value).trim()}`);
                    }
                  }
                  return params.toString();
                })()}`}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100"
              >
                View all
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-400 shadow-sm">
                View all
              </span>
            )
          }
          items={similarFromShop}
          renderItem={(item: Product) => (
            <div className="w-[12.5rem] min-w-0 flex-shrink-0">
              <ProductCard product={item} size="default" hideShop={true} />
            </div>
          )}
        />

        <Ribbon
          title="Similar From Other Shops"
          action={
            <Link
              href={`/sarees?${(() => {
                const params = new URLSearchParams();
                const attributes = Array.isArray(currentProduct?.attributes) ? currentProduct.attributes : [];
                for (const attr of attributes) {
                  if (attr?.name && attr?.value) {
                    params.append("attribute_filters", `${String(attr.name).trim()}:${String(attr.value).trim()}`);
                  }
                }
                return params.toString();
              })()}`}
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100"
            >
              View all
            </Link>
          }
          items={similarFromOtherShops}
          renderItem={(item: Product) => (
            <div className="w-[12.5rem] min-w-0 flex-shrink-0">
              <ProductCard product={item} size="default" />
            </div>
          )}
        />
      </div>

      <ProductEditSidebar
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        canEditStatus={auth?.role === "admin"}
        product={{
          display_id: currentProduct.display_id,
          shop_display_id: currentShopDisplayId,
          name: currentProduct.name,
          description: currentProduct.description,
          price: currentProduct.price,
          discount_price: currentProduct.discount_price,
          stock_quantity: currentProduct.stock_quantity,
          video_url: currentProduct.video_url,
          product_group_id: currentProduct.product_group_id,
          group_product_count: currentProduct.group_product_count,
          is_active: currentProduct.is_active,
          images: currentProduct.images,
          attributes: (currentProduct.attributes ?? []).map((attr) => ({
            definition_id: attr.definition_id,
            name: attr.name ?? attr.option_value ?? "",
            option_id: attr.option_id,
            value: attr.value ?? attr.option_value ?? "",
            is_filterable: attr.is_filterable,
          })),
        }}
        onSaved={(updatedProduct) => {
          setCurrentProduct((prev: any) => ({
            ...prev,
            ...updatedProduct,
            shop_display_id: prev?.shop_display_id ?? prev?.shop?.display_id,
            shop_name: prev?.shop_name ?? prev?.shop?.name,
            shop_logo_url: prev?.shop_logo_url ?? prev?.shop?.shop_logo_url,
          }));
        }}
      />
    </main>
  );
}
