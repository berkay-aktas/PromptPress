"use client";

import { IComment } from "@/types/Comment";
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface CommentListProps {
  comments: IComment[];
  onCommentDeleted: () => void;
}

export function CommentList({ comments, onCommentDeleted }: CommentListProps) {
  const { token, user } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE_URL}/comments/delete`, {
        params: { comment_id: commentId },
        headers,
      });

      showSuccess("Comment deleted successfully.");
      onCommentDeleted();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to delete comment";
      showError("Failed to delete comment. Please try again.", errorMessage);
    }
  };

  const canDelete = (comment: IComment) => {
    if (!user) return false;
    return user.role === "admin" || comment.user?._id === user._id;
  };

  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-gray-500 text-center text-sm">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>
        {comments.map((comment) => (
          <div
            key={comment._id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">
                    {comment.user?.name || "Anonymous"}
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
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
              </div>
              {canDelete(comment) && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
                  aria-label="Delete comment"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

