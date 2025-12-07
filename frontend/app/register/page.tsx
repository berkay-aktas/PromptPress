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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !name.trim() || !password.trim()) {
      showError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await register(email.trim(), name.trim(), password);
      showSuccess("Registration successful! Redirecting...", undefined, 2000);
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.email?.message ||
        err.response?.data?.error?.name?.message ||
        err.response?.data?.error?.password?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to register";

      const technicalDetails = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;

      showError("Failed to register. Please check your input.", technicalDetails);
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Create Account
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Sign up to start creating and publishing blog posts with AI assistance.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Your full name"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="At least 6 characters"
                disabled={isLoading}
                required
                minLength={6}
              />
              <p className="mt-2 text-xs text-gray-500">
                {password.length}/6 minimum characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Re-enter your password"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors"
              >
                ← Back to Home
              </Link>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !email.trim() ||
                  !name.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim() ||
                  password !== confirmPassword ||
                  password.length < 6
                }
                className={`w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading ||
                  !email.trim() ||
                  !name.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim() ||
                  password !== confirmPassword ||
                  password.length < 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Creating Account...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-1 transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

