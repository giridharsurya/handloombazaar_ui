"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export const LoginButton: React.FC = () => {
  const { isAuthenticated, auth, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!menuOpen) return;

    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const dashboardHref =
    auth?.role === "shop_owner"
      ? "/vendor/dashboard"
      : auth?.role === "admin"
        ? "/admin"
        : null;

  if (isAuthenticated && auth) {
    return (
      <div ref={menuRef} className="relative z-30">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          Profile
          <span className="text-slate-500">({auth.username})</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 min-w-48 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
          >
            {dashboardHref && (
              <Link
                href={dashboardHref}
                role="menuitem"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/auth/login")}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Login
      </button>
    </div>
  );
};
