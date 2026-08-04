"use client";

import React from "react";
import api from "@/lib/api";
import AttributeConstraintEditor from "./AttributeConstraintEditor";

type Props = {
  mode?: "create" | "edit";
  initial?: any;
  vendorOnly?: boolean; // if true, only vendor collection options shown
  shopDisplayId?: string; // optional default shop id for vendor creation
  onSaved?: (c: any) => void;
};

type PropsExt = Props & { showConstraints?: boolean };

export default function CollectionForm({ mode = "create", initial, vendorOnly = false, shopDisplayId, onSaved, showConstraints = true }: PropsExt) {
  const [name, setName] = React.useState(initial?.name || "");
  const [description, setDescription] = React.useState(initial?.description || "");
  const [scope, setScope] = React.useState<"system" | "vendor">(initial?.shop_display_id ? "vendor" : "system");
  const [shopId, setShopId] = React.useState<string | undefined>(initial?.shop_display_id || shopDisplayId);
  const [constraints, setConstraints] = React.useState<any>(initial?.constraints || {});
  const [loading, setLoading] = React.useState(false);
  const [shops, setShops] = React.useState<any[]>([]);
  const [isLoadingShops, setIsLoadingShops] = React.useState(false);
  const [isAnnouncement, setIsAnnouncement] = React.useState(false);
  const [bannerTitle, setBannerTitle] = React.useState(initial?.name || "");
  const [bannerSubtitle, setBannerSubtitle] = React.useState("");
  const [bannerBgColor, setBannerBgColor] = React.useState("#F43F5E");
  const [bannerTextColor, setBannerTextColor] = React.useState("#FFFFFF");

  React.useEffect(() => {
    if (!(mode === "edit" && initial?.id)) return;
    let mounted = true;

    (async () => {
      try {
        const banner = await api.announcements.getByCollection(initial.id, {
          shop_display_id: scope === "vendor" ? (shopId || shopDisplayId) : undefined,
        });

        if (!mounted || !banner) return;
        setIsAnnouncement(true);
        setBannerTitle(banner.title || initial?.name || "");
        setBannerSubtitle(banner.subtitle || "");
        setBannerBgColor(banner.background_color || "#F43F5E");
        setBannerTextColor(banner.text_color || "#FFFFFF");
      } catch {
        // Ignore missing banner; this simply means the collection is not an announcement.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mode, initial?.id, scope, shopId, shopDisplayId]);

  React.useEffect(() => {
    if (vendorOnly) setScope("vendor");
  }, [vendorOnly]);

  React.useEffect(() => {
    // If this form is vendor-only, ensure shopId defaults to provided shopDisplayId
    if (vendorOnly && shopDisplayId) setShopId(shopDisplayId);
  }, [vendorOnly, shopDisplayId]);

  React.useEffect(() => {
    // load shops list only for admin when they want to create vendor-scoped collections
    if (vendorOnly) return;
    if (scope !== "vendor") return;
    (async () => {
      setIsLoadingShops(true);
      try {
        const s = await api.admin.getShops();
        setShops(Array.isArray(s) ? s : []);
      } catch (e) {
        setShops([]);
      } finally {
        setIsLoadingShops(false);
      }
    })();
  }, [scope, vendorOnly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { name, description };
      // map UI scope to backend kind ('system' or 'shop')
      payload.kind = scope === "system" ? "system" : "shop";
      if (scope === "vendor") payload.shop_display_id = shopId || shopDisplayId;

      // include allowed shop display ids from constraints when present
      if (constraints && Array.isArray(constraints.allowed_shop_display_ids) && constraints.allowed_shop_display_ids.length > 0) {
        payload.allowed_shop_display_ids = constraints.allowed_shop_display_ids;
      }

      // create or update metadata
      let res: any;
      if (mode === "create") {
        res = await api.collections.createCollection(payload);
      } else if (mode === "edit" && initial?.id) {
        // update via unified collections API - backend RBAC will enforce permissions
        res = await api.collections.updateCollection(initial.id, payload);
      }

      // normalize created/updated collection object
      const created = (res && (res.collection || res)) || null;
      const targetCollectionId = created?.id || initial?.id;

      // update constraints if present
      if (created && constraints) {
        const collectionId = created.id || initial?.id;
        if (collectionId) {
          await api.collections.updateConstraints(collectionId, constraints);
        }
      }

      // upsert/remove announcement banner linked to the collection
      if (targetCollectionId) {
        if (isAnnouncement) {
          await api.announcements.upsert({
            collection_id: targetCollectionId,
            title: (bannerTitle || name).trim() || name.trim(),
            subtitle: bannerSubtitle.trim() || undefined,
            background_color: bannerBgColor,
            text_color: bannerTextColor,
            is_active: true,
            shop_display_id: scope === "vendor" ? (shopId || shopDisplayId || undefined) : undefined,
          });
        } else {
          await api.announcements.deleteByCollection(targetCollectionId, {
            shop_display_id: scope === "vendor" ? (shopId || shopDisplayId || undefined) : undefined,
          });
        }
      }

      onSaved?.(created || initial || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Collection name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Short description (optional)"
        />
      </div>

      {!vendorOnly && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Scope</label>
          {mode === "edit" ? (
            <div className="mt-1 text-sm text-slate-900">{scope === "system" ? "System collection" : "Vendor collection"}</div>
          ) : (
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
            >
              <option value="system">System collection</option>
              <option value="vendor">Vendor collection</option>
            </select>
          )}
        </div>
      )}

      {scope === "vendor" && (
        <div>
          {vendorOnly ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">Shop</label>
              <div className="mt-1 text-sm text-slate-900">{shopDisplayId}</div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700">Select shop</label>
              {mode === "edit" ? (
                <div className="mt-1 text-sm text-slate-900">{shopId || shopDisplayId || "-"}</div>
              ) : (
                <select
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={shopId || ""}
                  onChange={(e) => setShopId(e.target.value)}
                >
                  <option value="">-- select shop --</option>
                  {isLoadingShops ? <option>Loading...</option> : shops.map((s) => (
                    <option key={s.display_id || s.id} value={s.display_id}>{s.name} ({s.display_id})</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}

      {showConstraints && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Constraints</label>
          <div className="mt-2">
            <AttributeConstraintEditor value={constraints} onChange={setConstraints} showAllowedShops={scope === "system"} />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isAnnouncement}
            onChange={(e) => setIsAnnouncement(e.target.checked)}
          />
          Show this collection as an announcement banner
        </label>

        {isAnnouncement ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Banner Text</label>
              <input
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="Flat 10% off on Cotton Sarees"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Subtext (optional)</label>
              <input
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="Limited period offer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Background Color</label>
              <input
                type="color"
                className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-1"
                value={bannerBgColor}
                onChange={(e) => setBannerBgColor(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Text Color</label>
              <input
                type="color"
                className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-1"
                value={bannerTextColor}
                onChange={(e) => setBannerTextColor(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          {mode === "create" ? "Create Collection" : "Save"}
        </button>
        <button type="button" onClick={() => onSaved?.(null)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
