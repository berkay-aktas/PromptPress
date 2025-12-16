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
    <nav className="flex items-center gap-4 sm:gap-5">
      <Link
        href="/feed"
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-600)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 rounded px-2 py-1"
      >
        Feed
      </Link>

      {isAuthenticated ? (
        <>
          <Link
            href="/profile"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-600)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 rounded px-2 py-1"
          >
            Profile
          </Link>

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-600)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 rounded px-2 py-1"
            >
              Admin
            </Link>
          )}

          <Link
            href="/create"
            className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 transition-all shadow-primary hover:shadow-primary-md"
          >
            + New Draft
          </Link>

          <div className="flex items-center gap-3 pl-3 border-l border-[var(--card-border)]">
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-600)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 rounded px-2 py-1"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-600)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 rounded px-2 py-1"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-1 transition-all shadow-primary hover:shadow-primary-md"
          >
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}

