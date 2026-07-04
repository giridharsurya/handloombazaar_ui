"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useApi } from "@/lib/ApiProvider";

type UserRole = "shop_owner" | "admin" | "user";

interface UserAuth {
  username: string;
  role: UserRole;
  // optional vendor-specific fields
  shop_display_id?: string;
  shop_name?: string;
  email: string;
}

interface AuthContextType {
  auth: UserAuth | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<UserAuth>;
  register: (userData: {
    username: string;
    password: string;
    shop_name: string;
    email: string;
    year_established: number;
    address: string;
    phone_number: string;
    shop_logo_url: string | File;
  }) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<UserAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem("auth_token");
      const authData = localStorage.getItem("auth_data");

      if (token && authData) {
        try {
          const verify = await api.auth.verify(token);
          if (verify.valid) {
            const parsedAuth = JSON.parse(authData) as UserAuth;
            setAuth(parsedAuth);
          } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_data");
          }
        } catch {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_data");
        }
      }
      setIsLoading(false);
    };

    restoreAuth();
  }, [api]);

  const login = async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await api.auth.login({ username, password });

      const userAuth: UserAuth = {
        username: data.username,
        role: data.role,
        email: data.email,
        shop_display_id: data.shop_display_id ?? undefined,
        shop_name: data.shop_name ?? undefined,
      };

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_data", JSON.stringify(userAuth));
      setAuth(userAuth);
      return userAuth;
    } catch (err) {
      const rawMessage = extractErrorMessage(err, "Login failed");
      const lower = rawMessage.toLowerCase();
      const message =
        lower.includes("invalid username or password") || lower.includes("401")
          ? "Invalid username or password"
          : rawMessage;
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    shop_name: string;
    email: string;
    year_established: number;
    address: string;
    phone_number: string;
    shop_logo_url: string | File;
  }) => {
    setError(null);
    setIsLoading(true);
    try {
      let data;
      if (userData.shop_logo_url instanceof File) {
        const form = new FormData();
        form.append("username", userData.username);
        form.append("password", userData.password);
        form.append("shop_name", userData.shop_name);
        form.append("email", userData.email);
        form.append("year_established", String(userData.year_established));
        form.append("address", userData.address);
        form.append("phone_number", userData.phone_number);
        form.append("shop_logo", userData.shop_logo_url);
        data = await api.auth.register(form);
      } else {
        const payload = {
          username: userData.username,
          password: userData.password,
          shop_name: userData.shop_name,
          email: userData.email,
          year_established: userData.year_established,
          address: userData.address,
          phone_number: userData.phone_number,
          shop_logo_url: userData.shop_logo_url,
        };
        data = await api.auth.register(payload);
      }

      const userAuth: UserAuth = {
        username: data.username,
        role: data.role,
        email: data.email,
        shop_display_id: data.shop_display_id,
        shop_name: userData.shop_name,
      };

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_data", JSON.stringify(userAuth));
      setAuth(userAuth);
    } catch (err) {
      const message = extractErrorMessage(err, "Registration failed");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_data");
    setAuth(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        isLoading,
        isAuthenticated: !!auth,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
