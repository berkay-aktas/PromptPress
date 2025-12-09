"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface CommentFormProps {
  blogId: string;
  onCommentAdded: () => void;
}

export function CommentForm({ blogId, onCommentAdded }: CommentFormProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      showError("Please enter a comment.");
      return;
    }

    setIsLoading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_BASE_URL}/comments/create`,
        {
          blog_id: blogId,
          text: text.trim(),
        },
        { headers }
      );

      setText("");
      showSuccess("Comment added successfully!");
      onCommentAdded();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.text?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to add comment";

      const technicalDetails = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;

      showError("Failed to add comment. Please try again.", technicalDetails);
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Add a Comment
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder={
                isAuthenticated
                  ? "Share your thoughts..."
                  : "Share your thoughts... (You can comment anonymously)"
              }
              disabled={isLoading}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            {!isAuthenticated && (
              <p className="text-xs text-gray-500">
                You're commenting as Anonymous.{" "}
                <a
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Login
                </a>{" "}
                to comment with your account.
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className={`ml-auto px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                isLoading || !text.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Posting...
                </span>
              ) : (
                "Post Comment"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

