"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CreateDraftPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prompt.trim().length < 3) {
      showError("Prompt must be at least 3 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/blogs/create`, {
        prompt: prompt.trim(),
      });

      const newDraft = response.data;
      showSuccess("Draft created! Redirecting to your workspace...", undefined, 2000);
      
      setTimeout(() => {
        router.push(`/profile?newId=${newDraft._id}`);
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.prompt?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create draft";

      const technicalDetails = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;

      showError(
        "Failed to create draft. Please check your input and try again.",
        technicalDetails
      );
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
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Create New Draft
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Enter a topic or idea, and our AI will generate a complete blog post draft for you.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Topic / Prompt
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Describe what you'd like to write about. Be as specific or general as you like.
              </p>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="E.g., The societal impact of personalized AI assistants, or How to build better habits using technology..."
                disabled={isLoading}
                required
                minLength={3}
              />
              <p className="mt-2 text-xs text-gray-500">
                {prompt.length}/3 minimum characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors"
              >
                ← Back to Profile
              </Link>

              <button
                type="submit"
                disabled={isLoading || prompt.trim().length < 3}
                className={`w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading || prompt.trim().length < 3
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Generating Draft...
                  </span>
                ) : (
                  "Start AI Generation"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-900">
            <strong>Tip:</strong> The AI will generate a full article based on your prompt. 
            You can edit and refine it after generation in your drafts workspace.
          </p>
        </div>
      </div>
    </>
  );
}
