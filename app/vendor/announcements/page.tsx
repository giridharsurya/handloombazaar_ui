"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import type { AnnouncementBanner, Collection, ShopDetail } from "@/types/apiTypes";

export default function VendorAnnouncementsPage() {
  const { auth, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F43F5E");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  const shopDisplayId = auth?.shop_display_id;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!shopDisplayId) return;

    const loadShop = async () => {
      try {
        const shopDetail = await api.shops.getDetail({ display_id: shopDisplayId });
        setShop(shopDetail);
      } catch (error) {
        console.error("Failed to load shop details", error);
      }
    };

    const loadCollections = async () => {
      try {
        const rows = await api.collections.list({
          kind: "shop",
          shop_display_id: shopDisplayId,
          authenticated: true,
        });
        setCollections((rows || []) as Collection[]);
      } catch (error) {
        console.error("Failed to load shop collections", error);
        setCollections([]);
      }
    };

    loadShop();
    loadCollections();
  }, [shopDisplayId, api]);

  const loadAnnouncements = async () => {
    if (!shopDisplayId) return;

    try {
      const rows = await api.announcements.list({ shop_display_id: shopDisplayId, include_inactive: true, include_hidden: true });
      setAnnouncements(rows || []);
    } catch (error) {
      console.error("Failed to load announcements", error);
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [shopDisplayId]);

  const selectedCollectionName = useMemo(() => {
    return collections.find((c) => c.id === selectedCollectionId)?.name || "";
  }, [collections, selectedCollectionId]);

  const loadSelectedBanner = async (collectionId: number | null) => {
    if (!collectionId || !shopDisplayId) {
      setTitle("");
      setSubtitle("");
      setBackgroundColor("#F43F5E");
      setTextColor("#FFFFFF");
      setIsActive(true);
      return;
    }

    try {
      const item = await api.announcements.getByCollection(collectionId, { shop_display_id: shopDisplayId });
      if (item) {
        setTitle(item.title || "");
        setSubtitle(item.subtitle || "");
        setBackgroundColor(item.background_color || "#F43F5E");
        setTextColor(item.text_color || "#FFFFFF");
        setIsActive(item.is_active);
      } else {
        setTitle(selectedCollectionName || "");
        setSubtitle("");
        setBackgroundColor("#F43F5E");
        setTextColor("#FFFFFF");
        setIsActive(true);
      }
    } catch (error) {
      console.error("Failed to load banner", error);
      setTitle(selectedCollectionName || "");
      setSubtitle("");
      setBackgroundColor("#F43F5E");
      setTextColor("#FFFFFF");
      setIsActive(true);
    }
  };

  useEffect(() => {
    loadSelectedBanner(selectedCollectionId);
  }, [selectedCollectionId, shopDisplayId, selectedCollectionName]);

  const filteredAnnouncements = useMemo(() => {
    return announcements;
  }, [announcements]);

  const onSave = async () => {
    if (!selectedCollectionId) {
      setMessage("Select a shop collection.");
      return;
    }
    if (!title.trim()) {
      setMessage("Banner title is required.");
      return;
    }
    if (!shopDisplayId) {
      setMessage("Unable to determine shop.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await api.announcements.upsert({
        collection_id: selectedCollectionId,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        background_color: backgroundColor,
        text_color: textColor,
        is_active: isActive,
        shop_display_id: shopDisplayId,
      });
      setMessage("Banner saved.");
      await loadAnnouncements();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selectedCollectionId || !shopDisplayId) {
      setMessage("Select a shop collection.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await api.announcements.deleteByCollection(selectedCollectionId, { shop_display_id: shopDisplayId });
      setMessage("Banner removed.");
      await loadAnnouncements();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove banner");
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (item: AnnouncementBanner) => {
    if (!shopDisplayId) return;

    setSaving(true);
    setMessage("");
    try {
      if (item.banner_scope === "system") {
        const orderedIds = filteredAnnouncements.map((banner) => banner.id);
        await api.announcements.order({
          banner_ids: orderedIds,
          shop_display_id: shopDisplayId,
          visibility: { [item.id]: !item.is_visible_in_shop },
        });
      } else {
        await api.announcements.upsert({
          collection_id: item.collection_id,
          title: item.title,
          subtitle: item.subtitle || undefined,
          background_color: item.background_color,
          text_color: item.text_color,
          is_active: !item.is_active,
          shop_display_id: shopDisplayId,
        });
      }
      await loadAnnouncements();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update banner status");
    } finally {
      setSaving(false);
    }
  };

  const canReorder = !!shopDisplayId && filteredAnnouncements.length > 1;

  const onReorder = async (index: number, direction: -1 | 1) => {
    if (!shopDisplayId) return;

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= filteredAnnouncements.length) return;

    const updated = [...filteredAnnouncements];
    [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
    setAnnouncements((prev) => {
      const copy = [...prev];
      const a = updated[index];
      const b = updated[nextIndex];
      const idxA = copy.findIndex((item) => item.id === a.id);
      const idxB = copy.findIndex((item) => item.id === b.id);
      if (idxA !== -1 && idxB !== -1) {
        [copy[idxA], copy[idxB]] = [copy[idxB], copy[idxA]];
      }
      return copy;
    });

    setSaving(true);
    setMessage("");
    try {
      await api.announcements.order({
        banner_ids: updated.map((item) => item.id),
        shop_display_id: shopDisplayId,
      });
      setMessage("Banner order updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update banner order");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!auth || auth.role !== "shop_owner") {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Vendor Banner Manager</h1>
              <p className="mt-1 text-sm text-slate-600">Create and reorder banners for your shop collections.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {shop?.approved ? "Shop approved" : "Shop pending approval"}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold">Create or Update Banner</h2>

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700">Shop Collection</label>
                <select
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={selectedCollectionId || ""}
                  onChange={(e) => setSelectedCollectionId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select collection</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700">Banner Text</label>
                <input
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700">Subtext</label>
                <input
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Background</label>
                  <input type="color" className="mt-1 h-10 w-full rounded border border-slate-300" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Text Color</label>
                  <input type="color" className="mt-1 h-10 w-full rounded border border-slate-300" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </div>
              </div>

              <label className="mb-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>

              <div className="flex flex-wrap gap-2">
                <button disabled={saving} onClick={onSave} className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">Save Banner</button>
                <button disabled={saving} onClick={onDelete} className="rounded bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50">Delete Banner</button>
              </div>

              {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
            </div>

            <div className="rounded border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold">Visible Banners</h2>
              <div className="space-y-3">
                {filteredAnnouncements.length === 0 ? (
                  <p className="text-sm text-slate-500">No banners available for this shop.</p>
                ) : (
                  filteredAnnouncements.map((item, index) => {
                    const isSystem = item.banner_scope === "system";
                    const isVisibleInShop = item.is_visible_in_shop !== false;
                    return (
                      <div key={item.id} className="rounded border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.collection_name} • {item.banner_scope}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded bg-slate-200 px-2 py-1 text-xs"
                              onClick={() => onReorder(index, -1)}
                              disabled={!canReorder || index === 0 || saving}
                            >
                              ▲
                            </button>
                            <button
                              className="rounded bg-slate-200 px-2 py-1 text-xs"
                              onClick={() => onReorder(index, 1)}
                              disabled={!canReorder || index === filteredAnnouncements.length - 1 || saving}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{item.is_active ? "Active" : "Inactive"}</span>
                          {isSystem ? (
                            <span className="rounded-full border border-slate-300 px-2 py-1">
                              {isVisibleInShop ? "Visible in shop" : "Hidden in shop"}
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-300 px-2 py-1">Editable by you</span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded bg-slate-200 px-2 py-1 text-xs"
                            onClick={() => {
                              if (!isSystem) {
                                setSelectedCollectionId(item.collection_id);
                              }
                            }}
                            disabled={isSystem || saving}
                          >
                            {isSystem ? "Cannot edit" : "Edit"}
                          </button>
                          <button
                            className="rounded bg-slate-200 px-2 py-1 text-xs"
                            onClick={() => onToggleActive(item)}
                            disabled={saving}
                          >
                            {isSystem ? (isVisibleInShop ? "Hide from shop" : "Show in shop") : item.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
