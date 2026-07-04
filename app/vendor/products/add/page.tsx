"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useApi } from "@/lib/ApiProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddProductPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const [shopStatus, setShopStatus] = useState<{ approved: boolean; name?: string } | null>(null);
  const api = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discounted_price: "",
    stock_quantity: "",
    selectedShop: "",
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number | null>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  // Fetch authoritative shop status and redirect if not approved
  React.useEffect(() => {
    const loadStatus = async () => {
      if (auth && auth.shop_display_id) {
        try {
          const res = await api.shops.getStatus({ display_id: auth.shop_display_id });
          setShopStatus({ approved: !!res.approved, name: res.name });
          if (!res.approved) {
            router.push("/vendor/dashboard");
          }
        } catch (e) {
          // ignore — fallback to auth-based behavior
        }
      }
    };
    loadStatus();
  }, [auth, router, api]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!auth || auth.role !== "shop_owner" || (shopStatus && !shopStatus.approved)) {
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedImages((prev) => [...prev, ...files]);
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

    // Validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Valid price is required");
      return;
    }
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      setError("Valid stock quantity is required");
      return;
    }
    if (uploadedImages.length === 0) {
      setError("At least one image is required");
      return;
    }
    if (primaryImageIndex === null) {
      setError("Please select a primary image");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build FormData and append files so backend can save them to /static/uploads
      const form = new FormData();
      // Ensure shop_display_id is a string for FormData; guard at runtime if missing
      if (!auth.shop_display_id) {
        setError("Unable to determine shop. Please try again later.");
        setIsSubmitting(false);
        return;
      }
      form.append("shop_display_id", String(auth.shop_display_id));
      form.append("name", formData.name);
      if (formData.description) form.append("description", formData.description);
      form.append("price", String(parseFloat(formData.price)));
      if (formData.discounted_price) form.append("discounted_price", String(parseFloat(formData.discounted_price)));
      form.append("stock_quantity", String(parseInt(formData.stock_quantity, 10)));

      // Ensure primary image (if selected) is appended first so backend marks it primary
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
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        discounted_price: "",
        stock_quantity: "",
        selectedShop: "",
      });
      setUploadedImages([]);
      setPrimaryImageIndex(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/vendor/products/add");
      }, 2000);
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add New Product</h1>
            <p className="mt-2 text-slate-600">Create and list a new product in your shop</p>
          </div>
          <Link href="/vendor/dashboard" className="text-slate-600 hover:text-slate-900">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-slate-300 bg-white p-6 shadow">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
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

            {/* Description */}
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

            {/* Price */}
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

            {/* Stock Quantity */}
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

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Images * (select primary image)
              </label>
              
              {/* Upload Input */}
              <div className="mb-4 flex items-center justify-center w-full">
                <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 hover:bg-slate-100">
                  <svg
                    className="h-8 w-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-sm text-slate-600">Click to upload images</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index}`}
                        className={`w-full h-32 object-cover rounded-md border-2 ${
                          primaryImageIndex === index
                            ? "border-slate-900"
                            : "border-slate-300"
                        }`}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImageIndex(index)}
                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold ${
                            primaryImageIndex === index
                              ? "bg-slate-900 text-white"
                              : "bg-slate-200 text-slate-900"
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

            {/* Submit Button */}
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
