"use client";

import React from "react";

export default function SearchBar({ placeholder = "Search for Maheswari Sarees" }: { placeholder?: string }) {
  return (
    <div className="w-full max-w-xl">
      <label className="relative block">
        <span className="sr-only">Search</span>
        <input
          className="block w-full rounded-full border border-gray-300 bg-white py-3 px-4 pl-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
          placeholder={placeholder}
          type="search"
        />
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
      </label>
    </div>
  );
}
