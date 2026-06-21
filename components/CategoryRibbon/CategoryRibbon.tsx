"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Icon from "@/components/Icon/Icon";
import { Category } from "@/types";

type Props = {
  categories: Category[];
  onCategoryClick?: (cat: Category) => void;
};

export default function CategoryRibbon({ categories, onCategoryClick }: Props) {
  return (
    <Ribbon
      title="Categories"
      action={
        <a href="/categories" className="text-sm text-rose-600 hover:underline">
          View categories
        </a>
      }
      items={categories}
      renderItem={(cat) => (
        <Icon imageUrl={cat.icon_url} label={cat.name} onClick={() => onCategoryClick?.(cat)} variant="category" />
      )}
    />
  );
}
