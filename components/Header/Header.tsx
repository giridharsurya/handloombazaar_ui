"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar/SearchBar";
// Navigation links inlined below (removed `NavigationRibbon` component)
import { LoginButton } from "@/components/Login/LoginButton";
import api from "@/lib/api";

function formatCurrentTime() {
  const now = new Date();

  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${weekday} ${day}-${month}-${year} ${time}`;
}

function formatProductTimestamp(value: string | null | undefined) {
  if (!value) return "No recent product";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No recent product";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState(() => formatCurrentTime());
  const [latestProductTimestamp, setLatestProductTimestamp] = useState<string | null>(null);
  const searchValue = searchParams.get("search") ?? "";
  const isHomePage = pathname === "/";
  const headerTimestamp = isHomePage ? `Latest product: ${formatProductTimestamp(latestProductTimestamp)}` : currentTime;

  useEffect(() => {
    if (!headerRef.current) {
      return;
    }

    const updateHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--app-header-height", `${height}px`);
    };

    updateHeaderHeight();

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerRef.current);

    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      const interval = window.setInterval(() => {
        setCurrentTime(formatCurrentTime());
      }, 60000);

      return () => window.clearInterval(interval);
    }

    let mounted = true;

    void (async () => {
      try {
        const pageData = await api.products.getProductsPage({ page: 1, page_size: 20 });
        if (!mounted) return;
        const newestCreatedAt = pageData.items?.[0]?.created_at ?? null;
        setLatestProductTimestamp(newestCreatedAt);
      } catch (error) {
        console.error("Failed to load latest product timestamp", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isHomePage]);

  return (
    <div
      ref={headerRef}
      className="fixed top-0 left-0 right-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50"
    >
      <div className="w-full pt-4 px-4">
        <div className="relative z-20 w-full flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 w-full">
            <div>
              <Link
                href="/"
                className="text-3xl font-bold text-gray-900 dark:text-white hover:text-rose-600 transition-colors"
              >
                Handloom Bazaar
              </Link>
            </div>
            <div className="w-full max-w-2xl">
              <SearchBar
                value={searchValue}
                onSearch={(query) => {
                  if (!query) {
                    router.push("/sarees");
                    return;
                  }
                  router.push(`/sarees?search=${encodeURIComponent(query)}`);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {headerTimestamp}
            </p>
            <LoginButton />
          </div>
        </div>

        {/* Short navigation bar */}
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <nav className="bg-rose-600 text-white py-1">
            <div className="flex items-center justify-center gap-6">
              <Link
                href="/sarees"
                className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
              >
                Sarees
              </Link>
              <Link
                href="/shops"
                className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
              >
                Shops
              </Link>
              <Link
                href="/featured"
                className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
              >
                Featured
              </Link>
              <Link
                href="/collections"
                className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
              >
                Collections
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
