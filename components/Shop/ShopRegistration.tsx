"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

interface ShopRegistrationProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export const ShopRegistration: React.FC<ShopRegistrationProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const { register, error: authError, clearError } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shop_name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    year_established: "",
    address: "",
    phone_number: "",
    shop_logo: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
    clearError();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFormData((prev) => ({ ...prev, shop_logo: file }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!formData.shop_name.trim()) {
      setLocalError("Shop name is required");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setLocalError("Valid email is required");
      return;
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      setLocalError("Username must be at least 3 characters");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (!formData.year_established.trim()) {
      setLocalError("Year established is required");
      return;
    }
    const parsedYear = parseInt(formData.year_established, 10);
    if (Number.isNaN(parsedYear) || parsedYear < 1800 || parsedYear > 2100) {
      setLocalError("Year established must be between 1800 and 2100");
      return;
    }
    if (!formData.address.trim()) {
      setLocalError("Address is required");
      return;
    }
    if (!formData.phone_number.trim()) {
      setLocalError("Phone number is required");
      return;
    }
    if (!formData.shop_logo) {
      setLocalError("Please select a shop logo image to upload");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        shop_name: formData.shop_name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        year_established: parsedYear,
        address: formData.address.trim(),
        phone_number: formData.phone_number.trim(),
        shop_logo_url: formData.shop_logo as File,
      });

      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/vendor/dashboard");
      }
    } catch (err) {
      // Error is set in auth context
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border border-slate-300 bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-slate-900">Register Your Shop</h2>

      {displayError && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shop Name */}
        <div>
          <label htmlFor="shop_name" className="block text-sm font-medium text-slate-700">
            Shop Name *
          </label>
          <input
            type="text"
            id="shop_name"
            name="shop_name"
            value={formData.shop_name}
            onChange={handleChange}
            placeholder="Enter your shop name"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
            Username *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username (min 3 characters)"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 6 characters"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Required Shop Details */}
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-3 text-sm font-medium text-slate-600">Required Shop Information</p>

          {/* Year Established */}
          <div>
            <label htmlFor="year_established" className="block text-sm font-medium text-slate-700">
              Year Established *
            </label>
            <input
              type="number"
              id="year_established"
              name="year_established"
              value={formData.year_established}
              onChange={handleChange}
              placeholder="e.g., 2020"
              min={1800}
              max={2100}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Address */}
          <div className="mt-3">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">
              Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Shop address"
              rows={3}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Phone Number */}
          <div className="mt-3">
            <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Phone number"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Shop Logo Upload */}
          <div className="mt-3">
            <label htmlFor="shop_logo" className="block text-sm font-medium text-slate-700">
              Shop Logo (image) *
            </label>
            <input
              type="file"
              id="shop_logo"
              name="shop_logo"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="mt-1 block w-full text-sm"
            />
            {formData.shop_logo && (
              <p className="mt-2 text-xs text-slate-600">Selected: {formData.shop_logo.name}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isLoading ? "Registering..." : "Register Shop"}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <button
          onClick={onNavigateLogin}
          className="font-semibold text-slate-900 hover:underline"
        >
          Login here
        </button>
      </p>
    </div>
  );
};

export default ShopRegistration;
