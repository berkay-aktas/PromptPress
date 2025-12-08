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
    if (user || !token) {
      fetchDrafts();
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

          setDrafts((prev) => prev.filter((d) => d._id !== draftId));
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

  // Filter only non-published drafts
  const nonPublishedDrafts = drafts.filter((d) => d.status !== "published");

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
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Your Drafts Workspace
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Manage your unpublished drafts and create new content
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading drafts...</p>
          </div>
        ) : nonPublishedDrafts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              No drafts yet
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Create your first AI-generated blog post to get started
            </p>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Create Your First Draft
            </Link>
          </div>
        ) : (
          /* Drafts Grid */
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-5 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 leading-snug">
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
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
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
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors text-center"
            >
              Edit
            </Link>
          )}

          {isCreated && (
            <button
              onClick={onPublish}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
            >
              Publish
            </button>
          )}

          <button
            onClick={onDelete}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
            aria-label="Delete draft"
          >
            Delete
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
