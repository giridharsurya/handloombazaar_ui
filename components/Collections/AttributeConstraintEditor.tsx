"use client";

import React from "react";
import api from "@/lib/api";

type Props = {
  value?: any;
  onChange?: (v: any) => void;
  showAllowedShops?: boolean; // when true, allow selecting allowed shop ids (system collections)
};

export default function AttributeConstraintEditor({ value, onChange, showAllowedShops = true }: Props) {
  const [allowedShops, setAllowedShops] = React.useState<string[]>((value?.allowed_shop_display_ids || []) as string[] || []);
  const [requiredAttributes, setRequiredAttributes] = React.useState<any[]>(value?.required_attributes || []);
  const [attributes, setAttributes] = React.useState<any[]>([]);
  const [shops, setShops] = React.useState<any[]>([]);
  const [loadingShops, setLoadingShops] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const dropRef = React.useRef<HTMLDivElement | null>(null);
  // removed skipInitialOnChange in favor of emitting only when parsed differs from incoming `value`

  React.useEffect(() => {
    (async () => {
      try {
        const attrs = await api.admin.getAttributes();
        setAttributes(attrs || []);
      } catch (e) {
        setAttributes([]);
      }
    })();

    if (showAllowedShops) {
      (async () => {
        setLoadingShops(true);
        try {
          const s = await api.admin.getShops();
          const normalized = (Array.isArray(s) ? s : []).map((sh: any) => ({
            ...sh,
            display_id: sh.display_id || sh.displayId || (sh.id ? String(sh.id) : undefined),
          }));
          setShops(normalized);
        } catch (e) {
          setShops([]);
        } finally {
          setLoadingShops(false);
        }
      })();
    }
  }, [showAllowedShops]);

  // sync when `value` prop or `shops` list changes (normalize numeric ids to display_id)
  React.useEffect(() => {
    const incomingAllowed = (value?.allowed_shop_display_ids || []) as string[] || [];
    // try to map numeric ids to shop.display_id when shops are loaded
    const normalized = incomingAllowed.map((id) => {
      // if id already looks like a display id (contains non-digit) keep
      if (typeof id === 'string' && /\D/.test(id)) return id;
      // otherwise try to find shop by numeric id
      const s = shops.find((x) => String(x.id) === String(id));
      if (s && (s.display_id || s.displayId)) return s.display_id || s.displayId;
      return String(id);
    });
    setAllowedShops(normalized);
    setRequiredAttributes(value?.required_attributes || []);
  }, [value, shops]);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  React.useEffect(() => {
    const parsed = {
      allowed_shop_display_ids: Array.isArray(allowedShops) ? allowedShops : (allowedShops ? String(allowedShops).split(",").map((s) => s.trim()).filter(Boolean) : []),
      required_attributes: requiredAttributes,
    } as any;
    // only notify parent if parsed differs from incoming `value` to avoid echoing identical data
    try {
      const incoming = value || {};
      const parsedNormalized = JSON.stringify(parsed || {});
      const incomingNormalized = JSON.stringify(incoming || {});
      if (parsedNormalized !== incomingNormalized) {
        onChange?.(parsed);
      }
    } catch (err) {
      onChange?.(parsed);
    }
  }, [allowedShops, requiredAttributes]);

  return (
    <div className="space-y-4">
      {showAllowedShops && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Allowed shop display ids</label>
          {loadingShops ? (
            <div className="mt-1 text-sm text-slate-500">Loading shops...</div>
          ) : (
            <div className="relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o); }}
                className="mt-1 flex h-10 items-center w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <div className="flex-1 text-sm text-slate-700">
                  {allowedShops.length === 0 ? <span className="text-slate-400">Select shops...</span> : (
                    <div className="flex flex-wrap gap-2">
                      {allowedShops.map((id) => {
                        const s = shops.find((x) => (x.display_id || x.displayId) === id);
                        return (
                          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                            <span>{s ? s.name : id}</span>
                            <button type="button" onClick={(ev) => { ev.stopPropagation(); setAllowedShops((prev) => prev.filter((x) => x !== id)); }} className="ml-1 text-emerald-700">×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="ml-2 text-slate-500">▾</div>
              </div>

              {open && (
                <div ref={dropRef} className="absolute z-40 mt-1 max-h-48 w-full overflow-auto rounded border border-slate-200 bg-white shadow-sm">
                  {shops.map((s) => {
                    const val = s.display_id || s.displayId;
                    if (!val) return null;
                    const selected = allowedShops.includes(val);
                    return (
                      <div key={val} className={`flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50 ${selected ? 'bg-emerald-50' : ''}`}> 
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={selected} onChange={() => {
                            setAllowedShops((prev: string[]) => selected ? prev.filter((x) => x !== val) : [...prev, val]);
                          }} />
                          <div className="text-sm">{s.name} <span className="text-xs text-slate-400 ml-2">{val}</span></div>
                        </div>
                        <div>
                          {selected ? <span className="text-emerald-600 font-semibold">Selected</span> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1">Select one or more shops (leave empty to allow any shop).</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Required Attributes</h4>
          <button
            type="button"
            className="text-sm text-slate-700 underline"
            onClick={() => setRequiredAttributes((prev) => [...prev, { definition_id: null, option_ids: [] }])}
          >
            Add rule
          </button>
        </div>

        {requiredAttributes.length === 0 && <div className="mt-2 text-sm text-slate-500">No attribute requirements.</div>}

        <div className="mt-3 space-y-3">
          {requiredAttributes.map((rule, idx) => {
            const defId = rule.definition_id;
            const def = attributes.find((a) => a.id === defId) || null;
            return (
              <div key={idx} className="rounded border border-slate-200 p-3 bg-white">
                <div className="flex items-center gap-3">
                  <select
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                    value={defId ?? ""}
                    onChange={(e) => {
                      const newDef = e.target.value ? Number(e.target.value) : null;
                      setRequiredAttributes((prev) => prev.map((r, i) => i === idx ? { definition_id: newDef, option_ids: [] } : r));
                    }}
                  >
                    <option value="">-- select attribute --</option>
                    {attributes.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                  </select>

                  <div className="ml-auto">
                    <button type="button" className="text-sm text-rose-600" onClick={() => setRequiredAttributes((prev) => prev.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>

                {def && def.options && def.options.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-slate-600 mb-2">Allowed options (choose one or more)</div>
                    <div className="flex flex-wrap gap-2">
                      {def.options.map((opt: any) => {
                        const checked = Array.isArray(rule.option_ids) && rule.option_ids.includes(opt.id);
                        return (
                          <label key={opt.id} className="inline-flex items-center gap-2 rounded border px-2 py-1 bg-slate-50 text-sm">
                            <input type="checkbox" checked={checked} onChange={(e) => {
                              setRequiredAttributes((prev) => prev.map((r, i) => {
                                if (i !== idx) return r;
                                const option_ids = Array.isArray(r.option_ids) ? [...r.option_ids] : [];
                                if (e.target.checked) {
                                  if (!option_ids.includes(opt.id)) option_ids.push(opt.id);
                                } else {
                                  const ix = option_ids.indexOf(opt.id);
                                  if (ix >= 0) option_ids.splice(ix, 1);
                                }
                                return { ...r, option_ids };
                              }));
                            }} />
                            <span>{opt.value}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
