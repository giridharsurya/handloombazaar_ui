"use client";

import React from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import CollectionForm from "./CollectionForm";
import CollectionActions from "./CollectionActions";

export default function VendorCollectionsList() {
  const { auth } = useAuth();
  const shopId = auth?.shop_display_id;
  const [collections, setCollections] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [showMembersFor, setShowMembersFor] = React.useState<number | null>(null);
  const [shopProducts, setShopProducts] = React.useState<any[]>([]);
  const [memberIds, setMemberIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadCollections();
    loadShopProducts();
  }, [shopId]);

  async function loadCollections() {
    if (!shopId) return;
    setLoading(true);
    try {
      const data = await api.admin.getCollections();
      const mine = (data || []).filter((c: any) => c.shop_display_id === shopId);
      setCollections(mine || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadShopProducts() {
    if (!shopId) return;
    try {
      const p = await api.products.getProducts({ shop_display_id: shopId, authenticated: true });
      setShopProducts(p || []);
    } catch (e) {
      setShopProducts([]);
    }
  }

  async function openMembers(collectionId: number) {
    setShowMembersFor(collectionId);
    try {
      const resp = await api.collections.getProducts(collectionId);
      const existing = ((resp.items || resp || []) as any[]).map((it: any) => String(it.display_id)) as string[];
      setMemberIds(existing);
    } catch (e) {
      setMemberIds([]);
    }
  }

  async function saveMembers(collectionId: number) {
    // compute additions/removals relative to server list
    try {
      const resp = await api.collections.getProducts(collectionId);
      const existing = ((resp.items || resp || []) as any[]).map((it: any) => String(it.display_id)) as string[];
      const toAdd = memberIds.filter((id) => !existing.includes(id));
      const toRemove = existing.filter((id) => !memberIds.includes(id));
      if (toAdd.length) await api.collections.addProducts(collectionId, toAdd);
      if (toRemove.length) await api.collections.removeProducts(collectionId, toRemove);
      setShowMembersFor(null);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Your Collections</h3>
      {loading ? <p>Loading...</p> : null}
      {collections.length === 0 ? <p className="text-sm text-slate-600">No vendor collections found.</p> : (
        <div className="mt-3 space-y-3">
          {collections.map((col) => (
            <div key={col.id} className="rounded border p-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{col.name}</div>
                  <div className="text-sm text-slate-600">{col.description || ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 bg-slate-700 text-white rounded text-xs" onClick={() => setEditing(col)}>Edit</button>
                  <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={() => openMembers(col.id)}>Members</button>
                  <CollectionActions collectionId={col.id} onDeleted={async () => { await loadCollections(); }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mt-4 rounded border bg-slate-50 p-4">
          <h4 className="font-semibold">Edit Collection</h4>
          <CollectionForm mode="edit" initial={editing} onSaved={async (res) => { setEditing(null); await loadCollections(); }} />
          <div className="mt-2">
            <button className="px-2 py-1" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {showMembersFor ? (
        <div className="mt-4 rounded border bg-slate-50 p-4">
          <h4 className="font-semibold">Manage Members</h4>
          <p className="text-sm text-slate-600">Toggle products to include in collection.</p>
          <div className="mt-3 grid gap-2" style={{ maxHeight: 300, overflow: 'auto' }}>
            {shopProducts.map((p) => (
              <label key={p.display_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={memberIds.includes(String(p.display_id))} onChange={(e) => {
                  const id = String(p.display_id);
                  setMemberIds((prev) => e.target.checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id));
                }} />
                <div className="text-sm">{p.name}</div>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={() => saveMembers(showMembersFor)}>Save Members</button>
            <button className="px-3 py-1 bg-slate-400 text-white rounded" onClick={() => setShowMembersFor(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
