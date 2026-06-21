import React from "react";
import { mockFeatured } from "@/lib/mockData";

export default function FeaturedPage() {
  return (
    <main className="min-h-screen py-8">
      <div className="w-full px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Featured Sarees</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockFeatured.map((f) => (
              <div key={f.id} className="border rounded-md overflow-hidden">
                <div className="h-56 bg-gray-200 flex items-center justify-center">{f.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
