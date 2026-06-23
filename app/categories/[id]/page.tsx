import React from "react";
import { notFound } from "next/navigation";
import CategoryProductsPage from "@/components/CategoryDetails/CategoryProductsPage";
import { mockCategories, mockSarees } from "@/lib/mockData";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;

  const category = mockCategories.find((item) => String(item.id) === id);

  if (!category) {
    notFound();
  }

  const products = mockSarees.filter((item) => item.category === category.name);

  return <CategoryProductsPage categoryName={category.name} products={products} />;
}
