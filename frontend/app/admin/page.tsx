"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { IBlogDetail, BlogStatus } from "@/types/Blog";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { CommentModeration } from "@/app/components/CommentModeration";
import { TagManagement } from "@/app/components/TagManagement";
import { StatsDashboard } from "@/app/components/StatsDashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AdminPage() {
  const [posts, setPosts] = useState<IBlogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  async function fetchAllPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/blogs/get-all`);
      setPosts(res.data || []);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch posts";
      setError(errorMessage);
      showError(
        "Failed to load posts. Please check your connection and try again.",
        err.response?.data?.error || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Delete Post
  function handleDeleteClick(post: IBlogDetail) {
    setConfirmDialog({
      open: true,
      title: "Delete Post",
      message: `Are you sure you want to delete "${post.prompt}"? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.delete(`${API_BASE_URL}/blogs/delete`, {
            params: { blog_id: post._id },
          });
          setPosts((prev) => prev.filter((p) => p._id !== post._id));
          showSuccess("Post deleted successfully.");
        } catch (err: any) {
          showError(
            "Failed to delete post. Please try again.",
            err.response?.data?.error || err.message
          );
        }
      },
    });
  }

  // Toggle Publish/Unpublish
  function handleTogglePublishClick(post: IBlogDetail) {
    const isPublished = post.status === "published";
    const newStatus = isPublished ? "created" : "published";
    const action = isPublished ? "unpublish" : "publish";

    setConfirmDialog({
      open: true,
      title: `${action === "publish" ? "Publish" : "Unpublish"} Post`,
      message: `Are you sure you want to ${action} "${post.prompt}"?`,
      confirmText: action === "publish" ? "Publish" : "Unpublish",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.patch(`${API_BASE_URL}/blogs/update-blogStatus`, {
            blog_id: post._id,
            status: newStatus,
          });

          setPosts((prev) =>
            prev.map((p) =>
              p._id === post._id
                ? {
                    ...p,
                    status: newStatus,
                    publishedAt: newStatus === "published" ? new Date().toISOString() : null,
                  }
                : p
            )
          );
          showSuccess(
            `Post ${action === "publish" ? "published" : "unpublished"} successfully.`
          );
        } catch (err: any) {
          showError(
            `Failed to ${action} post. Please try again.`,
            err.response?.data?.error || err.message
          );
        }
      },
    });
  }

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Manage all posts and drafts in the system
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="mb-12">
          <StatsDashboard />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading posts...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-red-200">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Unable to Load Posts
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
            <button
              onClick={fetchAllPosts}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              No posts yet
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              There are no posts or drafts in the system. Create your first draft to get started.
            </p>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Create First Draft
            </Link>
          </div>
        ) : (
          /* Posts Table/List */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <PostTableRow
                      key={post._id}
                      post={post}
                      onEdit={() => {}}
                      onDelete={() => handleDeleteClick(post)}
                      onTogglePublish={() => handleTogglePublishClick(post)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {posts.map((post) => (
                <PostCardRow
                  key={post._id}
                  post={post}
                  onEdit={() => {}}
                  onDelete={() => handleDeleteClick(post)}
                  onTogglePublish={() => handleTogglePublishClick(post)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tag Management Section */}
        <div className="mt-12">
          <TagManagement />
        </div>

        {/* Comment Moderation Section */}
        <div className="mt-12">
          <CommentModeration />
        </div>
      </div>
    </>
  );
}

function PostTableRow({
  post,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  post: IBlogDetail;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const isPublished = post.status === "published";
  const canEdit = post.status === "created" || post.status === "error";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
          {post.prompt || "Untitled"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={post.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {new Date(post.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {post.author || "Anonymous"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          {canEdit && (
            <Link
              href={`/edit/${post._id}`}
              className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1"
            >
              Edit
            </Link>
          )}
          <button
            onClick={onTogglePublish}
            className={`${
              isPublished
                ? "text-orange-600 hover:text-orange-900"
                : "text-green-600 hover:text-green-900"
            } focus:outline-none focus:ring-2 focus:ring-offset-1 rounded px-2 py-1`}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded px-2 py-1"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function PostCardRow({
  post,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  post: IBlogDetail;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const isPublished = post.status === "published";
  const canEdit = post.status === "created" || post.status === "error";

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
            {post.prompt || "Untitled"}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={post.status} />
            <span className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            By {post.author || "Anonymous"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {canEdit && (
          <Link
            href={`/edit/${post._id}`}
            className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
          >
            Edit
          </Link>
        )}
        <button
          onClick={onTogglePublish}
          className={`px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
            isPublished
              ? "text-orange-700 bg-orange-50 hover:bg-orange-100 focus:ring-orange-500"
              : "text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500"
          }`}
        >
          {isPublished ? "Unpublish" : "Publish"}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BlogStatus }) {
  const map: Record<BlogStatus, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Generating",
    },
    created: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Ready",
    },
    published: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Published",
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Error",
    },
  };

  const styles = map[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
    >
      {status === "pending" && (
        <span className="mr-1.5 h-1.5 w-1.5 bg-current rounded-full animate-pulse"></span>
      )}
      {styles.label}
    </span>
  );
}

