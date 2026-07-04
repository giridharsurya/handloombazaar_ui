// Centralized request/response types for backend API

type UserRole = "shop_owner" | "admin" | "user";

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  shop_display_id: string | null;
  username: string;
  email: string;
  role: UserRole;
  shop_name: string | null;
  token: string;
  approved: boolean;
  message: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  shop_name: string;
  email: string;
  year_established: number;
  address: string;
  phone_number: string;
  shop_logo_url: string;
};

export type RegisterResponse = {
  shop_display_id: string;
  username: string;
  email: string;
  role: UserRole;
  token: string;
  approved: boolean;
  message: string;
};

export type TokenVerifyResponse = {
  valid: boolean;
  shop_display_id: string | null;
  username: string | null;
  role: UserRole | null;
};

export type ProductCreateRequest = {
  shop_display_id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  stock_quantity: number;
  images: string[];
};

export type Product = {
  display_id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number | null;
  stock_quantity: number;
  images: string[];
  shop_display_id: string;
};

export type ProductCreateResponse = {
  success: boolean;
  message: string;
  data: {
    product_display_id: string;
    shop_display_id: string;
    name: string;
  };
};

export type ProductListItem = {
  display_id: string;
  name: string;
  image_url: string;
  shop_display_id: string;
  shop_name: string;
  shop_logo_url: string;
  price: number;
  discount_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductsResponseData = {
  page: number;
  page_size: number;
  total_count: number;
  has_next: boolean;
  items: ProductListItem[];
};

export type ProductsResponse = {
  success: boolean;
  message: string;
  data: ProductsResponseData;
};

export type ProductAttributeItem = {
  definition_id: number;
  name: string;
  option_id: number;
  value: string;
  is_filterable: boolean;
};

export type ShopSummary = {
  display_id: string;
  name: string;
  shop_logo_url: string;
};

export type GetShopStatusRequest = {
  display_id: string;
};

export type ShopStatusResponse = {
  display_id: string;
  name: string;
  shop_logo_url: string;
  approved: boolean;
  is_active: boolean;
};

export type ListShopsResponse = ShopStatusResponse[];

export type ShopDetail = ShopStatusResponse & {
  description: string | null;
  email: string;
  address: string;
  phone_number: string;
  year_established: number;
  website_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
};

export type GetShopDetailRequest = {
  display_id: string;
};

export type ProductDetail = {
  display_id: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
  shop: ShopSummary;
  images: string[];
  attributes: ProductAttributeItem[];
};

export type ProductDetailResponse = {
  success: boolean;
  message: string;
  product: ProductDetail;
};

export type ProductVariantsResponse = {
  success: boolean;
  message: string;
  data: ProductListItem[];
};

export type AdminShop = {
  id: number;
  name: string;
  email: string;
  is_active?: boolean;
  approved?: boolean;
  created_at?: string;
};

export type Collection = {
  id: number;
  name: string;
  description: string | null;
  display_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Attribute = {
  id: number;
  name: string;
  display_id: string;
  is_filterable: boolean;
  is_required: boolean;
  is_active: boolean;
  options: { id: number; value: string, display_id:string, created_at: string}[];
  created_at: string;
  updated_at: string;
};
