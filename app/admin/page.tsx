"use client";

import { FormEvent, useEffect, useState } from "react";
import CollectionForm from "@/components/Collections/CollectionForm";
import CollectionActions from "@/components/Collections/CollectionActions";
import CollectionsList from "@/components/Collections/CollectionsList";
import BulkCollectionActions from "@/components/Collections/BulkCollectionActions";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Attribute } from "@/types/apiTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";

type Shop = {
  id: number;
  name: string;
  display_id?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
};
export default function AdminPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [shops, setShops] = useState<Shop[]>([]);
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(false);


  const [attributeName, setAttributeName] = useState<string>("");
  const [attributeOptionsInput, setAttributeOptionsInput] = useState<string>("");
  const [isFilterable, setIsFilterable] = useState<boolean>(true);
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [attributeFeedback, setAttributeFeedback] = useState<string>("");
  const [isSavingAttribute, setIsSavingAttribute] = useState<boolean>(false);

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState<boolean>(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionScope, setCollectionScope] = useState<'system' | 'vendor'>('system');
  const [selectedShopDisplayId, setSelectedShopDisplayId] = useState<string | null>(null);
  const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(false);
  const [collectionsFeedback, setCollectionsFeedback] = useState<string>("");
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null);
  const [editingAttributeData, setEditingAttributeData] = useState<{
    name: string;
    is_filterable: boolean;
    is_required: boolean;
  }>({ name: "", is_filterable: false, is_required: false });
  const [expandedAttributeId, setExpandedAttributeId] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState<string>("");

  const [shopsFeedback, setShopsFeedback] = useState<string>("");

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    if (auth.role !== "admin") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;

    let cancelled = false;

    (async () => {
      // Load shops
      setIsLoadingShops(true);
      setShopsFeedback("");
      try {
        const [allShops, pending] = await Promise.all([
          api.admin.getShops(),
          api.admin.getPendingShops(),
        ]);
        if (cancelled) return;
        setShops(allShops);
        setPendingShops(pending);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load shops";
        setShopsFeedback(message);
      } finally {
        if (cancelled) return;
        setIsLoadingShops(false);
      }

      // Load attributes
      setIsLoadingAttributes(true);
      try {
        const data = await api.admin.getAttributes();
        if (cancelled) return;
        setAttributes(data);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load attributes";
        setAttributeFeedback(message);
      } finally {
        if (cancelled) return;
        setIsLoadingAttributes(false);
      }
      // Load collections
      try {
        setIsLoadingCollections(true);
        const kind = collectionScope === 'system' ? 'system' : 'shop';
        const cols = await api.collections.list({ authenticated: true, kind, shop_display_id: collectionScope === 'vendor' ? selectedShopDisplayId || undefined : undefined });
        if (cancelled) return;
        setCollections(cols || []);
      } catch (error) {
        if (cancelled) return;
        // ignore here, will surface via collectionsFeedback when actions occur
      } finally {
        if (cancelled) return;
        setIsLoadingCollections(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, auth, api]);

  // Reload collections whenever scope or selected shop changes
  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;
    // only load when switching scope or selecting a shop
    loadCollections();
  }, [collectionScope, selectedShopDisplayId]);

  if (isLoading) {
    return null;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  // Collections scope selector UI will be placed near Collections section

  const loadShopsData = async () => {
    setIsLoadingShops(true);
    setShopsFeedback("");

    try {
      const [allShops, pending] = await Promise.all([api.admin.getShops(), api.admin.getPendingShops()]);
      setShops(allShops);
      setPendingShops(pending);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load shops";
      setShopsFeedback(message);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const loadCollections = async () => {
    setCollectionsFeedback("");
    setIsLoadingCollections(true);
    try {
      const kind = collectionScope === 'system' ? 'system' : 'shop';
      const cols = await api.collections.list({ authenticated: true, kind, shop_display_id: collectionScope === 'vendor' ? selectedShopDisplayId || undefined : undefined });
      setCollections(cols || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load collections";
      setCollectionsFeedback(message);
    } finally {
      setIsLoadingCollections(false);
    }
  };


  const loadAttributes = async () => {
    setIsLoadingAttributes(true);

    try {
      const data = await api.admin.getAttributes();
      setAttributes(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load attributes";
      setAttributeFeedback(message);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  



  const handleCreateAttribute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttributeFeedback("");

    const options = attributeOptionsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!attributeName.trim()) {
      setAttributeFeedback("Attribute name is required.");
      return;
    }

    setIsSavingAttribute(true);

    try {
      await api.admin.createAttribute({
        attribute_name: attributeName.trim(),
        options,
        is_filterable: isFilterable,
        is_required: isRequired,
      });

      setAttributeName("");
      setAttributeOptionsInput("");
      setIsFilterable(true);
      setIsRequired(false);
      setAttributeFeedback("Attribute and options created successfully.");
      await loadAttributes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create attribute";
      setAttributeFeedback(message);
    } finally {
      setIsSavingAttribute(false);
    }
  };

  const handleUpdateAttribute = async (attributeId: number) => {
    setAttributeFeedback("");

    if (!editingAttributeData.name.trim()) {
      setAttributeFeedback("Attribute name is required.");
      return;
    }

    try {
      await api.admin.updateAttribute(attributeId, {
        attribute_name: editingAttributeData.name.trim(),
        is_filterable: editingAttributeData.is_filterable,
        is_required: editingAttributeData.is_required,
      });

      setEditingAttributeId(null);
      setAttributeFeedback("Attribute updated successfully.");
      await loadAttributes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update attribute";
      setAttributeFeedback(message);
    }
  };

  const handleUpdateOption = async (attributeId: number, optionId: number) => {
    setAttributeFeedback("");

    if (!editingOptionValue.trim()) {
      setAttributeFeedback("Option value is required.");
      return;
    }

    try {
      await api.admin.updateOption(attributeId, optionId, { option_value: editingOptionValue.trim() });

      setEditingOptionId(null);
      setEditingOptionValue("");
      setAttributeFeedback("Option updated successfully.");
      await loadAttributes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update option";
      setAttributeFeedback(message);
    }
  };

  const handleDeleteOption = async (attributeId: number, optionId: number) => {
    setAttributeFeedback("");

    if (!confirm("Are you sure you want to delete this option?")) {
      return;
    }

    try {
      await api.admin.deleteOption(attributeId, optionId);

      setAttributeFeedback("Option deleted successfully.");
      await loadAttributes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete option";
      setAttributeFeedback(message);
    }
  };

  const handleToggleAttributeActive = async (
    attributeId: number,
    currentActive: boolean
  ) => {
    setAttributeFeedback("");

    try {
      await api.admin.toggleAttributeActive(attributeId);
      await loadAttributes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to toggle attribute status";
      setAttributeFeedback(message);
    }
  };

  const handleDeleteAttribute = async (attributeId: number) => {
    setAttributeFeedback("");

    if (!confirm("Are you sure you want to delete this attribute? This will also delete all attribute options and their associations with products. This cannot be undone.")) {
      return;
    }

    try {
      await api.admin.deleteAttribute(attributeId);
      setAttributeFeedback("Attribute and all associated data deleted successfully.");
      await loadAttributes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete attribute";
      setAttributeFeedback(message);
    }
  };

  const handleShopDecision = async (shopId: number, action: "approve" | "reject") => {
    setShopsFeedback("");

    try {
      await api.admin.shopDecision(shopId, action);
      await loadShopsData();
      setShopsFeedback(action === "approve" ? "Shop approved successfully." : "Shop rejected successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update shop status";
      setShopsFeedback(message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin Console</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Handloom Bazaar Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create and manage collections, define product attributes, and approve or reject
            newly registered shops.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            API endpoint: <span className="font-mono">{API_BASE_URL}</span>
          </p>
        </header>

        {/* Collections Section - delegated to collection components */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Collections</h2>
            <p className="mt-1 text-sm text-slate-600">Manage system and shop collections. Use the components below to create, edit, view constraints, and perform bulk actions.</p>

            

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div className="rounded border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold">Create Collection</h3>
                <CollectionForm mode="create" onSaved={async () => { setCollectionsFeedback("Collection created."); await loadCollections(); }} />
                {collectionsFeedback ? <p className="mt-2 text-sm text-rose-600">{collectionsFeedback}</p> : null}
              </div>
              <div className="rounded border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold">Collections</h3>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600">Scope</label>
                    <select className="rounded border border-slate-300 px-2 py-1 text-sm" value={collectionScope} onChange={(e) => { setCollectionScope(e.target.value as any); }}>
                      <option value="system">System</option>
                      <option value="vendor">Vendor</option>
                    </select>
                    {collectionScope === 'vendor' && (
                      <div className="ml-3">
                        <label className="text-sm text-slate-600">Shop</label>
                        <select className="rounded border border-slate-300 px-2 py-1 text-sm ml-2" value={selectedShopDisplayId || ''} onChange={(e) => setSelectedShopDisplayId(e.target.value || null)}>
                          <option value="">-- select shop --</option>
                          {isLoadingShops ? <option>Loading...</option> : shops.map((s) => (
                            <option key={s.display_id || s.id} value={s.display_id}>{s.name} ({s.display_id})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <CollectionsList
                  collections={collections}
                  editingCollectionId={editingCollectionId}
                    scope={collectionScope}
                    shopDisplayId={collectionScope === 'vendor' ? selectedShopDisplayId || undefined : undefined}
                  onEdit={(col) => setEditingCollectionId(col.id)}
                  onCancelEdit={() => setEditingCollectionId(null)}
                  onSaved={async () => { setEditingCollectionId(null); await loadCollections(); }}
                  onDeleted={async (id) => { await loadCollections(); }}
                />
              </div>
            </div>
          </div>

          {/* single collections list is shown in the right-hand box above */}
        </section>

        {/* Attributes Section */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Create Attribute</h2>
            <p className="mt-1 text-sm text-slate-600">
              Define attributes like fabric and their options.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateAttribute}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="attribute-name">
                    Attribute Name
                  </label>
                  <input
                    id="attribute-name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    value={attributeName}
                    onChange={(event) => setAttributeName(event.target.value)}
                    placeholder="Example: Fabric"
                    required
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="attribute-options"
                  >
                    Options (comma-separated)
                  </label>
                  <input
                    id="attribute-options"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    value={attributeOptionsInput}
                    onChange={(event) => setAttributeOptionsInput(event.target.value)}
                    placeholder="cotton, silk, wool"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFilterable}
                    onChange={(event) => setIsFilterable(event.target.checked)}
                  />
                  Filterable
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(event) => setIsRequired(event.target.checked)}
                  />
                  Required
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingAttribute}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSavingAttribute ? "Saving..." : "Create Attribute"}
              </button>
            </form>

            {attributeFeedback ? (
              <p className="mt-4 text-sm text-slate-700">{attributeFeedback}</p>
            ) : null}
          </div>

          {/* Attributes Table */}
          <div className="border-t border-slate-200 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Existing Attributes</h3>
              {isLoadingAttributes ? (
                <span className="text-sm text-slate-600">Loading...</span>
              ) : (
                <span className="text-sm text-slate-600">{attributes.length} total</span>
              )}
            </div>

            {attributes.length > 0 ? (
              <div className="space-y-4">
                {attributes.map((attr) =>
                  editingAttributeId === attr.id ? (
                    <div
                      key={attr.id}
                      className="rounded-lg border border-slate-300 bg-slate-50 p-4"
                    >
                      <div className="space-y-3">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              Attribute Name
                            </label>
                            <input
                              type="text"
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                              value={editingAttributeData.name}
                              onChange={(e) =>
                                setEditingAttributeData((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editingAttributeData.is_filterable}
                                onChange={(e) =>
                                  setEditingAttributeData((prev) => ({
                                    ...prev,
                                    is_filterable: e.target.checked,
                                  }))
                                }
                              />
                              Filterable
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editingAttributeData.is_required}
                                onChange={(e) =>
                                  setEditingAttributeData((prev) => ({
                                    ...prev,
                                    is_required: e.target.checked,
                                  }))
                                }
                              />
                              Required
                            </label>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateAttribute(attr.id)}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAttributeId(null)}
                            className="rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={attr.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{attr.name}</h4>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                attr.is_active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {attr.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            {attr.is_filterable && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                                Filterable
                              </span>
                            )}
                            {attr.is_required && (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAttributeActive(attr.id, attr.is_active)}
                            className={`rounded-md px-2 py-1 text-xs font-semibold text-white ${
                              attr.is_active
                                ? "bg-slate-600 hover:bg-slate-500"
                                : "bg-emerald-600 hover:bg-emerald-500"
                            }`}
                          >
                            {attr.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedAttributeId(
                                expandedAttributeId === attr.id ? null : attr.id
                              );
                            }}
                            className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-300"
                          >
                            {expandedAttributeId === attr.id ? "Hide" : "Show"} Options
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAttributeId(attr.id);
                              setEditingAttributeData({
                                name: attr.name,
                                is_filterable: attr.is_filterable,
                                is_required: attr.is_required,
                              });
                            }}
                            className="rounded-md bg-slate-600 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-500"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttribute(attr.id)}
                            className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      {expandedAttributeId === attr.id && attr.options.length > 0 && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="mb-2 text-xs font-medium text-slate-600">
                            Options ({attr.options.length})
                          </p>
                          <div className="space-y-2">
                            {attr.options.map((opt) =>
                              editingOptionId === opt.id ? (
                                <div key={opt.id} className="flex gap-2">
                                  <input
                                    type="text"
                                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                                    value={editingOptionValue}
                                    onChange={(e) => setEditingOptionValue(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOption(attr.id, opt.id)}
                                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingOptionId(null);
                                      setEditingOptionValue("");
                                    }}
                                    className="rounded-md bg-slate-400 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div
                                  key={opt.id}
                                  className="flex items-center justify-between rounded bg-slate-50 px-2 py-1.5"
                                >
                                  <span className="text-xs">{opt.value}</span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingOptionId(opt.id);
                                        setEditingOptionValue(opt.value);
                                      }}
                                      className="rounded-md bg-slate-600 px-1.5 py-0.5 text-xs font-semibold text-white hover:bg-slate-500"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOption(attr.id, opt.id)}
                                      className="rounded-md bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white hover:bg-rose-500"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {expandedAttributeId === attr.id && attr.options.length === 0 && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-600">No options available.</p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No attributes found.</p>
            )}
          </div>
        </section>

        {/* Shop Approvals Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Pending Shop Approvals</h2>
              <p className="mt-1 text-sm text-slate-600">
                Approve shops to activate them, or reject to keep them inactive.
              </p>
            </div>
            <button
              type="button"
              onClick={loadShopsData}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          {isLoadingShops ? (
            <p className="mt-4 text-sm text-slate-600">Loading shops...</p>
          ) : null}

          {!isLoadingShops && pendingShops.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No pending shops found.</p>
          ) : null}

          {pendingShops.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="px-3 py-2 font-medium">Shop</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingShops.map((pendingShop) => (
                    <tr key={pendingShop.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">{pendingShop.name}</td>
                      <td className="px-3 py-3">{pendingShop.email}</td>
                      <td className="px-3 py-3">
                        {pendingShop.created_at
                          ? new Date(pendingShop.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleShopDecision(pendingShop.id, "approve")}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShopDecision(pendingShop.id, "reject")}
                            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {shopsFeedback ? (
            <p className="mt-4 text-sm text-slate-700">{shopsFeedback}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}