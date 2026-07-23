"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateRegister,
}) => {
  const { login, error: authError, clearError } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!formData.username.trim()) {
      setLocalError("Username is required");
      return;
    }
    if (!formData.password) {
      setLocalError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const userAuth = await login(formData.username, formData.password);

      // Success
      if (onSuccess) {
        onSuccess();
      } else if (userAuth.role === "admin") {
        router.push("/admin");
      } else if (userAuth.role === "shop_owner") {
        router.push("/vendor");
      } else {
        router.push("/");
      }
    } catch (err) {
      // Error is set in auth context
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border border-slate-300 bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-slate-900">Login</h2>

      {displayError && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Registration Link */}
      <div className="mt-4 text-center text-sm text-slate-600 space-y-2">
        <div>
          <button
            onClick={() => (onNavigateRegister ? onNavigateRegister() : router.push('/auth/register'))}
            className="font-semibold text-slate-900 hover:underline"
          >
            New user? Register here
          </button>
        </div>
      </div>
    </div>
  );
};
