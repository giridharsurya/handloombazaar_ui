"use client";

import React from "react";
import CollectionForm from "@/components/Collections/CollectionForm";
import CollectionActions from "@/components/Collections/CollectionActions";
import { default as api } from "@/lib/api";

type Props = Partial<{
  collections: any[];
  editingCollectionId: number | null;
  scope?: 'system' | 'vendor';
  shopDisplayId?: string | null;
  onEdit: (col: any) => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onToggleActive: (id: number, current: boolean) => void;
  onDeleted: (id: number) => void;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}>;

export default function CollectionsList(props: Props) {
  const { collections: initialCollections, editingCollectionId, onEdit, onCancelEdit, onSaved, onDeleted, selectedIds, onSelectionChange } = props;
  const { scope, shopDisplayId } = props;
  const [showConstraintsFor, setShowConstraintsFor] = React.useState<number | null>(null);
  const [localCollections, setLocalCollections] = React.useState<any[]>(initialCollections || []);
  const [loading, setLoading] = React.useState(false);

  const [localSelectedIds, setLocalSelectedIds] = React.useState<number[]>(selectedIds || []);

  React.useEffect(() => {
    if (initialCollections) {
      setLocalCollections(initialCollections);
    } else {
      // fetch admin collections when not provided
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const kind = scope === 'vendor' ? 'shop' : 'system';
          const data = await api.collections.list({ kind, shop_display_id: scope === 'vendor' ? shopDisplayId || undefined : undefined });
          if (cancelled) return;
          setLocalCollections(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error(e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [initialCollections]);

  const currentSelected = new Set<number>(selectedIds ?? localSelectedIds ?? []);

  const toggle = (id: number) => {
    const next = new Set(currentSelected);
    if (next.has(id)) next.delete(id); else next.add(id);
    const arr = [...next];
    if (onSelectionChange) onSelectionChange(arr); else setLocalSelectedIds(arr);
  };

  const toggleAll = () => {
    if (!localCollections || localCollections.length === 0) return;
    const allIds = localCollections.map((c) => c.id);
    const allSelected = allIds.every((id) => currentSelected.has(id));
    if (onSelectionChange) onSelectionChange(allSelected ? [] : allIds); else setLocalSelectedIds(allSelected ? [] : allIds);
  };

  const visibleCollections = initialCollections || localCollections;

  return (
    <div>
      {loading ? (
        <p className="text-sm text-slate-600">Loading collections...</p>
      ) : visibleCollections.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 font-medium w-12">
                  <input type="checkbox" onChange={toggleAll} checked={visibleCollections.length > 0 && visibleCollections.every((c) => currentSelected.has(c.id))} />
                </th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCollections.map((col) => (
                editingCollectionId === col.id ? (
                  <tr key={col.id} className="border-b border-slate-100 bg-slate-50">
                    <td className="px-3 py-3" colSpan={4}>
                      <CollectionForm
                        mode="edit"
                        initial={col}
                            showConstraints={false}
                            vendorOnly={scope === 'vendor'}
                            shopDisplayId={scope === 'vendor' ? shopDisplayId : undefined}
                        onSaved={async () => {
                          if (onSaved) onSaved();
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={col.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={currentSelected.has(col.id)} onChange={() => toggle(col.id)} />
                    </td>
                    <td className="px-3 py-3">{col.name}</td>
                    <td className="px-3 py-3 text-slate-600">{col.description || "-"}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          col.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {col.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 space-x-2">
                      <button
                        type="button"
                        onClick={() => (onEdit ? onEdit(col) : null)}
                        className="rounded-md bg-slate-600 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-500"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          // show per-item loading state until backend responds; do not optimistic-update
                          setLocalCollections((prev) => prev.map((c) => (c.id === col.id ? { ...c, updating: true } : c)));
                          try {
                            // Call the unified collections API to toggle active status
                            console.debug("CollectionsList: calling api.collections.updateCollection", col.id, !col.is_active);
                            const res: any = await api.collections.updateCollection(col.id, { is_active: !col.is_active });
                            const serverActive = res?.collection?.is_active;
                            const newActive = typeof serverActive === "boolean" ? serverActive : !col.is_active;
                            if (initialCollections) {
                              // parent manages collections; ask parent to refresh
                              if (onSaved) await onSaved();
                            } else {
                              setLocalCollections((prev) => prev.map((c) => (c.id === col.id ? { ...c, is_active: newActive } : c)));
                            }
                            console.debug("CollectionsList: api.collections.updateCollection resolved", col.id, newActive);
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setLocalCollections((prev) => prev.map((c) => (c.id === col.id ? { ...c, updating: false } : c)));
                          }
                        }}
                        className="rounded-md bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                        disabled={!!col.updating}
                      >
                        {col.updating ? "Updating..." : "Toggle Active"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowConstraintsFor(showConstraintsFor === col.id ? null : col.id)}
                        className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold"
                      >
                        Constraints
                      </button>

                      <CollectionActions collectionId={col.id} onDeleted={async () => { if (onDeleted) onDeleted(col.id); else { try { await api.collections.deleteCollection(col.id); setLocalCollections((prev) => prev.filter(c => c.id !== col.id)); } catch (e) { console.error(e); } } }} />
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-600">No collections found.</p>
      )}

      {showConstraintsFor ? (
        <div className="mt-4 rounded border border-slate-200 bg-white p-4">
          <h4 className="font-semibold">Edit Constraints</h4>
          <CollectionConstraintsPanel collectionId={showConstraintsFor} shopDisplayId={scope === 'vendor' ? shopDisplayId : undefined} showAllowedShops={scope !== 'vendor'} onSaved={async () => { setShowConstraintsFor(null); if (onSaved) onSaved(); }} />
        </div>
      ) : null}
    </div>
  );
}

function CollectionConstraintsPanel({ collectionId, shopDisplayId, showAllowedShops = true, onSaved }: { collectionId: number; shopDisplayId?: string | null; showAllowedShops?: boolean; onSaved?: () => void }) {
  const [value, setValue] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.collections.getConstraints(collectionId);
        if (cancelled) return;
        setValue(data || {});
      } catch (e) {
        setValue({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [collectionId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.collections.updateConstraints(collectionId, value || {});
      onSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {/* reuse AttributeConstraintEditor for editing */}
      <div className="mb-3">
        {/* Lazy-load the editor to avoid circular imports; import at top would also work but kept simple */}
        <AttributeConstraintEditorWrapper value={value} onChange={setValue} showAllowedShops={showAllowedShops} shopDisplayId={shopDisplayId} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Save</button>
        <button onClick={() => onSaved?.()} className="rounded-md bg-slate-200 px-3 py-1.5 text-xs">Close</button>
      </div>
    </div>
  );
}

function AttributeConstraintEditorWrapper({ value, onChange, showAllowedShops, shopDisplayId }: { value: any; onChange: (v: any) => void; showAllowedShops?: boolean; shopDisplayId?: string | null }) {
  const Editor = require("./AttributeConstraintEditor").default;
  // If parent fixed a shopDisplayId for vendor-scoped constraints, ensure it's present in value
  const initialValue = React.useMemo(() => {
    const v = value || {};
    if (shopDisplayId && (!v.allowed_shop_display_ids || v.allowed_shop_display_ids.length === 0)) {
      return { ...v, allowed_shop_display_ids: [shopDisplayId] };
    }
    return v;
  }, [value, shopDisplayId]);
  return <Editor value={initialValue} onChange={onChange} showAllowedShops={showAllowedShops} />;
}
