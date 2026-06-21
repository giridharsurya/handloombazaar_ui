import React from "react";
import { mockShops } from "@/lib/mockData";

export default function ShopsPage() {
  return (
    <main className="min-h-screen py-8">
      <div className="w-full px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Shops</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mockShops.map((s) => (
              <div key={s.id} className="border rounded-md p-4">
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-gray-600">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
