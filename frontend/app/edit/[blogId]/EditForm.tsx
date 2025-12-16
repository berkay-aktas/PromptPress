"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { IBlogDetail } from "@/types/Blog";
import { ITag } from "@/types/Tag";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { RevisionHistory } from "@/app/components/RevisionHistory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface EditFormProps {
  initialData: IBlogDetail;
}

export default function EditForm({ initialData }: EditFormProps) {
  const [blog, setBlog] = useState(initialData);
  const [selectedText, setSelectedText] = useState("");
  const [howToChange, setHowToChange] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData.tags?.map((t) => t._id) || []
  );
  const [availableTags, setAvailableTags] = useState<ITag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const router = useRouter();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const isPublished = blog.status === "published";

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

  // Handle text selection from markdown-rendered content
  // When user selects text in the rendered markdown, we get the plain text.
  // We try to find the corresponding markdown substring in the original content.
  // The backend does fuzzy matching, so it will handle variations.
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const selectedPlainText = selection.toString().trim();
      const markdownContent = blog.aiResult || "";
      
      if (!markdownContent) {
        setSelectedText(selectedPlainText);
        return;
      }
      
      // Try to find the selected text in the original markdown
      // Use case-insensitive search and handle whitespace variations
      const normalizedSelected = selectedPlainText.replace(/\s+/g, " ").trim();
      const searchLower = normalizedSelected.toLowerCase();
      
      // Search in the original markdown (case-insensitive)
      const markdownLower = markdownContent.toLowerCase();
      const index = markdownLower.indexOf(searchLower);
      
      if (index !== -1) {
        // Found a match - extract the substring with original markdown formatting
        // Use a small window to capture markdown syntax around the text
        const windowSize = 50;
        const start = Math.max(0, index - windowSize);
        const end = Math.min(markdownContent.length, index + normalizedSelected.length + windowSize);
        const context = markdownContent.substring(start, end);
        
        // Find the exact position in the context
        const contextLower = context.toLowerCase();
        const contextIndex = contextLower.indexOf(searchLower);
        
        if (contextIndex !== -1) {
          // Extract substring, trying to include markdown syntax
          // Start from beginning of word/line if possible
          let extractStart = contextIndex;
          let extractEnd = contextIndex + normalizedSelected.length;
          
          // Try to include markdown syntax before (headings, bold, etc.)
          for (let i = extractStart - 1; i >= 0 && i >= extractStart - 10; i--) {
            if (context[i].match(/[#*`\n]/)) {
              extractStart = i;
              break;
            }
            if (context[i].match(/\s/)) {
              continue;
            }
            break;
          }
          
          // Try to include markdown syntax after
          for (let i = extractEnd; i < context.length && i < extractEnd + 10; i++) {
            if (context[i].match(/[#*`\n]/)) {
              extractEnd = i;
              break;
            }
            if (context[i].match(/\s/)) {
              continue;
            }
            break;
          }
          
          const markdownSubstring = context.substring(extractStart, extractEnd).trim();
          setSelectedText(markdownSubstring || selectedPlainText);
        } else {
          setSelectedText(selectedPlainText);
        }
      } else {
        // No exact match - use plain text (backend fuzzy matching will handle it)
        setSelectedText(selectedPlainText);
      }
    } else {
      setSelectedText("");
    }
  }, [blog.aiResult]);

  // Targeted Edit
  const handleTargetedEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedText || !howToChange.trim()) {
      showError("Please select text in the draft content and provide an instruction.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/blogs/update-blogContent`,
        {
          blog_id: blog._id,
          what: selectedText,
          how: howToChange.trim(),
        }
      );

      const updatedBlog = response.data.blog as IBlogDetail;
      setBlog(updatedBlog);
      setSelectedText("");
      setHowToChange("");
      
      if (isPublished) {
        showSuccess("Content updated! The post has been unpublished and is now a draft. Republish when ready.");
      } else {
        showSuccess("Content updated successfully!");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        "Failed to update content. Please try again.";
      const technicalDetails = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;
      showError(errorMsg, technicalDetails);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Tags
  const handleUpdateTags = async () => {
    setTagsLoading(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/blogs/update-tags`,
        {
          blog_id: blog._id,
          tags: selectedTags,
        }
      );

      setBlog(response.data.blog);
      showSuccess("Tags updated successfully!");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        "Failed to update tags. Please try again.";
      showError(errorMsg);
    } finally {
      setTagsLoading(false);
    }
  };

  // Publish
  const handlePublishClick = () => {
    setShowPublishConfirm(true);
  };

  const handlePublishConfirm = async () => {
    setShowPublishConfirm(false);
    setPublishLoading(true);

    try {
      await axios.patch(`${API_BASE_URL}/blogs/update-blogStatus`, {
        blog_id: blog._id,
        status: "published",
      });

      showSuccess("Post published successfully! Redirecting...", 2000);
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to publish post.";
      const technicalDetails = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message;
      showError(errorMsg, technicalDetails);
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <ConfirmDialog
        open={showPublishConfirm}
        title="Publish Post"
        message={`Publish "${blog.prompt}" to the public feed?`}
        confirmText="Publish"
        onConfirm={handlePublishConfirm}
        onCancel={() => setShowPublishConfirm(false)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Draft Content */}
        <div className="lg:col-span-2">
          {isPublished && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This post is currently published. Editing it will unpublish it and create a draft. You'll need to republish after making changes.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {isPublished ? "Post Content" : "Draft Content"}
              </h2>
              <p className="text-sm text-gray-600">
                Select text to edit it with AI assistance
              </p>
            </div>
            <div className="p-6">
              <div
                className={`bg-gray-50 p-6 border border-gray-200 rounded-xl text-sm leading-relaxed transition-opacity duration-300 select-text markdown-content ${
                  isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
                onMouseUp={handleTextSelection}
              >
                {blog.aiResult ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-gray-300">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="border-b border-gray-200">{children}</tr>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-300">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2 text-sm text-gray-700 border border-gray-300">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {blog.aiResult}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic">No content available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Edit Panel */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
          {/* Targeted Edit Form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Targeted AI Edit
            </h3>
            <form onSubmit={handleTargetedEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Selected Text
                </label>
                <div className="p-3 border border-dashed border-yellow-300 rounded-lg bg-yellow-50 min-h-[60px] max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-800 break-words">
                    {selectedText || (
                      <span className="text-gray-500 italic">
                        Highlight text in the draft to select it
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="how"
                  className="block text-xs font-medium text-gray-600 mb-1.5"
                >
                  Edit Instruction
                </label>
                <textarea
                  id="how"
                  value={howToChange}
                  onChange={(e) => setHowToChange(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="E.g., Make this paragraph more concise and professional..."
                  disabled={isLoading || !selectedText}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedText || !howToChange.trim()}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                  isLoading || !selectedText || !howToChange.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Processing...
                  </span>
                ) : (
                  "Apply Edit"
                )}
              </button>
            </form>
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Tags
            </h3>
            <div className="space-y-4">
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
                <p className="text-xs text-gray-500">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
                </p>
              )}
              <button
                onClick={handleUpdateTags}
                disabled={tagsLoading}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                  tagsLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {tagsLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Updating...
                  </span>
                ) : (
                  "Update Tags"
                )}
              </button>
            </div>
          </div>

          {/* Revision History Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <RevisionHistory blogId={blog._id} />
          </div>

          {/* Publish/Republish Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {isPublished ? "Republish" : "Publish"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isPublished
                ? "This post is currently published. After editing, republish to make changes visible."
                : "Make this draft visible to everyone on the public feed."}
            </p>
            {!isPublished && (
              <button
                onClick={handlePublishClick}
                disabled={publishLoading}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 ${
                  publishLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {publishLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Publishing...
                  </span>
                ) : (
                  "Publish to Feed"
                )}
              </button>
            )}
            {isPublished && (
              <p className="text-xs text-gray-500 italic">
                Edit the content above, then republish when ready.
              </p>
            )}
            <Link
              href="/profile"
              className="mt-4 block text-center text-sm text-gray-600 hover:text-indigo-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
            >
              ← Back to Profile
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
