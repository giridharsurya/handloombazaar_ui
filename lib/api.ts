import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ProductCreateRequest,
  Product,
  ProductCreateResponse,
  AdminShop,
  Collection,
  Attribute,
  ProductsResponse,
  ProductDetailResponse,
  ProductVariantsResponse,
  ProductListItem,
  TokenVerifyResponse,
  GetShopStatusRequest,
  ShopStatusResponse,
  ListShopsResponse,
  GetShopDetailRequest,
  ShopDetail,
} from "../types/apiTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";
import { apiFetch } from "./apiClient";

async function parseError(response: Response) {
  try {
    const data = await response.json();
    return data?.detail || response.statusText || "Request failed";
  } catch {
    return response.statusText || "Request failed";
  }
}

export const api = {
  auth: {
    async login(payload: LoginRequest): Promise<LoginResponse> {
      let existingToken: string | undefined = undefined;
      if (typeof window !== "undefined") {
        existingToken = localStorage.getItem("auth_token") || undefined;
      }

      const res = await apiFetch(`/api/auth/login`, {
        method: "POST",
        body: JSON.stringify(payload),
        // include existing Authorization header when available to allow token reuse
        token: existingToken,
        requiresAuth: false,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async register(payload: RegisterRequest | FormData): Promise<RegisterResponse> {
      const isForm = payload instanceof FormData;
      const res = await apiFetch(`/api/auth/shop/register`, {
        method: "POST",
        body: isForm ? (payload as FormData) : JSON.stringify(payload),
        requiresAuth: false,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async verify(token: string): Promise<TokenVerifyResponse> {
      const res = await apiFetch(`/api/auth/shop/verify?token=${encodeURIComponent(token)}`, {
        method: "POST",
        requiresAuth: false,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
  },

  products: {
    async createProduct(payload: ProductCreateRequest | FormData): Promise<ProductCreateResponse> {
      const isForm = payload instanceof FormData;
      const res = await apiFetch(`/api/products/create`, {
        method: "POST",
        body: isForm ? (payload as FormData) : JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async getProducts(params: {
      page?: number;
      page_size?: number;
      search?: string;
      shop_display_id?: string;
      min_price?: number;
      max_price?: number;
      attribute_filters?: string[];
      authenticated?: boolean;
    } = {}): Promise<ProductListItem[]> {
      const { authenticated, attribute_filters, ...query } = params;
      const qs = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      });
      if (attribute_filters && attribute_filters.length) {
        attribute_filters.forEach((f) => qs.append("attribute_filters", f));
      }

      const res = await apiFetch(`/api/products?${qs.toString()}`, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      const productResponse: ProductsResponse = await res.json();
      return productResponse.data?.items || [];
    },

    async getProductDetails(displayId: string, { authenticated = false }: { authenticated?: boolean } = {}): Promise<ProductDetailResponse> {
      const res = await apiFetch(`/api/products/${encodeURIComponent(displayId)}`, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async getProductVariants(displayId: string, { authenticated = false }: { authenticated?: boolean } = {}): Promise<ProductVariantsResponse> {
      const res = await apiFetch(`/api/products/${encodeURIComponent(displayId)}/variants`, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
  },

  shops: {
    async getStatus(request: GetShopStatusRequest): Promise<ShopStatusResponse> {
      const res = await apiFetch(`/api/shops/${encodeURIComponent(request.display_id)}/status`, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async getDetail(request: GetShopDetailRequest): Promise<ShopDetail> {
      const res = await apiFetch(`/api/shops/${encodeURIComponent(request.display_id)}`, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async list(): Promise<ListShopsResponse> {
      const res = await apiFetch(`/api/shops`, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
  },

  admin: {
    async getShops(): Promise<AdminShop[]> {
      const res = await apiFetch(`/api/admin/shops`, { cache: "no-store", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },

    async getPendingShops(): Promise<AdminShop[]> {
      const res = await apiFetch(`/api/admin/shops/pending`, { cache: "no-store", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },

    async getCollections(): Promise<Collection[]> {
      const res = await apiFetch(`/api/admin/collections`, { cache: "no-store", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },

    async createCollection(payload: { name: string; description?: string | null }) {
      const res = await apiFetch(`/api/admin/collections`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async updateCollection(collectionId: number, payload: any) {
      const res = await apiFetch(`/api/admin/collections/${collectionId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async deleteCollection(collectionId: number) {
      const res = await apiFetch(`/api/admin/collections/${collectionId}`, { method: "DELETE", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res;
    },

    async getAttributes(): Promise<Attribute[]> {
      const res = await apiFetch(`/api/admin/attributes`, { cache: "no-store", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },

    async createAttribute(payload: any) {
      const res = await apiFetch(`/api/admin/attributes`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async updateAttribute(attributeId: number, payload: any) {
      const res = await apiFetch(`/api/admin/attributes/${attributeId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async updateOption(attributeId: number, optionId: number, payload: any) {
      const res = await apiFetch(
        `/api/admin/attributes/${attributeId}/options/${optionId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
          requiresAuth: true,
        }
      );
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async deleteOption(attributeId: number, optionId: number) {
      const res = await apiFetch(
        `/api/admin/attributes/${attributeId}/options/${optionId}`,
        { method: "DELETE", requiresAuth: true }
      );
      if (!res.ok) throw new Error(await parseError(res));
      return res;
    },

    async toggleAttributeActive(attributeId: number) {
      const res = await apiFetch(`/api/admin/attributes/${attributeId}/toggle`, {
        method: "PUT",
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res;
    },

    async shopDecision(shopId: number, action: "approve" | "reject") {
      const res = await apiFetch(`/api/admin/shops/${shopId}/${action}`, {
        method: "POST",
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res;
    },
  },
};

export default api;
