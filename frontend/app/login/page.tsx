"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
      showSuccess("Login successful! Redirecting...", undefined, 2000);
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.email?.message ||
        err.response?.data?.error?.password?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to login";

      const technicalDetails = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;

      showError("Failed to login. Please check your credentials.", technicalDetails);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="max-w-md mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Login
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Sign in to your account to manage your drafts and publish content.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-5 border-t border-gray-100">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
              >
                ← Back to Home
              </Link>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className={`w-full sm:w-auto px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                  isLoading || !email.trim() || !password.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Logging in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-1 transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

