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

export default function CollectionForm({ mode = "create", initial, vendorOnly = false, shopDisplayId, onSaved }: Props) {
  const [name, setName] = React.useState(initial?.name || "");
  const [description, setDescription] = React.useState(initial?.description || "");
  const [scope, setScope] = React.useState<"system" | "vendor">(initial?.shop_display_id ? "vendor" : "system");
  const [shopId, setShopId] = React.useState<string | undefined>(initial?.shop_display_id || shopDisplayId);
  const [constraints, setConstraints] = React.useState<any>(initial?.constraints || {});
  const [loading, setLoading] = React.useState(false);
  const [shops, setShops] = React.useState<any[]>([]);
  const [isLoadingShops, setIsLoadingShops] = React.useState(false);

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
      if (scope === "vendor") payload.shop_display_id = shopId || shopDisplayId;

      // create or update metadata
      let res: any;
      if (mode === "create") {
        res = await api.collections.createCollection(payload);
      } else if (mode === "edit" && initial?.id) {
        // update via admin endpoint for collection metadata
        res = await api.admin.updateCollection(initial.id, payload);
      }

      // update constraints if present
      if (res && constraints) {
        const collectionId = res.id || initial?.id;
        if (collectionId) {
          await api.collections.updateConstraints(collectionId, constraints);
        }
      }

      onSaved?.(res || initial);
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
          <select
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="system">System collection</option>
            <option value="vendor">Vendor collection</option>
          </select>
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
              <select
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={shopId || ""}
                onChange={(e) => setShopId(e.target.value)}
              >
                <option value="">-- select shop --</option>
                {isLoadingShops ? <option>Loading...</option> : shops.map((s) => (
                  <option key={s.display_id || s.id} value={s.display_id || s.displayId}>{s.name} ({s.display_id || s.displayId})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Constraints</label>
        <div className="mt-2">
          <AttributeConstraintEditor value={constraints} onChange={setConstraints} showAllowedShops={scope === "system"} />
        </div>
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
