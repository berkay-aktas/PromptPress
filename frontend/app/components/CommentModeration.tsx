"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { IComment } from "@/types/Comment";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function CommentModeration() {
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const { token } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchAllComments();
  }, []);

  async function fetchAllComments() {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/comments/get-all`, {
        headers,
      });
      setComments(response.data || []);
    } catch (err: any) {
      showError(
        "Failed to load comments. Please check your connection.",
        err.response?.data?.error || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = (comment: IComment) => {
    const newStatus = comment.status === "visible" ? "hidden" : "visible";
    setConfirmDialog({
      open: true,
      title: `${newStatus === "hidden" ? "Hide" : "Show"} Comment`,
      message: `Are you sure you want to ${newStatus === "hidden" ? "hide" : "show"} this comment?`,
      confirmText: newStatus === "hidden" ? "Hide" : "Show",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          await axios.patch(
            `${API_BASE_URL}/comments/update-status`,
            {
              comment_id: comment._id,
              status: newStatus,
            },
            { headers }
          );

          setComments((prev) =>
            prev.map((c) =>
              c._id === comment._id ? { ...c, status: newStatus } : c
            )
          );
          showSuccess(`Comment ${newStatus === "hidden" ? "hidden" : "shown"} successfully.`);
        } catch (err: any) {
          showError(
            `Failed to update comment status. Please try again.`,
            err.response?.data?.error || err.message
          );
        }
      },
    });
  };

  const handleDelete = (comment: IComment) => {
    setConfirmDialog({
      open: true,
      title: "Delete Comment",
      message: `Are you sure you want to delete this comment? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          await axios.delete(`${API_BASE_URL}/comments/delete`, {
            params: { comment_id: comment._id },
            headers,
          });

          setComments((prev) => prev.filter((c) => c._id !== comment._id));
          showSuccess("Comment deleted successfully.");
        } catch (err: any) {
          showError(
            "Failed to delete comment. Please try again.",
            err.response?.data?.error || err.message
          );
        }
      },
    });
  };

  const filteredComments =
    filter === "all"
      ? comments
      : comments.filter((c) => c.status === filter);

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Comment Moderation
              </h2>
              <p className="text-sm text-gray-600">
                Manage and moderate comments on published posts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                All ({comments.length})
              </button>
              <button
                onClick={() => setFilter("visible")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === "visible"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Visible ({comments.filter((c) => c.status === "visible").length})
              </button>
              <button
                onClick={() => setFilter("hidden")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === "hidden"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Hidden ({comments.filter((c) => c.status === "hidden").length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600 text-sm">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-600 text-sm">
              {filter === "all"
                ? "No comments yet"
                : `No ${filter} comments`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredComments.map((comment) => (
              <div key={comment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {comment.user?.name || "Anonymous"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          comment.status === "visible"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {comment.status === "visible" ? "Visible" : "Hidden"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap break-words mb-2">
                      {comment.text}
                    </p>
                    <Link
                      href={`/post/${typeof comment.blog === "string" ? comment.blog : comment.blog._id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Post →
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(comment)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        comment.status === "visible"
                          ? "text-orange-700 bg-orange-50 hover:bg-orange-100"
                          : "text-green-700 bg-green-50 hover:bg-green-100"
                      }`}
                    >
                      {comment.status === "visible" ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleDelete(comment)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

