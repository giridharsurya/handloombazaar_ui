import React from "react";
import { mockFeatured } from "@/lib/mockData";

export default function FeaturedPage() {
  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full py-8 px-4">
        <div className="w-full mx-auto">
          <h1 className="text-3xl font-bold mb-8">Featured Sarees</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockFeatured.map((f) => (
              <div key={f.id} className="border rounded-md overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-56 bg-gray-200 flex items-center justify-center">{f.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
