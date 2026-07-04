"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export const LoginButton: React.FC = () => {
  const { isAuthenticated, auth, logout } = useAuth();
  const router = useRouter();

  if (isAuthenticated && auth) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-700">
          Welcome, <strong>{auth.username}</strong>
        </span>
        <button
          onClick={logout}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Logout
        </button>
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
