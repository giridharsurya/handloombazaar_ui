"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useApi } from "@/lib/ApiProvider";
import { useRouter } from "next/navigation";
import type { AnalyticsPeriod, ShopAnalyticsResponse } from "@/types/apiTypes";

const periods: AnalyticsPeriod[] = ["all", "week", "month", "quarter", "halfyear", "year", "custom"];

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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

export default function VendorAnalyticsPage() {
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
  const [data, setData] = React.useState<ShopAnalyticsResponse | null>(null);
  const [error, setError] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  const shopDisplayId = auth?.shop_display_id;
  const getShopAnalytics = api?.analytics?.getShopAnalytics;

  React.useEffect(() => {
    if (!shopDisplayId) return;
    if (typeof getShopAnalytics !== "function") {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const fromDate = selectedPeriod === "custom"
          ? `${fromCustom.year}-${String(fromCustom.month).padStart(2, "0")}-${String(fromCustom.day).padStart(2, "0")}`
          : undefined;
        const toDate = selectedPeriod === "custom"
          ? `${toCustom.year}-${String(toCustom.month).padStart(2, "0")}-${String(toCustom.day).padStart(2, "0")}`
          : undefined;

        const result = await getShopAnalytics(shopDisplayId, selectedPeriod, {
          month: selectedPeriod === "month" ? selectedMonth : undefined,
          year: selectedPeriod === "year" ? selectedYear : undefined,
          fromDate,
          toDate,
        });
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [shopDisplayId, getShopAnalytics, selectedPeriod, selectedMonth, selectedYear, fromCustom, toCustom]);

  if (isLoading || !auth) return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading analytics...</div>;
  if (auth.role !== "shop_owner") return null;

  const summary = data?.summary;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shop analytics</p>
            <h1 className="mt-2 text-3xl font-semibold">{data?.shop_name || auth.shop_name || "Shop"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/vendor/dashboard" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
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
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-0 focus:border-slate-500"
            >
              {getMonthOptions().map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          ) : null}

          {selectedPeriod === "year" ? (
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-0 focus:border-slate-500"
            >
              {getYearOptions().map((year) => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
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
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading analytics…</div>
        ) : (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total shop views</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.total_shop_views ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Product views</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.total_product_views ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Collection views</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.total_collection_views ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Unique visitors</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.unique_visitor_count ?? 0}</p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Top viewed attributes</h2>
                <ul className="mt-4 space-y-3">
                  {(data?.top_attributes ?? []).length === 0 ? (
                    <li className="text-sm text-slate-500">No attribute data for this period yet.</li>
                  ) : (
                    data?.top_attributes.slice(0, 5).map((item, index) => (
                      <li key={`${item.name}-${item.value}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span>{item.name}: {item.value}</span>
                        <span className="font-medium text-slate-900">{item.view_count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Top collections</h2>
                <ul className="mt-4 space-y-3">
                  {(data?.top_collections ?? []).length === 0 ? (
                    <li className="text-sm text-slate-500">No collection data for this period yet.</li>
                  ) : (
                    data?.top_collections.slice(0, 5).map((item, index) => (
                      <li key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium text-slate-900">{item.view_count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
