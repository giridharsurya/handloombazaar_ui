"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";

const adminSections = [
  {
    title: "Collections",
    description: "Create and manage system/vendor collections.",
    href: "/admin/collections",
    cta: "Open Collections",
  },
  {
    title: "Attributes",
    description: "Manage product attributes and options.",
    href: "/admin/attributes",
    cta: "Open Attributes",
  },
  {
    title: "Manage Shops",
    description: "Approve or reject newly registered shops.",
    href: "/admin/shops",
    cta: "Open Shops",
  },
  {
    title: "Shop Product Manager",
    description: "Operate on products/collections for a selected shop as admin.",
    href: "/admin/shop-products",
    cta: "Open Shop Product Manager",
  },
];

export default function AdminPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();

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

  if (isLoading) {
    return null;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin Console</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Handloom Bazaar Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use the dedicated pages below to manage collections, attributes, and shops.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            API endpoint: <span className="font-mono">{API_BASE_URL}</span>
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {adminSections.map((item) => (
            <article key={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-4">
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  {item.cta}
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
