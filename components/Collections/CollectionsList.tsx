"use client";

import React from "react";
import type { Collection } from "@/types/apiTypes";
import CollectionForm from "@/components/Collections/CollectionForm";
import CollectionActions from "@/components/Collections/CollectionActions";
import { default as api } from "@/lib/api";

type CollectionRow = Collection & {
  source?: "shop" | "system";
  updating?: boolean;
};

type OverviewSlot = {
  id: number;
  shop_id?: number | null;
  shop_display_id?: string | null;
  collection_id: number;
  slot_position: number;
  collection: {
    id: number;
    display_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
};

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
  overviewSlots: OverviewSlot[];
  allowedOverviewSlotPositions: number[];
  onAssignOverviewSlot: (collectionId: number, slotPosition: number) => Promise<void>;
  onRemoveOverviewSlot: (collectionId: number) => Promise<void>;
  showHomepageControls: boolean;
  onToggleHomepageDisplay: (collectionId: number, displayOnHomepage: boolean) => Promise<void>;
  onOrderHomepageCollections: (collectionIds: number[]) => Promise<void>;
}>;

export default function CollectionsList(props: Props) {
  const { collections: initialCollections, editingCollectionId, onEdit, onCancelEdit, onSaved, onDeleted, selectedIds, onSelectionChange } = props;
  const { scope, shopDisplayId } = props;
  const [showConstraintsFor, setShowConstraintsFor] = React.useState<number | null>(null);
  const [localCollections, setLocalCollections] = React.useState<CollectionRow[]>(initialCollections ? [...initialCollections] : []);
  const [loading, setLoading] = React.useState(false);
  const [overviewUpdatingIds, setOverviewUpdatingIds] = React.useState<number[]>([]);

  const [localSelectedIds, setLocalSelectedIds] = React.useState<number[]>(selectedIds || []);
  const [homepageUpdatingIds, setHomepageUpdatingIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (initialCollections !== undefined) {
      setLocalCollections(Array.isArray(initialCollections) ? [...initialCollections] : []);
      setLoading(false);
      return;
    }

    // fetch collections for vendor/shop scope or admin/system defaults
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let data: CollectionRow[] = [];

        if (scope === 'vendor' && shopDisplayId) {
          const [shopRows, systemRows] = await Promise.all([
            api.collections.list({ kind: 'shop', shop_display_id: shopDisplayId, authenticated: true }),
            api.collections.list({ kind: 'system', shop_display_id: shopDisplayId, authenticated: true }),
          ]);

          const normalizedShopRows = Array.isArray(shopRows)
            ? shopRows.map((item) => ({ ...item, source: 'shop' as const }))
            : [];
          const normalizedSystemRows = Array.isArray(systemRows)
            ? systemRows.map((item) => ({ ...item, source: 'system' as const }))
            : [];

          data = [...normalizedShopRows, ...normalizedSystemRows];
          data.sort((a, b) => {
            const aOrder = Number(a.homepage_order || 0);
            const bOrder = Number(b.homepage_order || 0);
            if (bOrder !== aOrder) return bOrder - aOrder;
            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bDate - aDate || b.id - a.id;
          });
        } else {
          const kind = scope === 'vendor' ? 'shop' : 'system';
          const rows = await api.collections.list({ kind, shop_display_id: scope === 'vendor' ? shopDisplayId || undefined : undefined });
          data = Array.isArray(rows) ? rows.map((item) => ({ ...item })) : [];
        }

        if (cancelled) return;
        setLocalCollections(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialCollections, scope, shopDisplayId]);

  const visibleCollections = localCollections;
  const currentSelected = new Set<number>(selectedIds ?? localSelectedIds ?? []);

  const homepageCollections = React.useMemo(() => {
    return [...(visibleCollections || [])]
      .map((col) => ({ ...col, source: col.source ?? (scope === 'vendor' ? 'shop' : undefined) }))
      .filter((col) => col.display_on_homepage)
      .sort((a, b) => {
        const aOrder = Number(a.homepage_order || 0);
        const bOrder = Number(b.homepage_order || 0);
        if (bOrder !== aOrder) return bOrder - aOrder;
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate || b.id - a.id;
      });
  }, [visibleCollections, scope]);

  const displayCollections = React.useMemo(() => {
    if (!props.showHomepageControls) {
      return visibleCollections;
    }

    const homepage = homepageCollections;
    const nonHomepage = (visibleCollections || []).filter((col) => !col.display_on_homepage);
    return [...homepage, ...nonHomepage];
  }, [homepageCollections, visibleCollections, props.showHomepageControls]);

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
                {props.showHomepageControls ? <th className="px-3 py-2 font-medium">Homepage</th> : null}
                {props.overviewSlots ? <th className="px-3 py-2 font-medium">Overview Slot</th> : null}
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayCollections.map((col) => {
                const currentSlot = props.overviewSlots?.find((slot) => slot.collection_id === col.id);
                if (editingCollectionId === col.id) {
                  return (
                    <tr key={col.id} className="border-b border-slate-100 bg-slate-50">
                      <td className="px-3 py-3" colSpan={(props.overviewSlots ? 1 : 0) + (props.showHomepageControls ? 1 : 0) + 5}>
                        <CollectionForm
                          mode="edit"
                          initial={col}
                          showConstraints={false}
                          vendorOnly={scope === 'vendor'}
                          shopDisplayId={scope === 'vendor' ? (shopDisplayId ?? undefined) : undefined}
                          onSaved={async () => {
                            if (onSaved) onSaved();
                          }}
                        />
                      </td>
                    </tr>
                  );
                }

                return (
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
                    {props.showHomepageControls ? (
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!props.onToggleHomepageDisplay) return;
                              setHomepageUpdatingIds((prev) => [...prev, col.id]);
                              try {
                                const newDisplayState = !col.display_on_homepage;
                                const nextOrder = newDisplayState
                                  ? Math.max(0, ...visibleCollections.map((item) => Number(item.homepage_order || 0))) + 1
                                  : 0;
                                await props.onToggleHomepageDisplay(col.id, newDisplayState);
                                setLocalCollections((prev) =>
                                  prev.map((item) =>
                                    item.id === col.id
                                      ? { ...item, display_on_homepage: newDisplayState, homepage_order: nextOrder }
                                      : item
                                  )
                                );
                              } finally {
                                setHomepageUpdatingIds((prev) => prev.filter((id) => id !== col.id));
                              }
                            }}
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${col.display_on_homepage ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-200 text-slate-800 hover:bg-slate-300"}`}
                            disabled={homepageUpdatingIds.includes(col.id)}
                          >
                            {homepageUpdatingIds.includes(col.id) ? "Saving..." : col.display_on_homepage ? "Remove from homepage" : "Display on homepage"}
                          </button>
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!props.onOrderHomepageCollections) return;
                                const source = col.source ?? (scope === 'vendor' ? 'shop' : undefined);
                                if (source === 'system') return;
                                const index = homepageCollections.findIndex((item) => item.id === col.id);
                                if (index <= 0) return;
                                const ordered = [...homepageCollections];
                                [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
                                setHomepageUpdatingIds((prev) => [...prev, col.id]);
                                try {
                                  await props.onOrderHomepageCollections(ordered.map((item) => item.id));
                                  setLocalCollections((prev) => {
                                    const orderedIds = ordered.map((item) => item.id);
                                    return prev.map((item) => {
                                      if (!orderedIds.includes(item.id)) return item;
                                      return {
                                        ...item,
                                        homepage_order: orderedIds.length - orderedIds.indexOf(item.id),
                                      };
                                    });
                                  });
                                } finally {
                                  setHomepageUpdatingIds((prev) => prev.filter((id) => id !== col.id));
                                }
                              }}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              disabled={!col.display_on_homepage || homepageCollections.findIndex((item) => item.id === col.id) <= 0 || homepageUpdatingIds.includes(col.id)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!props.onOrderHomepageCollections) return;
                                const source = col.source ?? (scope === 'vendor' ? 'shop' : undefined);
                                if (source === 'system') return;
                                const index = homepageCollections.findIndex((item) => item.id === col.id);
                                if (index === -1 || index >= homepageCollections.length - 1) return;
                                const ordered = [...homepageCollections];
                                [ordered[index + 1], ordered[index]] = [ordered[index], ordered[index + 1]];
                                setHomepageUpdatingIds((prev) => [...prev, col.id]);
                                try {
                                  await props.onOrderHomepageCollections(ordered.map((item) => item.id));
                                  setLocalCollections((prev) => {
                                    const orderedIds = ordered.map((item) => item.id);
                                    return prev.map((item) => {
                                      if (!orderedIds.includes(item.id)) return item;
                                      return {
                                        ...item,
                                        homepage_order: orderedIds.length - orderedIds.indexOf(item.id),
                                      };
                                    });
                                  });
                                } finally {
                                  setHomepageUpdatingIds((prev) => prev.filter((id) => id !== col.id));
                                }
                              }}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              disabled={!col.display_on_homepage || homepageCollections.findIndex((item) => item.id === col.id) === -1 || homepageCollections.findIndex((item) => item.id === col.id) >= homepageCollections.length - 1 || homepageUpdatingIds.includes(col.id)}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : null}
                    {props.overviewSlots ? (
                      <td className="px-3 py-3 text-slate-700">{currentSlot ? `Slot ${currentSlot.slot_position + 1}` : "-"}</td>
                    ) : null}
                    <td className="px-3 py-3 space-x-2">
                      <button
                        type="button"
                        onClick={() => (onEdit ? onEdit(col) : null)}
                        className="rounded-md bg-slate-600 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-500"
                      >
                        Edit
                      </button>

                      {props.overviewSlots && props.allowedOverviewSlotPositions ? (
                        <div className="inline-flex flex-wrap gap-2">
                          {props.overviewSlots.some((slot) => slot.collection_id === col.id) ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!props.onRemoveOverviewSlot) return;
                                setOverviewUpdatingIds((prev) => [...prev, col.id]);
                                try {
                                  await props.onRemoveOverviewSlot(col.id);
                                } finally {
                                  setOverviewUpdatingIds((prev) => prev.filter((id) => id !== col.id));
                                }
                              }}
                              className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold"
                              disabled={overviewUpdatingIds.includes(col.id)}
                            >
                              {overviewUpdatingIds.includes(col.id) ? "Removing..." : "Remove Overview"}
                            </button>
                          ) : (
                            <div className="inline-flex gap-1">
                              {props.allowedOverviewSlotPositions.map((slotPosition) => (
                                <button
                                  key={slotPosition}
                                  type="button"
                                  onClick={async () => {
                                    if (!props.onAssignOverviewSlot) return;
                                    setOverviewUpdatingIds((prev) => [...prev, col.id]);
                                    try {
                                      await props.onAssignOverviewSlot(col.id, slotPosition);
                                    } finally {
                                      setOverviewUpdatingIds((prev) => prev.filter((id) => id !== col.id));
                                    }
                                  }}
                                  className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                                  disabled={overviewUpdatingIds.includes(col.id)}
                                >
                                  {overviewUpdatingIds.includes(col.id) ? "Assigning..." : `Slot ${slotPosition + 1}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={async () => {
                          setLocalCollections((prev) => prev.map((c) => (c.id === col.id ? { ...c, updating: true } : c)));
                          try {
                            const res: any = await api.collections.updateCollection(col.id, { is_active: !col.is_active });
                            const serverActive = res?.collection?.is_active;
                            const newActive = typeof serverActive === "boolean" ? serverActive : !col.is_active;
                            if (initialCollections) {
                              if (onSaved) await onSaved();
                            } else {
                              setLocalCollections((prev) => prev.map((c) => (c.id === col.id ? { ...c, is_active: newActive } : c)));
                            }
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
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-600">No collections found.</p>
      )}

      {showConstraintsFor ? (
        <div className="mt-4 rounded border border-slate-200 bg-white p-4">
          <h4 className="font-semibold">Edit Constraints</h4>
          <CollectionConstraintsPanel collectionId={showConstraintsFor} shopDisplayId={scope === 'vendor' ? (shopDisplayId ?? undefined) : undefined} showAllowedShops={scope !== 'vendor'} onSaved={async () => { setShowConstraintsFor(null); if (onSaved) onSaved(); }} />
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
