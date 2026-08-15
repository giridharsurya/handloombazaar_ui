"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
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

type ShopOption = {
  display_id: string;
  name: string;
};

type ProductCreateFormProps = {
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  redirectAfterSuccessHref: string;
  fixedShopDisplayId?: string;
  allowShopSelect?: boolean;
  shopOptions?: ShopOption[];
};

export default function ProductCreateForm({
  title,
  subtitle,
  backHref,
  backLabel,
  redirectAfterSuccessHref,
  fixedShopDisplayId,
  allowShopSelect = false,
  shopOptions = [],
}: ProductCreateFormProps) {
  const router = useRouter();
  const api = useApi();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discounted_price: "",
    stock_quantity: "",
    selectedShop: fixedShopDisplayId || "",
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number | null>(null);
  const [availableAttributes, setAvailableAttributes] = useState<ProductFilterAttribute[]>([]);
  const [selectedOptionByDefinition, setSelectedOptionByDefinition] = useState<Record<number, number | null>>({});
  const [openColorAttributeIds, setOpenColorAttributeIds] = useState<Record<number, boolean>>({});

  const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
  const allowedImageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

  const getFileExtension = (file: File) => file.name.split(".").pop()?.toLowerCase() || "";
  const isAllowedImageFile = (file: File) => {
    const fileType = file.type.toLowerCase();
    if (allowedImageTypes.has(fileType)) return true;
    const extension = getFileExtension(file);
    return allowedImageExtensions.has(extension);
  };

  const effectiveShopDisplayId = useMemo(() => {
    if (allowShopSelect) return formData.selectedShop;
    return fixedShopDisplayId || "";
  }, [allowShopSelect, formData.selectedShop, fixedShopDisplayId]);

  React.useEffect(() => {
    let mounted = true;

    const loadAttributes = async () => {
      try {
        const attrs = await api.products.getFilterAttributes();
        if (!mounted) return;
        setAvailableAttributes(attrs);
        setSelectedOptionByDefinition((prev) => {
          const next = { ...prev };
          for (const attr of attrs) {
            if (!(attr.id in next)) next[attr.id] = null;
          }
          return next;
        });
      } catch {
        if (!mounted) return;
        setAvailableAttributes([]);
      }
    };

    loadAttributes();

    return () => {
      mounted = false;
    };
  }, [api]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedFiles = files.filter(isAllowedImageFile);
    const invalidFiles = files.filter((file) => !isAllowedImageFile(file));

    if (invalidFiles.length > 0) {
      setError("Only JPG, PNG, WebP, GIF, and AVIF image formats are allowed.");
    }

    setUploadedImages((prev) => {
      const availableSlots = 5 - prev.length;
      if (availableSlots <= 0) {
        setError("Maximum 5 images can be uploaded.");
        return prev;
      }
      if (allowedFiles.length > availableSlots) {
        setError("Maximum 5 images can be uploaded.");
      }
      return [...prev, ...allowedFiles.slice(0, availableSlots)];
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!effectiveShopDisplayId) {
      setError("Please select a shop.");
      return;
    }
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Valid price is required");
      return;
    }
    if (!formData.stock_quantity || parseInt(formData.stock_quantity, 10) < 0) {
      setError("Valid stock quantity is required");
      return;
    }
    if (uploadedImages.length === 0) {
      setError("At least one image is required");
      return;
    }
    if (uploadedImages.length > 5) {
      setError("A maximum of 5 images is allowed.");
      return;
    }
    if (primaryImageIndex === null) {
      setError("Please select a primary image");
      return;
    }

    const missingRequiredAttributes = availableAttributes.filter(
      (attribute) =>
        attribute.is_required &&
        (selectedOptionByDefinition[attribute.id] === null || selectedOptionByDefinition[attribute.id] === undefined)
    );
    if (missingRequiredAttributes.length > 0) {
      setError(`Please select a value for the required attribute: ${missingRequiredAttributes.map((attribute) => attribute.name).join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("shop_display_id", String(effectiveShopDisplayId));
      form.append("name", formData.name);
      if (formData.description) form.append("description", formData.description);
      form.append("price", String(parseFloat(formData.price)));
      if (formData.discounted_price) form.append("discounted_price", String(parseFloat(formData.discounted_price)));
      form.append("stock_quantity", String(parseInt(formData.stock_quantity, 10)));

      const selectedAttributes = Object.entries(selectedOptionByDefinition)
        .filter(([, optionId]) => optionId !== null && optionId !== undefined)
        .map(([definitionId, optionId]) => ({
          definition_id: Number(definitionId),
          option_id: Number(optionId),
        }));

      if (selectedAttributes.length > 0) {
        form.append("attributes", JSON.stringify(selectedAttributes));
      }

      const filesInOrder = [...uploadedImages];
      if (primaryImageIndex !== null && primaryImageIndex > 0) {
        const primary = filesInOrder.splice(primaryImageIndex, 1)[0];
        filesInOrder.unshift(primary);
      }

      for (const file of filesInOrder) {
        form.append("images", file);
      }

      await api.products.createProduct(form as any);
      setSuccess("Product added successfully");

      setFormData({
        name: "",
        description: "",
        price: "",
        discounted_price: "",
        stock_quantity: "",
        selectedShop: allowShopSelect ? "" : fixedShopDisplayId || "",
      });
      setUploadedImages([]);
      setPrimaryImageIndex(null);
      setSelectedOptionByDefinition((prev) => {
        const resetMap: Record<number, number | null> = {};
        Object.keys(prev).forEach((k) => {
          resetMap[Number(k)] = null;
        });
        return resetMap;
      });

      setTimeout(() => {
        router.push(redirectAfterSuccessHref);
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add product";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>
          </div>
          <Link href={backHref} className="text-slate-600 hover:text-slate-900">
            {backLabel}
          </Link>
        </div>

        <div className="rounded-lg border border-slate-300 bg-white p-6 shadow">
          {error && <div className="mb-6 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
          {success && <div className="mb-6 rounded-md bg-green-50 p-4 text-sm font-medium text-green-700">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {allowShopSelect && (
              <div>
                <label htmlFor="selectedShop" className="block text-sm font-medium text-slate-700">
                  Shop *
                </label>
                <select
                  id="selectedShop"
                  name="selectedShop"
                  value={formData.selectedShop}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">Select shop</option>
                  {shopOptions.map((s) => (
                    <option key={s.display_id} value={s.display_id}>
                      {s.name} ({s.display_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Traditional Silk Saree"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product..."
                rows={4}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="discounted_price" className="block text-sm font-medium text-slate-700">
                  Discounted Price
                </label>
                <input
                  type="number"
                  id="discounted_price"
                  name="discounted_price"
                  value={formData.discounted_price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-slate-700">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            {availableAttributes.length > 0 ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Product Attributes</h3>
                <p className="mt-1 text-xs text-slate-600">Select one option for each applicable attribute.</p>

                <div className="mt-4 space-y-4">
                  {availableAttributes.map((attribute) => {
                    const selectedOptionId = selectedOptionByDefinition[attribute.id] ?? null;
                    const selectedOption = attribute.options.find((option) => option.id === selectedOptionId) ?? null;
                    const isColorAttribute = /color|colour/i.test(attribute.name) || attribute.options.some((option) => !!getOptionSwatchColor(option));

                    if (isColorAttribute) {
                      const selectedDisplay = selectedOption
                        ? (() => {
                            const { label, color } = parseOptionValueColor(selectedOption.value);
                            const swatchColor = getOptionSwatchColor(selectedOption) ?? color ?? "#e5e7eb";
                            const displayLabel = label ? (color ? `${label} ${color}` : label) : selectedOption.value;
                            return { displayLabel, swatchColor };
                          })()
                        : { displayLabel: `Select ${attribute.name}`, swatchColor: "#e5e7eb" };

                      return (
                        <div key={attribute.id}>
                          <label className="block text-sm font-medium text-slate-700">
                            {attribute.name}
                            {attribute.is_required ? <span className="ml-1 text-rose-600">*</span> : null}
                          </label>

                          <div className="relative mt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenColorAttributeIds((prev) => ({
                                  ...prev,
                                  [attribute.id]: !prev[attribute.id],
                                }))
                              }
                              className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
                              <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-300 bg-white shadow-lg">
                                {attribute.options.map((option) => {
                                  const { label, color } = parseOptionValueColor(option.value);
                                  const swatchColor = getOptionSwatchColor(option) ?? color ?? "#e5e7eb";
                                  const displayLabel = label ? (color ? `${label} ${color}` : label) : option.value;
                                  const isSelected = selectedOptionId === option.id;

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
                        <label className="block text-sm font-medium text-slate-700">
                          {attribute.name}
                          {attribute.is_required ? <span className="ml-1 text-rose-600">*</span> : null}
                        </label>
                        <select
                          value={selectedOptionId ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedOptionByDefinition((prev) => ({
                              ...prev,
                              [attribute.id]: value ? Number(value) : null,
                            }));
                          }}
                          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                          <option value="">Select {attribute.name}</option>
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
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Images * (select primary image)</label>

              <div className="mb-4 flex items-center justify-center w-full">
                <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 hover:bg-slate-100">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm text-slate-600">Click to upload images</p>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadedImages.length >= 5}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">Max 5 images. Supported formats: JPG, PNG, WebP, GIF, AVIF.</p>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index}`}
                        className={`w-full h-32 object-cover rounded-md border-2 ${
                          primaryImageIndex === index ? "border-slate-900" : "border-slate-300"
                        }`}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImageIndex(index)}
                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold ${
                            primaryImageIndex === index ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-900"
                          }`}
                        >
                          {primaryImageIndex === index ? "✓ Primary" : "Set Primary"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="py-1 px-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Adding Product..." : "Add Product"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
