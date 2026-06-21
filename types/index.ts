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
  title: string;
  image_url: string;
  price: number;
  category: string;
  shop_name: string;
  shop_id: number;
  shop_logo_url: string;
  description: string;
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
