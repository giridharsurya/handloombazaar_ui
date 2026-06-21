"use client";

import React from "react";
import { Category } from "@/types";
import CategorySection from "@/components/Categories/CategorySection";

type CategoriesProps = {
  categories: Category[];
};

export default function Categories({ categories }: CategoriesProps) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}
