"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import { Attribute } from "@/types/apiTypes";

export default function AdminAttributesPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [attributeName, setAttributeName] = useState("");
  const [attributeOptionsInput, setAttributeOptionsInput] = useState("");
  const [isFilterable, setIsFilterable] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [isSavingAttribute, setIsSavingAttribute] = useState(false);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [feedback, setFeedback] = useState("");

  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null);
  const [editingAttributeData, setEditingAttributeData] = useState({
    name: "",
    is_filterable: false,
    is_required: false,
  });
  const [expandedAttributeId, setExpandedAttributeId] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState("");

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

  const loadAttributes = async () => {
    setIsLoadingAttributes(true);
    try {
      const data = await api.admin.getAttributes();
      setAttributes(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load attributes";
      setFeedback(message);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;
    loadAttributes();
  }, [isLoading, auth]);

  const handleCreateAttribute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    const options = attributeOptionsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!attributeName.trim()) {
      setFeedback("Attribute name is required.");
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
      setFeedback("Attribute and options created successfully.");
      await loadAttributes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create attribute";
      setFeedback(message);
    } finally {
      setIsSavingAttribute(false);
    }
  };

  const handleUpdateAttribute = async (attributeId: number) => {
    setFeedback("");

    if (!editingAttributeData.name.trim()) {
      setFeedback("Attribute name is required.");
      return;
    }

    try {
      await api.admin.updateAttribute(attributeId, {
        attribute_name: editingAttributeData.name.trim(),
        is_filterable: editingAttributeData.is_filterable,
        is_required: editingAttributeData.is_required,
      });

      setEditingAttributeId(null);
      setFeedback("Attribute updated successfully.");
      await loadAttributes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update attribute";
      setFeedback(message);
    }
  };

  const handleUpdateOption = async (attributeId: number, optionId: number) => {
    setFeedback("");

    if (!editingOptionValue.trim()) {
      setFeedback("Option value is required.");
      return;
    }

    try {
      await api.admin.updateOption(attributeId, optionId, { option_value: editingOptionValue.trim() });
      setEditingOptionId(null);
      setEditingOptionValue("");
      setFeedback("Option updated successfully.");
      await loadAttributes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update option";
      setFeedback(message);
    }
  };

  const handleDeleteOption = async (attributeId: number, optionId: number) => {
    setFeedback("");
    if (!confirm("Are you sure you want to delete this option?")) return;

    try {
      await api.admin.deleteOption(attributeId, optionId);
      setFeedback("Option deleted successfully.");
      await loadAttributes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete option";
      setFeedback(message);
    }
  };

  const handleToggleAttributeActive = async (attributeId: number) => {
    setFeedback("");
    try {
      await api.admin.toggleAttributeActive(attributeId);
      await loadAttributes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle attribute status";
      setFeedback(message);
    }
  };

  const handleDeleteAttribute = async (attributeId: number) => {
    setFeedback("");
    if (!confirm("Are you sure you want to delete this attribute? This will also delete all attribute options and their associations with products. This cannot be undone.")) {
      return;
    }

    try {
      await api.admin.deleteAttribute(attributeId);
      setFeedback("Attribute and all associated data deleted successfully.");
      await loadAttributes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete attribute";
      setFeedback(message);
    }
  };

  if (isLoading) return null;
  if (!auth || auth.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Attributes Management</h1>
          <p className="mt-1 text-sm text-slate-600">Create and maintain product attributes and options.</p>

          <form className="mt-5 space-y-4" onSubmit={handleCreateAttribute}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="attribute-name">Attribute Name</label>
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
                <label className="mb-1 block text-sm font-medium" htmlFor="attribute-options">Options (comma-separated)</label>
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
                <input type="checkbox" checked={isFilterable} onChange={(event) => setIsFilterable(event.target.checked)} />
                Filterable
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />
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

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Existing Attributes</h2>
              {isLoadingAttributes ? <span className="text-sm text-slate-600">Loading...</span> : <span className="text-sm text-slate-600">{attributes.length} total</span>}
            </div>

            {attributes.length > 0 ? (
              <div className="space-y-4">
                {attributes.map((attr) =>
                  editingAttributeId === attr.id ? (
                    <div key={attr.id} className="rounded-lg border border-slate-300 bg-slate-50 p-4">
                      <div className="space-y-3">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium">Attribute Name</label>
                            <input
                              type="text"
                              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                              value={editingAttributeData.name}
                              onChange={(e) => setEditingAttributeData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editingAttributeData.is_filterable}
                                onChange={(e) => setEditingAttributeData((prev) => ({ ...prev, is_filterable: e.target.checked }))}
                              />
                              Filterable
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editingAttributeData.is_required}
                                onChange={(e) => setEditingAttributeData((prev) => ({ ...prev, is_required: e.target.checked }))}
                              />
                              Required
                            </label>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleUpdateAttribute(attr.id)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">Save</button>
                          <button type="button" onClick={() => setEditingAttributeId(null)} className="rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-300">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={attr.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{attr.name}</h3>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${attr.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                              {attr.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            {attr.is_filterable && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Filterable</span>}
                            {attr.is_required && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">Required</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button type="button" onClick={() => handleToggleAttributeActive(attr.id)} className={`rounded-md px-2 py-1 text-xs font-semibold text-white ${attr.is_active ? "bg-slate-600 hover:bg-slate-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
                            {attr.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button type="button" onClick={() => setExpandedAttributeId(expandedAttributeId === attr.id ? null : attr.id)} className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-300">
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
                          <button type="button" onClick={() => handleDeleteAttribute(attr.id)} className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500">Delete</button>
                        </div>
                      </div>

                      {expandedAttributeId === attr.id && attr.options.length > 0 && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="mb-2 text-xs font-medium text-slate-600">Options ({attr.options.length})</p>
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
                                  <button type="button" onClick={() => handleUpdateOption(attr.id, opt.id)} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500">Save</button>
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
                                <div key={opt.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1.5">
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
                                    <button type="button" onClick={() => handleDeleteOption(attr.id, opt.id)} className="rounded-md bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white hover:bg-rose-500">Delete</button>
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

          {feedback ? <p className="mt-4 text-sm text-slate-700">{feedback}</p> : null}
        </section>
      </div>
    </main>
  );
}
