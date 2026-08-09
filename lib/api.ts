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
  CollectionOverviewSlot,
  Attribute,
  ProductsResponse,
  ProductsResponseData,
  ProductListQueryParams,
  CollectionProductsQueryParams,
  ProductDetailResponse,
  ProductVariantsResponse,
  ProductListItem,
  ProductFilterAttribute,
  ProductUpdateRequest,
  BulkUpdateProductAttributesRequest,
  BulkUpdateProductAttributesResponse,
  BulkProductActionRequest,
  BulkProductActionResponse,
  TokenVerifyResponse,
  GetShopStatusRequest,
  ShopStatusResponse,
  ListShopsResponse,
  PaginatedShopsResponse,
  GetShopDetailRequest,
  ShopDetail,
  ShopUpdatePayload,
  AnnouncementBanner,
  AnnouncementUpsertRequest,
  AnnouncementOrderRequest,
  PaginatedCollectionsResponse,
} from "../types/apiTypes";

const pendingProductPageRequests = new Map<string, Promise<ProductsResponseData>>();
const pendingShopDetailRequests = new Map<string, Promise<ShopDetail>>();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";
import { apiFetch } from "./apiClient";

async function parseError(response: Response) {
  try {
    const data = await response.json();
    const detail = data?.detail;
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const loc = Array.isArray((item as any).loc) ? (item as any).loc.join(".") : "field";
            const msg = (item as any).msg || JSON.stringify(item);
            return `${loc}: ${msg}`;
          }
          return String(item);
        })
        .join("; ");
    }
    if (detail && typeof detail === "object") {
      return JSON.stringify(detail);
    }
    return response.statusText || "Request failed";
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

    async getProductsPage(params: ProductListQueryParams = {}): Promise<ProductsResponseData> {
      const { authenticated, attribute_filters, attribute_option_ids, track_shop_view, ...query } = params;
      const qs = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      });
      if (attribute_filters && attribute_filters.length) {
        attribute_filters.forEach((f) => qs.append("attribute_filters", f));
      }
      if (attribute_option_ids && attribute_option_ids.length) {
        attribute_option_ids.forEach((id) => qs.append("attribute_option_ids", String(id)));
      }
      if (track_shop_view) {
        qs.append("track_shop_view", "true");
      }

      const cacheKey = `/api/products?${qs.toString()}|auth=${!!authenticated}`;
      if (pendingProductPageRequests.has(cacheKey)) {
        return pendingProductPageRequests.get(cacheKey)!;
      }

      const requestPromise = (async () => {
        try {
          const res = await apiFetch(`/api/products?${qs.toString()}`, { requiresAuth: !!authenticated });
          if (!res.ok) throw new Error(await parseError(res));
          const productResponse: ProductsResponse = await res.json();
          return productResponse.data;
        } finally {
          pendingProductPageRequests.delete(cacheKey);
        }
      })();

      pendingProductPageRequests.set(cacheKey, requestPromise);
      return requestPromise;
    },

    async getProducts(params: ProductListQueryParams = {}): Promise<ProductListItem[]> {
      const pageData = await this.getProductsPage(params);
      return pageData?.items || [];
    },

    async getFilterAttributes(): Promise<ProductFilterAttribute[]> {
      const res = await apiFetch(`/api/products/filters/attributes`, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async getEditableAttributes({ authenticated = false }: { authenticated?: boolean } = {}): Promise<ProductFilterAttribute[]> {
      const res = await apiFetch(`/api/products/attributes`, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
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

    async updateProductVariants(displayId: string, variantDisplayIds: string[]): Promise<ProductDetailResponse> {
      const res = await apiFetch(`/api/products/${encodeURIComponent(displayId)}/update-variants`, {
        method: "POST",
        body: JSON.stringify({ variant_display_ids: variantDisplayIds }),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async bulkUpdateAttributes(payload: BulkUpdateProductAttributesRequest): Promise<BulkUpdateProductAttributesResponse> {
      const res = await apiFetch(`/api/products/bulk-update-attributes`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async bulkProductAction(payload: BulkProductActionRequest): Promise<BulkProductActionResponse> {
      const res = await apiFetch(`/api/products/bulk-product-action`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async updateProduct(displayId: string, payload: ProductUpdateRequest | FormData): Promise<ProductDetailResponse> {
      const isForm = payload instanceof FormData;
      const res = await apiFetch(`/api/products/${encodeURIComponent(displayId)}`, {
        method: "PUT",
        body: isForm ? (payload as FormData) : JSON.stringify(payload),
        requiresAuth: true,
      });
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
      const cacheKey = `/api/shops/${encodeURIComponent(request.display_id)}`;
      if (pendingShopDetailRequests.has(cacheKey)) {
        return pendingShopDetailRequests.get(cacheKey)!;
      }

      const requestPromise = (async () => {
        try {
          const res = await apiFetch(cacheKey, { requiresAuth: false });
          if (!res.ok) throw new Error(await parseError(res));
          return res.json();
        } finally {
          pendingShopDetailRequests.delete(cacheKey);
        }
      })();

      pendingShopDetailRequests.set(cacheKey, requestPromise);
      return requestPromise;
    },
    async list(params: { sort_by?: "newest" | "most-viewed" | "product-count"; page?: number; page_size?: number; view_count?: boolean } = {}): Promise<ListShopsResponse> {
      const qs = new URLSearchParams();
      if (params.sort_by) qs.append("sort_by", params.sort_by);
      if (params.page !== undefined) qs.append("page", String(params.page));
      if (params.page_size !== undefined) qs.append("page_size", String(params.page_size));
      if (params.view_count) qs.append("view_count", "true");
      const path = qs.toString() ? `/api/shops?${qs.toString()}` : `/api/shops`;
      const res = await apiFetch(path, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },
    async listPage(params: { sort_by?: "newest" | "most-viewed" | "product-count"; page?: number; page_size?: number; view_count?: boolean } = {}): Promise<PaginatedShopsResponse> {
      const qs = new URLSearchParams();
      if (params.sort_by) qs.append("sort_by", params.sort_by);
      if (params.page !== undefined) qs.append("page", String(params.page));
      if (params.page_size !== undefined) qs.append("page_size", String(params.page_size));
      if (params.view_count) qs.append("view_count", "true");
      const path = qs.toString() ? `/api/shops?${qs.toString()}` : `/api/shops`;
      const res = await apiFetch(path, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async getManageDetail(request: GetShopDetailRequest): Promise<ShopDetail> {
      const res = await apiFetch(`/api/shops/${encodeURIComponent(request.display_id)}/manage`, { requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async update(displayId: string, payload: ShopUpdatePayload): Promise<ShopDetail> {
      const res = await apiFetch(`/api/shops/${encodeURIComponent(displayId)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async updateLogo(displayId: string, logoFile: File): Promise<ShopDetail> {
      const form = new FormData();
      form.append("shop_logo", logoFile);
      const res = await apiFetch(`/api/shops/${encodeURIComponent(displayId)}/logo`, {
        method: "PUT",
        body: form,
        requiresAuth: true,
      });
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
      const res = await apiFetch(`/api/collections?kind=system`, { cache: "no-store", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },

    async createCollection(payload: { name: string; description?: string | null }) {
      const res = await apiFetch(`/api/collections/create`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async updateCollection(collectionId: number, payload: any) {
      const res = await apiFetch(`/api/collections/${collectionId}/update`, {
        method: "PUT",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async deleteCollection(collectionId: number) {
      const res = await apiFetch(`/api/collections/${collectionId}/delete`, { method: "DELETE", requiresAuth: true });
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

    async deleteAttribute(attributeId: number) {
      const res = await apiFetch(`/api/admin/attributes/${attributeId}`, { method: "DELETE", requiresAuth: true });
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
  collections: {
    async list(params: { kind?: "system" | "shop"; shop_display_id?: string; display_on_homepage?: boolean; sort_by?: "newest" | "most-viewed" | "product-count"; page?: number; page_size?: number; view_count?: boolean; authenticated?: boolean } = {}): Promise<ListCollectionsResponse> {
      const { authenticated, shop_display_id, display_on_homepage, kind, sort_by, page, page_size, view_count } = params;
      const qs = new URLSearchParams();
      if (kind) qs.append("kind", kind);
      if (shop_display_id) qs.append("shop_display_id", shop_display_id);
      if (typeof display_on_homepage === "boolean") qs.append("display_on_homepage", String(display_on_homepage));
      if (sort_by) qs.append("sort_by", sort_by);
      if (page !== undefined) qs.append("page", String(page));
      if (page_size !== undefined) qs.append("page_size", String(page_size));
      if (view_count) qs.append("view_count", "true");

      const res = await apiFetch(`/api/collections?${qs.toString()}`, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : data;
    },
    async listPage(params: { kind?: "system" | "shop"; shop_display_id?: string; sort_by?: "newest" | "most-viewed" | "product-count"; page?: number; page_size?: number; view_count?: boolean; authenticated?: boolean } = {}): Promise<PaginatedCollectionsResponse> {
      const { authenticated, shop_display_id, kind, sort_by, page, page_size, view_count } = params;
      const qs = new URLSearchParams();
      if (kind) qs.append("kind", kind);
      if (shop_display_id) qs.append("shop_display_id", shop_display_id);
      if (sort_by) qs.append("sort_by", sort_by);
      if (page !== undefined) qs.append("page", String(page));
      if (page_size !== undefined) qs.append("page_size", String(page_size));
      if (view_count) qs.append("view_count", "true");

      const res = await apiFetch(`/api/collections?${qs.toString()}`, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async getConstraints(collectionId: number) {
      const res = await apiFetch(`/api/collections/${collectionId}/constraints`, { requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async updateConstraints(collectionId: number, payload: any) {
      const res = await apiFetch(`/api/collections/${collectionId}/constraints`, { method: "PUT", body: JSON.stringify(payload), requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async getProductsPage(collectionId: number, params: CollectionProductsQueryParams = {}): Promise<ProductsResponseData> {
      const { authenticated, attribute_option_ids, track_view, ...query } = params;
      const qs = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      });
      if (attribute_option_ids && attribute_option_ids.length) {
        attribute_option_ids.forEach((id) => qs.append("attribute_option_ids", String(id)));
      }
      if (track_view) {
        qs.append("track_view", "true");
      }

      const suffix = qs.toString();
      const path = suffix
        ? `/api/collections/${collectionId}/products?${suffix}`
        : `/api/collections/${collectionId}/products`;

      const res = await apiFetch(path, { requiresAuth: !!authenticated });
      if (!res.ok) throw new Error(await parseError(res));
      const payload = await res.json();

      if (payload?.data?.items && Array.isArray(payload.data.items)) {
        return payload.data as ProductsResponseData;
      }

      // Backward compatibility for older backend shape: { items: [...] }
      const fallbackItems = Array.isArray(payload?.items) ? payload.items : [];
      return {
        page: Number(params.page || 1),
        page_size: Number(params.page_size || fallbackItems.length || 20),
        total_count: fallbackItems.length,
        has_next: false,
        items: fallbackItems,
      };
    },

    async getProducts(collectionId: number, params: CollectionProductsQueryParams = {}) {
      const pageData = await this.getProductsPage(collectionId, params);
      return { items: pageData.items };
    },

    async addProducts(collectionId: number, productIds: string[]) {
      const res = await apiFetch(`/api/collections/${collectionId}/add`, { method: "POST", body: JSON.stringify({ product_display_ids: productIds }), requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async removeProducts(collectionId: number, productIds: string[]) {
      const res = await apiFetch(`/api/collections/${collectionId}/remove`, { method: "POST", body: JSON.stringify({ product_display_ids: productIds }), requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async createCollection(payload: any) {
      const res = await apiFetch(`/api/collections/create`, { method: "POST", body: JSON.stringify(payload), requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async updateCollection(collectionId: number, payload: any) {
      const res = await apiFetch(`/api/collections/${collectionId}/update`, { method: "PUT", body: JSON.stringify(payload), requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async toggleHomepageDisplay(collectionId: number, displayOnHomepage: boolean, shop_display_id?: string) {
      const body: Record<string, unknown> = {
        collection_id: collectionId,
        display_on_homepage: displayOnHomepage,
      };
      if (shop_display_id) body.shop_display_id = shop_display_id;

      const res = await apiFetch(`/api/collections/homepage/toggle`, {
        method: "POST",
        body: JSON.stringify(body),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async orderHomepageCollections(collectionIds: number[], shop_display_id?: string) {
      const body: Record<string, unknown> = {
        collection_ids: collectionIds,
      };
      if (shop_display_id) body.shop_display_id = shop_display_id;

      const res = await apiFetch(`/api/collections/homepage/order`, {
        method: "POST",
        body: JSON.stringify(body),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    async deleteCollection(collectionId: number) {
      const res = await apiFetch(`/api/collections/${collectionId}/delete`, { method: "DELETE", requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      return res;
    },

    async listOverviewSlots(params: { shop_display_id?: string } = {}): Promise<CollectionOverviewSlot[]> {
      const qs = new URLSearchParams();
      if (params.shop_display_id) qs.append("shop_display_id", params.shop_display_id);
      const res = await apiFetch(`/api/collections/overview?${qs.toString()}`, { requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    },

    async orderOverviewSlots(payload: { shop_display_id?: string; slots: Array<{ collection_id: number; slot_position: number }> }) {
      const res = await apiFetch(`/api/collections/overview/order`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
  },

  announcements: {
    async list(params: { shop_display_id?: string; include_inactive?: boolean; include_hidden?: boolean } = {}): Promise<AnnouncementBanner[]> {
      const qs = new URLSearchParams();
      if (params.shop_display_id) qs.append("shop_display_id", params.shop_display_id);
      if (typeof params.include_inactive === "boolean") qs.append("include_inactive", String(params.include_inactive));
      if (typeof params.include_hidden === "boolean") qs.append("include_hidden", String(params.include_hidden));

      const res = await apiFetch(`/api/announcements?${qs.toString()}`, { requiresAuth: false });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    },

    async getByCollection(collectionId: number, params: { shop_display_id?: string } = {}): Promise<AnnouncementBanner | null> {
      const qs = new URLSearchParams();
      if (params.shop_display_id) qs.append("shop_display_id", params.shop_display_id);

      const res = await apiFetch(`/api/announcements/by-collection/${collectionId}?${qs.toString()}`, { requiresAuth: true });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return data?.item || null;
    },

    async order(payload: AnnouncementOrderRequest): Promise<{ message: string }> {
      const res = await apiFetch(`/api/announcements/order`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },

    async upsert(payload: AnnouncementUpsertRequest): Promise<AnnouncementBanner> {
      const res = await apiFetch(`/api/announcements/upsert`, {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return data.item;
    },

    async deleteByCollection(collectionId: number, params: { shop_display_id?: string } = {}): Promise<void> {
      const qs = new URLSearchParams();
      if (params.shop_display_id) qs.append("shop_display_id", params.shop_display_id);

      const res = await apiFetch(`/api/announcements/by-collection/${collectionId}?${qs.toString()}`, {
        method: "DELETE",
        requiresAuth: true,
      });
      if (!res.ok) throw new Error(await parseError(res));
    },
  },
};

export default api;
