"use client";

import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="flex items-center gap-3 sm:gap-4">
      <Link
        href="/feed"
        className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
      >
        Feed
      </Link>

      {isAuthenticated ? (
        <>
          <Link
            href="/profile"
            className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            Profile
          </Link>

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
            >
              Admin
            </Link>
          )}

          <Link
            href="/create"
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            + New Draft
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-300">
            <span className="text-xs text-gray-600 hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}

