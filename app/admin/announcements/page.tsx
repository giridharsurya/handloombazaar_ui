"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import type { AnnouncementBanner, Collection } from "@/types/apiTypes";

type ShopOption = {
  id: number;
  name: string;
  display_id?: string;
};

export default function AdminAnnouncementsPage() {
  const { auth, isLoading } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [scope, setScope] = useState<"system" | "shop">("system");
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [selectedShopDisplayId, setSelectedShopDisplayId] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F43F5E");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [isActive, setIsActive] = useState(true);

  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

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
    if (!auth || auth.role !== "admin") return;
    let mounted = true;

    (async () => {
      try {
        const rows = await api.admin.getShops();
        if (!mounted) return;
        setShops(rows || []);
      } catch {
        if (!mounted) return;
        setShops([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [api, auth]);

  useEffect(() => {
    if (!auth || auth.role !== "admin") return;
    let mounted = true;

    (async () => {
      try {
        const rows = await api.collections.list({
          kind: scope === "system" ? "system" : "shop",
          shop_display_id: scope === "shop" ? selectedShopDisplayId || undefined : undefined,
          authenticated: true,
        });
        if (!mounted) return;
        setCollections((rows || []) as Collection[]);
      } catch {
        if (!mounted) return;
        setCollections([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [api, auth, scope, selectedShopDisplayId]);

  const loadAnnouncements = async () => {
    try {
      const rows = await api.announcements.list({ include_inactive: true });
      setAnnouncements(rows || []);
    } catch {
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    if (!auth || auth.role !== "admin") return;
    loadAnnouncements();
  }, [auth]);

  const filteredAnnouncements = useMemo(() => {
    if (scope === "system") {
      return announcements.filter((a) => a.banner_scope === "system");
    }

    if (!selectedShopDisplayId) {
      return announcements.filter((a) => a.banner_scope === "shop");
    }

    const selectedShop = shops.find((s) => s.display_id === selectedShopDisplayId);
    if (!selectedShop) return [];

    return announcements.filter((a) => a.banner_scope === "shop" && a.shop_id === selectedShop.id);
  }, [announcements, scope, selectedShopDisplayId, shops]);

  const selectedCollectionName = useMemo(() => {
    if (!selectedCollectionId) return "";
    return collections.find((c) => c.id === selectedCollectionId)?.name || "";
  }, [selectedCollectionId, collections]);

  const loadSelectedBanner = async (collectionId: number | null) => {
    if (!collectionId) {
      setTitle("");
      setSubtitle("");
      setBackgroundColor("#F43F5E");
      setTextColor("#FFFFFF");
      setIsActive(true);
      return;
    }

    try {
      const item = await api.announcements.getByCollection(collectionId, {
        shop_display_id: scope === "shop" ? selectedShopDisplayId || undefined : undefined,
      });

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
    } catch {
      setTitle(selectedCollectionName || "");
      setSubtitle("");
      setBackgroundColor("#F43F5E");
      setTextColor("#FFFFFF");
      setIsActive(true);
    }
  };

  useEffect(() => {
    loadSelectedBanner(selectedCollectionId);
  }, [selectedCollectionId, scope, selectedShopDisplayId, selectedCollectionName]);

  const onSave = async () => {
    if (!selectedCollectionId) {
      setMessage("Select a collection.");
      return;
    }
    if (!title.trim()) {
      setMessage("Banner title is required.");
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
        shop_display_id: scope === "shop" ? selectedShopDisplayId || undefined : undefined,
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
    if (!selectedCollectionId) {
      setMessage("Select a collection.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await api.announcements.deleteByCollection(selectedCollectionId, {
        shop_display_id: scope === "shop" ? selectedShopDisplayId || undefined : undefined,
      });
      setMessage("Banner removed.");
      await loadAnnouncements();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove banner");
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (item: AnnouncementBanner) => {
    setSaving(true);
    setMessage("");
    try {
      const shopDisplayId = item.banner_scope === "shop" && item.shop_id
        ? shops.find((s) => s.id === item.shop_id)?.display_id
        : undefined;

      if (item.banner_scope === "shop" && !shopDisplayId) {
        throw new Error("Unable to resolve target shop for this banner");
      }

      await api.announcements.upsert({
        collection_id: item.collection_id,
        title: item.title,
        subtitle: item.subtitle || undefined,
        background_color: item.background_color,
        text_color: item.text_color,
        is_active: !item.is_active,
        shop_display_id: shopDisplayId,
      });
      await loadAnnouncements();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update banner status");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;
  if (!auth || auth.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Announcement Banners</h1>
          <p className="mt-1 text-sm text-slate-600">Create/edit/delete system and shop banners linked to collections.</p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="rounded border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold">Create or Update Banner</h2>

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700">Scope</label>
                <select
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as "system" | "shop");
                    setSelectedCollectionId(null);
                  }}
                >
                  <option value="system">System</option>
                  <option value="shop">Shop</option>
                </select>
              </div>

              {scope === "shop" ? (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700">Shop</label>
                  <select
                    className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={selectedShopDisplayId}
                    onChange={(e) => {
                      setSelectedShopDisplayId(e.target.value);
                      setSelectedCollectionId(null);
                    }}
                  >
                    <option value="">Select shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.display_id}>{s.name} ({s.display_id})</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700">Collection</label>
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

              <div className="flex gap-2">
                <button disabled={saving} onClick={onSave} className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">Save Banner</button>
                <button disabled={saving} onClick={onDelete} className="rounded bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50">Delete Banner</button>
              </div>

              {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
            </div>

            <div className="rounded border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold">Existing Banners</h2>
              <div className="space-y-3">
                {filteredAnnouncements.map((item) => (
                  <div key={item.id} className="rounded border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.collection_name} • {item.banner_scope}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded bg-slate-200 px-2 py-1 text-xs"
                          onClick={() => onToggleActive(item)}
                          disabled={saving}
                        >
                          {item.is_active ? "Set Inactive" : "Set Active"}
                        </button>
                        <button
                          className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700"
                          onClick={async () => {
                            setSaving(true);
                            try {
                              const shopDisplayId = item.banner_scope === "shop" && item.shop_id
                                ? shops.find((s) => s.id === item.shop_id)?.display_id
                                : undefined;

                              if (item.banner_scope === "shop" && !shopDisplayId) {
                                throw new Error("Unable to resolve target shop for this banner");
                              }

                              await api.announcements.deleteByCollection(item.collection_id, {
                                shop_display_id: shopDisplayId,
                              });
                              await loadAnnouncements();
                            } catch (error) {
                              setMessage(error instanceof Error ? error.message : "Failed to delete banner");
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAnnouncements.length === 0 ? (
                  <p className="text-sm text-slate-500">No banners for selected scope.</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
