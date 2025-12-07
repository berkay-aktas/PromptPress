"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { IStats } from "@/types/Stats";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function StatsDashboard() {
  const [stats, setStats] = useState<IStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { notifications, dismissNotification, showError } = useNotifications();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/stats/overview`, {
        headers,
      });
      setStats(response.data);
    } catch (err: any) {
      showError(
        "Failed to load statistics. Please check your connection.",
        err.response?.data?.error || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600 text-sm">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Statistics Overview
              </h2>
              <p className="text-sm text-gray-600">
                Key metrics and insights about your platform
              </p>
            </div>
            <button
              onClick={fetchStats}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Posts Stats */}
            <StatCard
              title="Total Posts"
              value={stats.posts.total}
              subtitle={`${stats.posts.published} published`}
              icon="📝"
              color="indigo"
            />
            <StatCard
              title="Drafts"
              value={stats.posts.drafts}
              subtitle={`${stats.posts.pending} pending`}
              icon="📄"
              color="blue"
            />
            <StatCard
              title="Comments"
              value={stats.comments.total}
              subtitle={`${stats.comments.visible} visible`}
              icon="💬"
              color="green"
            />
            <StatCard
              title="Users"
              value={stats.users.total}
              subtitle={`${stats.users.admins} admins`}
              icon="👥"
              color="purple"
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Posts by Status */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Posts by Status
              </h3>
              <div className="space-y-2">
                <StatRow
                  label="Published"
                  value={stats.posts.published}
                  total={stats.posts.total}
                  color="green"
                />
                <StatRow
                  label="Drafts"
                  value={stats.posts.drafts}
                  total={stats.posts.total}
                  color="blue"
                />
                <StatRow
                  label="Pending"
                  value={stats.posts.pending}
                  total={stats.posts.total}
                  color="yellow"
                />
                <StatRow
                  label="Error"
                  value={stats.posts.error}
                  total={stats.posts.total}
                  color="red"
                />
              </div>
            </div>

            {/* Comments Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Comments
              </h3>
              <div className="space-y-2">
                <StatRow
                  label="Visible"
                  value={stats.comments.visible}
                  total={stats.comments.total}
                  color="green"
                />
                <StatRow
                  label="Hidden"
                  value={stats.comments.hidden}
                  total={stats.comments.total}
                  color="red"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Recent Activity (7 days)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">New Posts</span>
                  <span className="font-semibold text-gray-900">
                    {stats.posts.recent}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">New Comments</span>
                  <span className="font-semibold text-gray-900">
                    {stats.comments.recent}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">New Users</span>
                  <span className="font-semibold text-gray-900">
                    {stats.users.recent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Tags</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {stats.tags.total}
                  </p>
                </div>
                <div className="text-3xl">🏷️</div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Authors</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.users.authors}
                  </p>
                </div>
                <div className="text-3xl">✍️</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Published Posts
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.posts.published}
                  </p>
                </div>
                <div className="text-3xl">📰</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: "indigo" | "blue" | "green" | "purple";
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: "green" | "blue" | "yellow" | "red";
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {value} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

