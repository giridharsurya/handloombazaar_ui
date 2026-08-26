import React from "react";

export type ShopEditableValues = {
  name: string;
  email: string;
  shop_slug: string;
  description: string;
  year_established: string;
  address: string;
  city: string;
  phone_number: string;
  website_url: string;
  youtube_url: string;
  instagram_url: string;
  facebook_url: string;
};

type ShopEditableFieldsProps = {
  values: ShopEditableValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onValidateSlug?: () => void;
  isValidatingSlug?: boolean;
  slugValidationMessage?: string | null;
  slugValidated?: boolean;
  disabled?: boolean;
};

export default function ShopEditableFields({ values, onChange, onValidateSlug, isValidatingSlug = false, slugValidationMessage, slugValidated = false, disabled = false }: ShopEditableFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Shop Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={values.name}
          onChange={onChange}
          required
          disabled={disabled}
          placeholder="Enter your shop name"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={values.email}
          onChange={onChange}
          required
          disabled={disabled}
          placeholder="Enter email"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={onChange}
          rows={4}
          disabled={disabled}
          placeholder="Tell customers about your shop, craftsmanship, and specialties"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="shop_slug" className="block text-sm font-medium text-slate-700">
          Shop URL Slug *
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            id="shop_slug"
            name="shop_slug"
            value={values.shop_slug}
            onChange={onChange}
            required
            disabled={disabled}
            placeholder="mangalagiri-handloom-store"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          />
          {onValidateSlug ? (
            <button
              type="button"
              onClick={onValidateSlug}
              disabled={disabled || isValidatingSlug}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isValidatingSlug ? "Checking..." : "Validate"}
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">Your public shop page will be /shops/{values.shop_slug || "your-slug"}</p>
        {slugValidationMessage ? (
          <p className={`mt-1 text-xs ${slugValidated ? "text-emerald-600" : "text-amber-600"}`}>
            {slugValidationMessage}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="year_established" className="block text-sm font-medium text-slate-700">
          Year Established *
        </label>
        <input
          type="number"
          id="year_established"
          name="year_established"
          value={values.year_established}
          onChange={onChange}
          min={1800}
          max={2100}
          required
          disabled={disabled}
          placeholder="e.g., 2020"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700">
          Address *
        </label>
        <textarea
          id="address"
          name="address"
          value={values.address}
          onChange={onChange}
          rows={3}
          required
          disabled={disabled}
          placeholder="Shop address"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-700">
          City *
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={values.city}
          onChange={onChange}
          required
          disabled={disabled}
          placeholder="City"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone_number"
          name="phone_number"
          value={values.phone_number}
          onChange={onChange}
          required
          disabled={disabled}
          placeholder="Phone number"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="website_url" className="block text-sm font-medium text-slate-700">
          Website URL
        </label>
        <input
          type="url"
          id="website_url"
          name="website_url"
          value={values.website_url}
          onChange={onChange}
          disabled={disabled}
          placeholder="https://example.com"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="youtube_url" className="block text-sm font-medium text-slate-700">
          YouTube URL
        </label>
        <input
          type="url"
          id="youtube_url"
          name="youtube_url"
          value={values.youtube_url}
          onChange={onChange}
          disabled={disabled}
          placeholder="https://youtube.com/..."
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="instagram_url" className="block text-sm font-medium text-slate-700">
          Instagram URL
        </label>
        <input
          type="url"
          id="instagram_url"
          name="instagram_url"
          value={values.instagram_url}
          onChange={onChange}
          disabled={disabled}
          placeholder="https://instagram.com/..."
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="facebook_url" className="block text-sm font-medium text-slate-700">
          Facebook URL
        </label>
        <input
          type="url"
          id="facebook_url"
          name="facebook_url"
          value={values.facebook_url}
          onChange={onChange}
          disabled={disabled}
          placeholder="https://facebook.com/..."
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>
    </div>
  );
}