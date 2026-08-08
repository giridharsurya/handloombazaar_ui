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
  city: string;
  phone_number: string;
  shop_logo_url: string;
  website_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  facebook_url?: string;
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

export type ShopUpdatePayload = {
  name?: string;
  email?: string;
  year_established?: number;
  address?: string;
  city?: string;
  phone_number?: string;
  website_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
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
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  attributes: { definition_id: number; option_id: number; option_value?: string }[]; // attribute summary always returned for product list
};

export type ProductFilterAttribute = {
  id: number;
  name: string;
  is_filterable?: boolean;
  is_required?: boolean;
  options: { id: number; value: string }[];
};

export type ProductUpdateRequest = {
  name?: string;
  description?: string | null;
  price?: number;
  discount_price?: number | null;
  stock_quantity?: number;
  video_url?: string | null;
  product_group_id?: number | null;
  is_active?: boolean;
  attributes?: { definition_id: number; option_id: number }[];
  image_urls?: string[];
  primary_image_index?: number;
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

export type ProductListQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  shop_display_id?: string;
  track_shop_view?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: "newest" | "price-low" | "price-high";
  attribute_filters?: string[];
  attribute_option_ids?: number[];
  authenticated?: boolean;
};

export type CollectionProductsQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: "newest" | "price-low" | "price-high";
  attribute_option_ids?: number[];
  mode?: "view" | "add" | "delete";
  authenticated?: boolean;
  source_collection_id?: number;
  source_shop_display_id?: string;
  shop_display_id?: string;
  track_view?: boolean;
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
  email: string;
  phone_number: string;
  address: string;
  city?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
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
  city: string | null;
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
  stock_quantity: number;
  product_group_id?: number | null;
  group_product_count: number;
  video_url?: string | null;
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

export type BulkAttributeUpdateItem = {
  definition_id: number;
  option_id?: number;
  remove?: boolean;
};

export type BulkUpdateProductAttributesRequest = {
  product_display_ids: string[];
  updates: BulkAttributeUpdateItem[];
};

export type BulkUpdateProductAttributesResponse = {
  success: boolean;
  message: string;
  updated_count: number;
};

export type BulkProductActionType =
  | "set_active"
  | "set_inactive"
  | "change_price_percent"
  | "set_discount_percent"
  | "delete_products"
  | "set_quantity";

export type BulkProductActionRequest = {
  product_display_ids: string[];
  action: BulkProductActionType;
  percentage?: number;
  quantity?: number;
};

export type BulkProductActionResponse = {
  success: boolean;
  message: string;
  affected_count: number;
};

export type AdminShop = {
  id: number;
  name: string;
  email: string;
  city?: string | null;
  is_active?: boolean;
  display_id: string;
  year_established?: number;
  address?: string;
  phone_number?: string;
  website_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
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

export type AnnouncementBanner = {
  id: number;
  display_id: string;
  title: string;
  subtitle?: string | null;
  background_color: string;
  text_color: string;
  is_active: boolean;
  collection_id: number;
  collection_name?: string;
  collection_scope?: "system" | "shop";
  banner_scope?: "system" | "shop";
  shop_id?: number | null;
  target?: string;
};

export type AnnouncementUpsertRequest = {
  collection_id: number;
  title: string;
  subtitle?: string | null;
  background_color?: string;
  text_color?: string;
  is_active?: boolean;
  shop_display_id?: string;
  track_shop_view?: boolean;
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
