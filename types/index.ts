import { ReactNode } from "react";

export type ID = string | number;

export interface Shop {
  id: ID;
  name: string;
  logo_url: string;
  description?: string;
}

export interface Category {
  id: ID;
  name: string;
  icon_url: string;
  color?: string;
}

export interface Product {
  // Backend contract fields (from ProductListItem)
  display_id: string;
  name: string;
  image_url: string;
  shop_display_id: string;
  shop_name: string;
  shop_logo_url: string;
  price: number;
  discount_price: number | null;
  is_active?: boolean;
  // Additional detail fields
  description?: string | null;
  stock_quantity?: number;
  created_at?: string | null;
  updated_at?: string | null;
  category?: string;
}

export interface IconProps {
  imageUrl?: string;
  label?: string;
  onClick?: () => void;
  variant?: "shop" | "category" | "default";
}

export interface RibbonProps<T> {
  items: T[];
  renderItem: (item: T, index?: number) => ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}
