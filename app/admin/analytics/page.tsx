"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useApi } from "@/lib/ApiProvider";
import { useRouter } from "next/navigation";
import type { AnalyticsPeriod, ShopAnalyticsResponse } from "@/types/apiTypes";

const periods: AnalyticsPeriod[] = ["all", "week", "month", "quarter", "halfyear", "year", "custom"];

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: new Date(2024, index, 1).toLocaleString("en-US", { month: "long" }),
  }));
}

function getDayOptions() {
  return Array.from({ length: 31 }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  }));
}

function getYearOptions() {
  const now = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, index) => {
    const year = now - index;
    return { value: String(year), label: String(year) };
  }).reverse();
}

function getDefaultCustomRange() {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 30);
  return {
    from: {
      day: String(fromDate.getDate()),
      month: String(fromDate.getMonth() + 1),
      year: String(fromDate.getFullYear()),
    },
    to: {
      day: String(toDate.getDate()),
      month: String(toDate.getMonth() + 1),
      year: String(toDate.getFullYear()),
    },
  };
}

export default function AdminAnalyticsPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();
  const defaultCustomRange = React.useMemo(() => getDefaultCustomRange(), []);

  const [selectedPeriod, setSelectedPeriod] = React.useState<AnalyticsPeriod>("all");
  const [selectedMonth, setSelectedMonth] = React.useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = React.useState<string>(String(new Date().getFullYear()));
  const [fromCustom, setFromCustom] = React.useState({
    day: defaultCustomRange.from.day,
    month: defaultCustomRange.from.month,
    year: defaultCustomRange.from.year,
  });
  const [toCustom, setToCustom] = React.useState({
    day: defaultCustomRange.to.day,
    month: defaultCustomRange.to.month,
    year: defaultCustomRange.to.year,
  });
  const [shops, setShops] = React.useState<Array<{ id: number; display_id: string; name: string }>>([]);
  const [selectedShopDisplayId, setSelectedShopDisplayId] = React.useState<string>("");
  const [data, setData] = React.useState<{ period: string; summary: any; selected_shop?: ShopAnalyticsResponse | null } | null>(null);
  const [error, setError] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "admin") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  React.useEffect(() => {
    if (!auth || auth.role !== "admin") return;

    const loadShops = async () => {
      try {
        const shopsResponse = await api.admin.getShops();
        setShops(shopsResponse || []);
      } catch {
        setShops([]);
      }
    };

    loadShops();
  }, [api, auth]);

  React.useEffect(() => {
    if (!auth || auth.role !== "admin") return;

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const fromDate = selectedPeriod === "custom"
          ? `${fromCustom.year}-${String(fromCustom.month).padStart(2, "0")}-${String(fromCustom.day).padStart(2, "0")}`
          : undefined;
        const toDate = selectedPeriod === "custom"
          ? `${toCustom.year}-${String(toCustom.month).padStart(2, "0")}-${String(toCustom.day).padStart(2, "0")}`
          : undefined;

        const result = await api.analytics.getAdminAnalytics(selectedPeriod, {
          month: selectedPeriod === "month" ? selectedMonth : undefined,
          year: selectedPeriod === "year" ? selectedYear : undefined,
          fromDate,
          toDate,
          shopDisplayId: selectedShopDisplayId || undefined,
        });

        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load admin analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [api, auth, selectedPeriod, selectedMonth, selectedYear, fromCustom, toCustom, selectedShopDisplayId]);

  if (isLoading || !auth) return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading analytics...</div>;
  if (auth.role !== "admin") return null;

  const summary = data?.summary;
  const selectedShop = data?.selected_shop;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin analytics</p>
            <h1 className="mt-2 text-3xl font-semibold">Site analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label htmlFor="analytics-period" className="text-sm font-medium text-slate-600">Time period</label>
          <select
            id="analytics-period"
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value as AnalyticsPeriod)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-0 focus:border-slate-500"
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period === "all" ? "Entire duration" : period === "halfyear" ? "6 months" : period === "custom" ? "Custom range" : period}
              </option>
            ))}
          </select>

          {selectedPeriod === "month" ? (
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-0 focus:border-slate-500">
              {getMonthOptions().map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
          ) : null}

          {selectedPeriod === "year" ? (
            <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-0 focus:border-slate-500">
              {getYearOptions().map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
            </select>
          ) : null}

          {selectedPeriod === "custom" ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">From</span>
                <select value={fromCustom.day} onChange={(event) => setFromCustom((current) => ({ ...current, day: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800">
                  {getDayOptions().map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
                <select value={fromCustom.month} onChange={(event) => setFromCustom((current) => ({ ...current, month: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800">
                  {getMonthOptions().map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                </select>
                <select value={fromCustom.year} onChange={(event) => setFromCustom((current) => ({ ...current, year: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800">
                  {getYearOptions().map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">To</span>
                <select value={toCustom.day} onChange={(event) => setToCustom((current) => ({ ...current, day: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800">
                  {getDayOptions().map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
                <select value={toCustom.month} onChange={(event) => setToCustom((current) => ({ ...current, month: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800">
                  {getMonthOptions().map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                </select>
                <select value={toCustom.year} onChange={(event) => setToCustom((current) => ({ ...current, year: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800">
                  {getYearOptions().map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
                </select>
              </div>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="shop-select" className="text-sm font-medium text-slate-600">Shop</label>
            <select
              id="shop-select"
              value={selectedShopDisplayId}
              onChange={(event) => setSelectedShopDisplayId(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-0 focus:border-slate-500"
            >
              <option value="">All shops</option>
              {shops.map((shop) => (
                <option key={shop.display_id} value={shop.display_id}>{shop.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading analytics…</div>
        ) : (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Site visitors</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.site_visitor_count ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">System collection views</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.system_collection_views ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Shop views</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.shop_views ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total shops</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.total_shops ?? 0}</p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Top shops</h2>
                <ul className="mt-4 space-y-3">
                  {((summary?.top_shops ?? []) as Array<{ name: string; view_count: number }>).length === 0 ? (
                    <li className="text-sm text-slate-500">No shop activity for this period yet.</li>
                  ) : (
                    (summary?.top_shops ?? []).slice(0, 5).map((item: { name: string; view_count: number }, index: number) => (
                      <li key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium text-slate-900">{item.view_count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Top system collections</h2>
                <ul className="mt-4 space-y-3">
                  {((summary?.top_system_collections ?? []) as Array<{ name: string; view_count: number }>).length === 0 ? (
                    <li className="text-sm text-slate-500">No system collection activity for this period yet.</li>
                  ) : (
                    (summary?.top_system_collections ?? []).slice(0, 5).map((item: { name: string; view_count: number }, index: number) => (
                      <li key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium text-slate-900">{item.view_count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-semibold">Selected shop view</h2>
                {selectedShop ? (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-slate-600">Viewing: <span className="font-semibold text-slate-900">{selectedShop.shop_name}</span></p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Shop views</p>
                        <p className="mt-2 text-2xl font-semibold">{selectedShop.summary.total_shop_views}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Product views</p>
                        <p className="mt-2 text-2xl font-semibold">{selectedShop.summary.total_product_views}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Collection views</p>
                        <p className="mt-2 text-2xl font-semibold">{selectedShop.summary.total_collection_views}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Unique visitors</p>
                        <p className="mt-2 text-2xl font-semibold">{selectedShop.summary.unique_visitor_count}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Choose a shop to view the detailed shop analytics.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
