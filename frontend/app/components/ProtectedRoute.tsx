"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin" | "author";
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      if (requireRole && user?.role !== requireRole) {
        router.push("/");
        return;
      }
    }
  }, [isAuthenticated, loading, user, requireRole, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

