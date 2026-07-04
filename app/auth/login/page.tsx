"use client";

import React from "react";
import { LoginForm } from "@/components/Login/LoginForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
