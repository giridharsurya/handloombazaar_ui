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
  id: ID;
  name: string;
  image_url: string;
  shop_id: number;
  shop_name: string;
  shop_logo_url: string;
  price: number;
  discount_price?: number;
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
