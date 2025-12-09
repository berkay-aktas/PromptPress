"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { IBlogDetail, BlogStatus } from "@/types/Blog";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProfilePage() {
  const [drafts, setDrafts] = useState<IBlogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();
  const { token, user } = useAuth();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchDrafts();
    } else if (!token) {
      setLoading(false);
    }
  }, [user, token]);

  // GET /api/blogs/get-all (filtered by user)
  async function fetchDrafts() {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/blogs/get-all`, { headers });
      
      // Filter to show only current user's drafts if authenticated
      let filteredDrafts = res.data || [];
      if (user) {
        filteredDrafts = filteredDrafts.filter(
          (draft: IBlogDetail) => draft.authorId === user._id || draft.author === user.name
        );
      }
      
      setDrafts(filteredDrafts);
    } catch (err: any) {
      console.error("Draft fetching failed:", err);
      showError(
        "Failed to load drafts. Please check your connection and try again.",
        err.response?.data?.error || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Publish Draft (FR-5)
  function handlePublishClick(draftId: string, promptTitle: string) {
    setConfirmDialog({
      open: true,
      title: "Publish Draft",
      message: `Are you sure you want to publish the draft: "${promptTitle}"?`,
      confirmText: "Publish",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.patch(`${API_BASE_URL}/blogs/update-blogStatus`, {
            blog_id: draftId,
            status: "published",
          });

          setDrafts((prev) =>
            prev.map((d) =>
              d._id === draftId
                ? { ...d, status: "published", publishedAt: new Date().toISOString() }
                : d
            )
          );
          showSuccess("Draft published successfully! It will appear on the public Feed.");
        } catch (err: any) {
          const errorMsg = err.response?.data?.error || "Publish failed";
          showError(
            "Failed to publish draft. Please try again.",
            errorMsg
          );
        }
      },
    });
  }

  // Unpublish Post
  function handleUnpublishClick(postId: string, promptTitle: string) {
    setConfirmDialog({
      open: true,
      title: "Unpublish Post",
      message: `Are you sure you want to unpublish "${promptTitle}"? It will be removed from the public Feed and become a draft again.`,
      confirmText: "Unpublish",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.patch(`${API_BASE_URL}/blogs/update-blogStatus`, {
            blog_id: postId,
            status: "created",
          });

          setDrafts((prev) =>
            prev.map((d) =>
              d._id === postId ? { ...d, status: "created" } : d
            )
          );
          showSuccess("Post unpublished successfully. It's now a draft in your workspace.");
        } catch (err: any) {
          const errorMsg = err.response?.data?.error || "Unpublish failed";
          showError(
            "Failed to unpublish post. Please try again.",
            errorMsg
          );
        }
      },
    });
  }

  // Delete Draft (FR-7)
  function handleDeleteClick(draftId: string, promptTitle: string) {
    setConfirmDialog({
      open: true,
      title: "Delete Draft",
      message: `Delete draft: "${promptTitle}" permanently? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.delete(`${API_BASE_URL}/blogs/delete`, {
            params: { blog_id: draftId },
          });

          setDrafts((prev) => prev.filter((d) => d._id !== draftId));
          showSuccess("Draft successfully deleted.");
        } catch (err: any) {
          showError(
            "Failed to delete draft. Please try again.",
            err.response?.data?.error || err.message
          );
        }
      },
    });
  }

  // Filter drafts and published posts
  const nonPublishedDrafts = drafts.filter((d) => d.status !== "published");
  const publishedPosts = drafts.filter((d) => d.status === "published");

  return (
    <ProtectedRoute>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Your Workspace
          </h1>
          <p className="text-gray-600 text-base">
            Manage your drafts and published posts
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading your content...</p>
          </div>
        ) : nonPublishedDrafts.length === 0 && publishedPosts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              No content yet
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
              Create your first AI-generated blog post to get started
            </p>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            >
              Create Your First Draft
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Published Posts Section */}
            {publishedPosts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Published Posts</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Your published posts visible on the Feed
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {publishedPosts.length} {publishedPosts.length === 1 ? "post" : "posts"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedPosts.map((post) => (
                    <PublishedPostCard
                      key={post._id}
                      post={post}
                      onUnpublish={() => handleUnpublishClick(post._id, post.prompt)}
                      onEdit={() => window.location.href = `/edit/${post._id}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Drafts Section */}
            {nonPublishedDrafts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Drafts</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Your unpublished drafts and works in progress
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {nonPublishedDrafts.length} {nonPublishedDrafts.length === 1 ? "draft" : "drafts"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nonPublishedDrafts.map((d) => (
                    <DraftCard
                      key={d._id}
                      draft={d}
                      onDelete={() => handleDeleteClick(d._id, d.prompt)}
                      onPublish={() => handlePublishClick(d._id, d.prompt)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function DraftCard({
  draft,
  onDelete,
  onPublish,
}: {
  draft: IBlogDetail;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const title = draft.prompt;
  const contentPreview =
    draft.aiResult ||
    (draft.status === "pending"
      ? "Generation in progress..."
      : draft.errorMessage || "No content yet.");

  const isError = draft.status === "error";
  const isPending = draft.status === "pending";
  const isCreated = draft.status === "created";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-5 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2 leading-snug">
          {title || "Untitled Draft"}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={draft.status} />
          <span className="text-xs text-gray-500">
            {new Date(draft.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1 mb-4">
          {isError ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium mb-1">Generation Error</p>
              <p className="text-xs text-red-700 line-clamp-2 break-words">
                {draft.errorMessage || "An error occurred during generation"}
              </p>
            </div>
          ) : isPending ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <p className="text-sm">Generating content...</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 line-clamp-4 break-words whitespace-pre-wrap leading-relaxed">
              {contentPreview}
            </p>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          {(isCreated || isError) && (
            <Link
              href={`/edit/${draft._id}`}
              className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors text-center"
            >
              Edit
            </Link>
          )}

          {isCreated && (
            <button
              onClick={onPublish}
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
            >
              Publish
            </button>
          )}

          <button
            onClick={onDelete}
            className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
            aria-label="Delete draft"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishedPostCard({
  post,
  onUnpublish,
  onEdit,
}: {
  post: IBlogDetail;
  onUnpublish: () => void;
  onEdit: () => void;
}) {
  const title = post.prompt;
  const contentPreview = post.aiResult || "No content available.";

  return (
    <div className="bg-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-5 pb-3 border-b border-gray-100 bg-green-50">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-base text-gray-900 line-clamp-2 leading-snug flex-1">
            {title || "Untitled Post"}
          </h3>
          <StatusBadge status="published" />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-xs text-gray-500">
            Published {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-600 line-clamp-4 break-words whitespace-pre-wrap leading-relaxed">
            {contentPreview.substring(0, 200)}...
          </p>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <Link
            href={`/post/${post._id}`}
            className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors text-center"
          >
            View
          </Link>
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onUnpublish}
            className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-colors"
            aria-label="Unpublish post"
            title="Unpublish this post"
          >
            Unpublish
          </button>
        </div>
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
