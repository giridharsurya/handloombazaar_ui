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
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifiedOtpCode, setVerifiedOtpCode] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"request" | "verify" | "reset" | "done">("request");
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleRecoveryRequest = async () => {
    const email = recoveryEmail.trim();
    if (!email) {
      setLocalError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setRecoveryLoading(true);
    setLocalError(null);
    setRecoveryMessage(null);

    try {
      const result = await (await import("@/lib/api")).api.auth.requestPasswordReset(email.toLowerCase());
      setRecoveryMessage(result.message);
      setRecoveryStep("verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send OTP.";
      setLocalError(message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleRecoveryVerify = async () => {
    const email = recoveryEmail.trim().toLowerCase();
    if (!otpCode.trim()) {
      setLocalError("OTP is required");
      return;
    }

    setRecoveryLoading(true);
    setLocalError(null);
    setRecoveryMessage(null);

    try {
      const trimmedOtp = otpCode.trim();
      const result = await (await import("@/lib/api")).api.auth.verifyPasswordReset(email, trimmedOtp);
      setRecoveryMessage(result.message);
      setRecoveryStep("reset");
      setVerifiedOtpCode(trimmedOtp);
      setOtpCode(trimmedOtp);
      setRecoveryUsername(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to verify OTP.";
      setLocalError(message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleRetrieveUsername = async () => {
    const email = recoveryEmail.trim().toLowerCase();
    if (!otpCode.trim()) {
      setLocalError("OTP is required");
      return;
    }

    setRecoveryLoading(true);
    setLocalError(null);
    setRecoveryMessage(null);

    try {
      const result = await (await import("@/lib/api")).api.auth.retrievePasswordReset(email, otpCode.trim());
      setRecoveryUsername(result.username || null);
      setRecoveryMessage(result.message);
      setRecoveryStep("reset");
      setVerifiedOtpCode(otpCode.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to retrieve username.";
      setLocalError(message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = recoveryEmail.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      setLocalError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setRecoveryLoading(true);
    setLocalError(null);
    setRecoveryMessage(null);

    try {
      const resetOtp = verifiedOtpCode.trim() || otpCode.trim();
      const result = await (await import("@/lib/api")).api.auth.resetPassword(email, resetOtp, newPassword);
      setRecoveryMessage(result.message);
      setRecoveryStep("done");
      setNewPassword("");
      setConfirmPassword("");
      setOtpCode("");
      setVerifiedOtpCode("");
      setRecoveryUsername(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset password.";
      setLocalError(message);
    } finally {
      setRecoveryLoading(false);
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

      {!showRecovery ? (
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
      ) : (
        <div className="space-y-4">
          {recoveryStep === "request" && (
            <>
              <div>
                <label htmlFor="recoveryEmail" className="block text-sm font-medium text-slate-700">
                  Registered email address
                </label>
                <input
                  id="recoveryEmail"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <button
                type="button"
                disabled={recoveryLoading}
                onClick={handleRecoveryRequest}
                className="w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {recoveryLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          )}

          {recoveryStep === "verify" && (
            <>
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-slate-700">
                  Enter OTP
                </label>
                <input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <button
                type="button"
                disabled={recoveryLoading}
                onClick={handleRecoveryVerify}
                className="w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {recoveryLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                disabled={recoveryLoading}
                onClick={handleRetrieveUsername}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {recoveryLoading ? "Retrieving..." : "Forgot username? Retrieve it"}
              </button>
            </>
          )}

          {recoveryStep === "reset" && (
            <>
              {recoveryUsername && (
                <p className="text-sm text-slate-700">Username: <span className="font-semibold">{recoveryUsername}</span></p>
              )}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <button
                type="button"
                disabled={recoveryLoading}
                onClick={handlePasswordReset}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {recoveryLoading ? "Resetting..." : "Set New Password"}
              </button>
            </>
          )}

          {recoveryStep === "done" && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Password reset successful</p>
              <p className="mt-2">You can now login with your new password.</p>
            </div>
          )}

          {recoveryMessage && (
            <p className="text-sm text-slate-600">{recoveryMessage}</p>
          )}
        </div>
      )}

      {/* Registration Link */}
      <div className="mt-4 text-center text-sm text-slate-600 space-y-2">
        <div>
          <button
            type="button"
            onClick={() => {
              if (!showRecovery) {
                setShowRecovery(true);
                setRecoveryMessage(null);
                setRecoveryStep("request");
                setRecoveryUsername(null);
                setNewPassword("");
                setConfirmPassword("");
                setOtpCode("");
                setVerifiedOtpCode("");
                setRecoveryEmail("");
              } else {
                setShowRecovery(false);
                setRecoveryMessage(null);
                setRecoveryStep("request");
                setRecoveryUsername(null);
                setNewPassword("");
                setConfirmPassword("");
                setOtpCode("");
                setVerifiedOtpCode("");
                setRecoveryEmail("");
              }
            }}
            className="font-semibold text-slate-900 hover:underline"
          >
            {showRecovery ? "Back to login" : "Forgot username/password?"}
          </button>
        </div>
        {!showRecovery && (
          <div>
            <button
              type="button"
              onClick={() => (onNavigateRegister ? onNavigateRegister() : router.push('/auth/register'))}
              className="font-semibold text-slate-900 hover:underline"
            >
              New user? Register here
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
