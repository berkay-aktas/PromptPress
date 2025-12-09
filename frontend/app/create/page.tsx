"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { useAuth } from "@/app/contexts/AuthContext";
import { ITag } from "@/types/Tag";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CreateDraftPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<ITag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();
  const { token, user } = useAuth();

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const response = await axios.get(`${API_BASE_URL}/tags/get-all`);
      setAvailableTags(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch tags:", err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prompt.trim().length < 3) {
      showError("Prompt must be at least 3 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${API_BASE_URL}/blogs/create`,
        {
          prompt: prompt.trim(),
          author: user?.name,
          tags: selectedTags,
        },
        { headers }
      );

      const newDraft = response.data;
      showSuccess("Draft created! Redirecting to your workspace...", 2000);
      
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Create New Draft
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Enter a topic or idea, and our AI will generate a complete blog post draft for you.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="prompt"
                className="block text-xs font-medium text-gray-600 mb-1.5"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="E.g., The societal impact of personalized AI assistants, or How to build better habits using technology..."
                disabled={isLoading}
                required
                minLength={3}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                {prompt.length}/3 minimum characters
              </p>
            </div>

            <div>
              <label
                htmlFor="tags"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Tags (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select tags to help organize and categorize your post.
              </p>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No tags available. Create tags in the admin panel.
                  </p>
                ) : (
                  availableTags.map((tag) => (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag._id)
                            ? prev.filter((id) => id !== tag._id)
                            : [...prev, tag._id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedTags.includes(tag._id)
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
              {selectedTags.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-5 border-t border-gray-100">
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
              >
                ← Back to Profile
              </Link>

              <button
                type="submit"
                disabled={isLoading || prompt.trim().length < 3}
                className={`w-full sm:w-auto px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                  isLoading || prompt.trim().length < 3
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
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
        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-sm text-indigo-900">
            <strong>Tip:</strong> The AI will generate a full article based on your prompt. 
            You can edit and refine it after generation in your drafts workspace.
          </p>
        </div>
      </div>
    </>
  );
}
