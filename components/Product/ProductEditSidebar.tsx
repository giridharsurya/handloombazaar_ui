"use client";

import React from "react";
import { useApi } from "@/lib/ApiProvider";
import resolveImageUrl from "@/lib/resolveImage";
import { ProductFilterAttribute } from "@/types/apiTypes";

const parseOptionValueColor = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { label: "", color: null };

  const colorMatch = trimmed.match(/^(.*?)(?:\s+)(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|rgb\([^\)]*\)|hsl\([^\)]*\))$/);
  if (colorMatch) {
    return { label: colorMatch[1].trim(), color: colorMatch[2].trim() };
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return { label: "", color: trimmed };
  if (/^(rgb|hsl)a?\(/i.test(trimmed)) return { label: "", color: trimmed };

  return { label: trimmed, color: null };
};

const getOptionSwatchColor = (option: { value: string; color?: string }) => {
  if (option.color) return option.color;
  return parseOptionValueColor(option.value).color;
};

type ProductAttributeSelection = {
  definition_id: number;
  name: string;
  option_id: number;
  value: string;
  is_filterable?: boolean;
};

type EditableProduct = {
  display_id: string;
  shop_display_id?: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  stock_quantity?: number;
  video_url?: string | null;
  product_group_id?: number | null;
  group_product_count?: number;
  is_active?: boolean;
  images?: string[];
  attributes?: ProductAttributeSelection[];
};

type ProductEditSidebarProps = {
  open: boolean;
  onClose: () => void;
  product: EditableProduct;
  canEditStatus?: boolean;
  onSaved: (updatedProduct: EditableProduct) => void;
};

export default function ProductEditSidebar({
  open,
  onClose,
  product,
  canEditStatus = true,
  onSaved,
}: ProductEditSidebarProps) {
  const api = useApi();

  const [name, setName] = React.useState(product.name || "");
  const [description, setDescription] = React.useState(product.description || "");
  const [price, setPrice] = React.useState(String(product.price ?? ""));
  const [discountPrice, setDiscountPrice] = React.useState(
    product.discount_price !== null && product.discount_price !== undefined
      ? String(product.discount_price)
      : ""
  );
  const [stockQuantity, setStockQuantity] = React.useState(
    product.stock_quantity !== null && product.stock_quantity !== undefined
      ? String(product.stock_quantity)
      : ""
  );
  const [videoUrl, setVideoUrl] = React.useState(product.video_url || "");
  const [removeFromGroup, setRemoveFromGroup] = React.useState(false);
  const [isActive, setIsActive] = React.useState(Boolean(product.is_active ?? true));
  const [existingImages, setExistingImages] = React.useState<string[]>(product.images || []);
  const [newImages, setNewImages] = React.useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = React.useState(0);

  const [attributeCatalog, setAttributeCatalog] = React.useState<ProductFilterAttribute[]>([]);
  const [selectedOptionByDefinition, setSelectedOptionByDefinition] = React.useState<Record<number, number | null>>({});
  const [openColorAttributeIds, setOpenColorAttributeIds] = React.useState<Record<number, boolean>>({});

  const [isLoadingAttributes, setIsLoadingAttributes] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const newImagePreviewUrls = React.useMemo(
    () => newImages.map((file) => URL.createObjectURL(file)),
    [newImages]
  );

  React.useEffect(() => {
    return () => {
      newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviewUrls]);

  const previewItems = React.useMemo(
    () => [
      ...existingImages.map((url) => ({ src: resolveImageUrl(url) || url, source: "existing" as const })),
      ...newImagePreviewUrls.map((url) => ({ src: url, source: "new" as const })),
    ],
    [existingImages, newImagePreviewUrls]
  );

  React.useEffect(() => {
    if (!open) return;

    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(String(product.price ?? ""));
    setDiscountPrice(
      product.discount_price !== null && product.discount_price !== undefined
        ? String(product.discount_price)
        : ""
    );
    setStockQuantity(
      product.stock_quantity !== null && product.stock_quantity !== undefined
        ? String(product.stock_quantity)
        : ""
    );
    setVideoUrl(product.video_url || "");
    setRemoveFromGroup(false);
    setIsActive(Boolean(product.is_active ?? true));
    setExistingImages(product.images || []);
    setNewImages([]);
    setPrimaryImageIndex(0);

    const existingSelections: Record<number, number | null> = {};
    for (const attr of product.attributes || []) {
      existingSelections[attr.definition_id] = attr.option_id;
    }
    setSelectedOptionByDefinition(existingSelections);
    setError(null);
    setSuccess(null);
  }, [open, product]);

  React.useEffect(() => {
    if (!open) return;

    let mounted = true;

    const loadAttributeCatalog = async () => {
      setIsLoadingAttributes(true);
      try {
        const attrs = await api.products.getEditableAttributes({ authenticated: true });
        if (!mounted) return;
        setAttributeCatalog(attrs || []);
        setSelectedOptionByDefinition((prev) => {
          const next = { ...prev };
          for (const attr of attrs || []) {
            if (!(attr.id in next)) next[attr.id] = null;
          }
          return next;
        });
      } catch (err) {
        if (!mounted) return;
        setAttributeCatalog([]);
        setError(err instanceof Error ? err.message : "Failed to load attributes");
      } finally {
        if (mounted) setIsLoadingAttributes(false);
      }
    };

    loadAttributeCatalog();

    return () => {
      mounted = false;
    };
  }, [api, open]);

  const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
  const allowedImageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
  const getFileExtension = (file: File) => file.name.split(".").pop()?.toLowerCase() || "";
  const isAllowedImageFile = (file: File) => {
    const fileType = file.type.toLowerCase();
    if (allowedImageTypes.has(fileType)) return true;
    const extension = getFileExtension(file);
    return allowedImageExtensions.has(extension);
  };

  const resetAndClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const allowedFiles = files.filter(isAllowedImageFile);
    const invalidFiles = files.filter((file) => !isAllowedImageFile(file));
    const currentCount = existingImages.length + newImages.length;
    const availableSlots = Math.max(0, 5 - currentCount);

    if (invalidFiles.length > 0) {
      setError("Only JPG, PNG, WebP, GIF, and AVIF image formats are allowed.");
    }
    if (availableSlots <= 0) {
      setError("Maximum 5 images can be uploaded.");
      e.target.value = "";
      return;
    }

    setNewImages((prev) => [...prev, ...allowedFiles.slice(0, availableSlots)]);
    if (allowedFiles.length > availableSlots) {
      setError("Maximum 5 images can be uploaded.");
    }
    if (previewItems.length === 0) {
      setPrimaryImageIndex(0);
    }
    e.target.value = "";
  };

  const removePreviewImage = (index: number) => {
    const existingCount = existingImages.length;

    if (index < existingCount) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingCount;
      setNewImages((prev) => prev.filter((_, i) => i !== newIndex));
    }

    setPrimaryImageIndex((prev) => {
      const nextLength = Math.max(previewItems.length - 1, 0);
      if (nextLength === 0) return 0;
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      if (prev >= nextLength) return nextLength - 1;
      return prev;
    });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Product name is required");
      return;
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a non-negative number");
      return;
    }

    if (!stockQuantity.trim()) {
      setError("Stock quantity is required");
      return;
    }

    if (previewItems.length === 0) {
      setError("At least one image is required");
      return;
    }

    const missingRequiredAttributes = attributeCatalog.filter(
      (attribute) =>
        attribute.is_required &&
        (selectedOptionByDefinition[attribute.id] === null || selectedOptionByDefinition[attribute.id] === undefined)
    );
    if (missingRequiredAttributes.length > 0) {
      setError(`Please select a value for the required attribute: ${missingRequiredAttributes.map((attribute) => attribute.name).join(", ")}`);
      return;
    }

    if (primaryImageIndex < 0 || primaryImageIndex >= previewItems.length) {
      setError("Please select a valid primary image");
      return;
    }

    const parsedStock = Number(stockQuantity);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError("Stock quantity must be a non-negative whole number");
      return;
    }

    let parsedDiscount: number | null = null;
    if (discountPrice.trim()) {
      const tempDiscount = Number(discountPrice);
      if (!Number.isFinite(tempDiscount) || tempDiscount < 0) {
        setError("Discount price must be a non-negative number");
        return;
      }
      parsedDiscount = tempDiscount;
    }

    const attributes = Object.entries(selectedOptionByDefinition)
      .filter(([, optionId]) => optionId !== null && optionId !== undefined)
      .map(([definitionId, optionId]) => ({
        definition_id: Number(definitionId),
        option_id: Number(optionId),
      }));

    setIsSaving(true);
    try {
      const form = new FormData();
      form.append("name", trimmedName);
      form.append("description", description.trim() ? description.trim() : "");
      form.append("price", String(Math.round(parsedPrice)));
      form.append("discount_price", parsedDiscount !== null ? String(Math.round(parsedDiscount)) : "");
      form.append("stock_quantity", String(parsedStock));
      form.append("video_url", videoUrl.trim() ? videoUrl.trim() : "");
      form.append("attributes", JSON.stringify(attributes));
      form.append("image_urls", JSON.stringify(existingImages));
      form.append("primary_image_index", String(primaryImageIndex));

      if (removeFromGroup) {
        form.append("product_group_id", "");
      }

      if (canEditStatus) {
        form.append("is_active", String(isActive));
      }

      for (const file of newImages) {
        form.append("images", file);
      }

      const response = await api.products.updateProduct(product.display_id, form);

      const updated = response.product;
      const nextProduct: EditableProduct = {
        display_id: updated.display_id,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        discount_price: updated.discount_price ?? null,
        stock_quantity: updated.stock_quantity,
        video_url: updated.video_url,
        product_group_id: updated.product_group_id,
        group_product_count: updated.group_product_count,
        is_active: updated.is_active,
        images: updated.images,
        attributes: updated.attributes,
      };

      onSaved(nextProduct);
      setSuccess("Product updated successfully");
      setTimeout(() => {
        resetAndClose();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={resetAndClose}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl transform overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Edit Product</h2>
              <p className="text-xs text-slate-500">Update product details and attributes.</p>
            </div>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              onClick={resetAndClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {error ? <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
          {success ? <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Product Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Price</label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Discount Price</label>
              <input
                type="number"
                min="0"
                step="1"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Stock Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Group</label>
              {product.product_group_id ? (
                <div className="rounded border border-slate-300 bg-slate-50 px-3 py-2">
                  <p className="text-sm text-slate-700">Current group ID: {product.product_group_id}</p>
                  {(product.group_product_count || 0) > 1 ? (
                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={removeFromGroup}
                        onChange={(e) => setRemoveFromGroup(e.target.checked)}
                      />
                      Remove this product from group
                    </label>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">This group has a single product, so remove is disabled.</p>
                  )}
                </div>
              ) : (
                <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  This product is not in a group.
                </p>
              )}
            </div>

            {canEditStatus ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Product Images</h3>
            <p className="mt-1 text-xs text-slate-600">Upload new images, remove existing ones, and pick the primary image.</p>

            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                Add Images
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={existingImages.length + newImages.length >= 5}
                />
              </label>
            </div>

            {previewItems.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previewItems.map((item, index) => (
                  <div key={`${item.source}-${item.src}-${index}`} className="rounded border border-slate-200 bg-white p-2">
                    <img src={item.src} alt={`Product image ${index + 1}`} className="h-24 w-full rounded object-cover" />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPrimaryImageIndex(index)}
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          primaryImageIndex === index
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {primaryImageIndex === index ? "Primary" : "Set Primary"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePreviewImage(index)}
                        className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No images selected.</p>
            )}
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Attributes</h3>
            <p className="mt-1 text-xs text-slate-600">Set values for applicable attributes. Leave empty to remove an attribute value.</p>

            {isLoadingAttributes ? (
              <p className="mt-3 text-sm text-slate-500">Loading attributes...</p>
            ) : attributeCatalog.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No attributes available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {attributeCatalog.map((attribute) => {
                  const selectedOption = selectedOptionByDefinition[attribute.id] ?? null;
                  const isColorAttribute = /color|colour/i.test(attribute.name) || attribute.options.some((option) => !!getOptionSwatchColor(option));

                  if (isColorAttribute) {
                    const selectedOptionDetails = attribute.options.find((option) => option.id === selectedOption) ?? null;
                    const selectedDisplay = selectedOptionDetails
                      ? (() => {
                          const { label, color } = parseOptionValueColor(selectedOptionDetails.value);
                          const swatchColor = getOptionSwatchColor(selectedOptionDetails) ?? color ?? "#e5e7eb";
                          const displayLabel = label ? (color ? `${label} ${color}` : label) : selectedOptionDetails.value;
                          return { displayLabel, swatchColor };
                        })()
                      : { displayLabel: `Select ${attribute.name}`, swatchColor: "#e5e7eb" };

                    return (
                      <div key={attribute.id}>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          {attribute.name}
                          {attribute.is_required ? <span className="ml-1 text-rose-600">*</span> : null}
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenColorAttributeIds((prev) => ({
                                ...prev,
                                [attribute.id]: !prev[attribute.id],
                              }))
                            }
                            className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-sm focus:border-slate-500 focus:outline-none"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="h-4 w-4 rounded-full border border-slate-300"
                                style={{ backgroundColor: selectedDisplay.swatchColor }}
                              />
                              <span>{selectedDisplay.displayLabel}</span>
                            </span>
                            <span className="text-slate-500">▼</span>
                          </button>

                          {openColorAttributeIds[attribute.id] ? (
                            <div className="absolute z-10 mt-1 w-full rounded border border-slate-300 bg-white shadow-lg">
                              {attribute.options.map((option) => {
                                const { label, color } = parseOptionValueColor(option.value);
                                const swatchColor = getOptionSwatchColor(option) ?? color ?? "#e5e7eb";
                                const displayLabel = label ? (color ? `${label} ${color}` : label) : option.value;
                                const isSelected = selectedOption === option.id;

                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedOptionByDefinition((prev) => ({
                                        ...prev,
                                        [attribute.id]: option.id,
                                      }));
                                      setOpenColorAttributeIds((prev) => ({ ...prev, [attribute.id]: false }));
                                    }}
                                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                                      isSelected ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="h-4 w-4 rounded-full border border-slate-300"
                                        style={{ backgroundColor: swatchColor }}
                                        aria-label={`${displayLabel} swatch`}
                                      />
                                      <span>{displayLabel}</span>
                                    </span>
                                    {isSelected ? <span className="text-xs font-semibold">Selected</span> : null}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={attribute.id}>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {attribute.name}
                        {attribute.is_required ? <span className="ml-1 text-rose-600">*</span> : null}
                      </label>
                      <select
                        value={selectedOption ?? ""}
                        onChange={(e) => {
                          const nextValue = e.target.value ? Number(e.target.value) : null;
                          setSelectedOptionByDefinition((prev) => ({
                            ...prev,
                            [attribute.id]: nextValue,
                          }));
                        }}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                      >
                        <option value="">None</option>
                        {attribute.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white py-4">
            <button
              type="button"
              onClick={resetAndClose}
              className="flex-1 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
