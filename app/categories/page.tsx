import React from "react";
import { mockCategories } from "@/lib/mockData";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen py-8">
      <div className="w-full px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Categories</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mockCategories.map((c) => (
              <div key={c.id} className="border rounded-md p-4">
                <div className="font-semibold">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
