"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IBlogDetail } from "@/types/Blog";
import Link from "next/link";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper: Extract title from markdown (first H1 heading)
function getTitleFromMarkdown(markdown: string): string | null {
  if (!markdown) return null;
  
  // Match lines like: "# The Title Here" or "#The Title Here"
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }
  
  return null;
}

// Helper: Extract plain text excerpt from markdown (skips H1 heading and tables)
function getExcerptFromMarkdown(markdown: string, maxChars = 200): string {
  if (!markdown) return "";
  
  // Remove the first H1 heading if present (to avoid repeating the title)
  let content = markdown.replace(/^#\s+.+$/m, "").trim();
  
  // Drop table rows (lines starting with |)
  content = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("|"))
    .join("\n");
  
  // Remove markdown formatting:
  // - Headings (# ## ### etc.)
  // - Bold/italic (** * _)
  // - Links [text](url) -> text
  // - Code blocks and inline code
  // - Lists (* - +)
  // - Table separators (|---|---|)
  let plainText = content
    .replace(/^#{1,6}\s+/gm, "") // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold **text**
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic *text*
    .replace(/_([^_]+)_/g, "$1") // Remove italic _text_
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert links [text](url) -> text
    .replace(/`([^`]+)`/g, "$1") // Remove inline code `code`
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered list markers
    .replace(/^---+\s*$/gm, "") // Remove horizontal rules
    .replace(/^\|.+\|\s*$/gm, "") // Remove any remaining table-related lines
    .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
    .trim();
  
  // Truncate to maxChars
  if (plainText.length > maxChars) {
    // Try to break at sentence end
    const truncated = plainText.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf(".");
    const lastNewline = truncated.lastIndexOf("\n");
    const breakPoint = Math.max(lastPeriod, lastNewline);
    
    if (breakPoint > maxChars * 0.7) {
      return truncated.substring(0, breakPoint + 1).trim() + "...";
    }
    return truncated.trim() + "...";
  }
  
  return plainText;
}

const PostCard = ({ post }: { post: IBlogDetail }) => {
  const markdownContent = post.aiResult || "";
  const titleFromMarkdown = getTitleFromMarkdown(markdownContent);
  const title = titleFromMarkdown || post.prompt || "Untitled Post";
  const excerpt = getExcerptFromMarkdown(markdownContent, 200);

  return (
    <Link
      href={`/post/${post._id}`}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 block overflow-hidden group"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
          {title}
        </h2>
        <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-3">
          {excerpt || "No content available."}
        </p>
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-4">
          <div className="flex flex-wrap gap-2">
            {post.tags && post.tags.length > 0 ? (
              post.tags.map((tag) => (
                <span
                  key={tag._id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag.name}
                </span>
              ))
            ) : null}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              By {post.author || "Anonymous"}
            </span>
            <span className="text-sm text-indigo-600 font-medium group-hover:text-indigo-700 flex items-center gap-1">
              Read Full
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function FeedPage() {
  const [posts, setPosts] = useState<IBlogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const { notifications, dismissNotification, showError } = useNotifications();

  useEffect(() => {
    const fetchPublishedPosts = async () => {
      if (!API_BASE_URL) {
        setError("API URL not configured");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/blogs/get-allPublished`
        );
        setPosts(response.data as IBlogDetail[]);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch posts";
        setError(errorMessage);
        showError(
          "Unable to load published posts. Please check your connection.",
          errorMessage
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedPosts();
  }, [showError]);

  // Filter and sort posts
  const publishedPosts = posts.filter(
    (post) => post._id && post.status === "published"
  );

  const filtered = publishedPosts.filter((post) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    const markdownContent = post.aiResult || "";
    const titleFromMarkdown = getTitleFromMarkdown(markdownContent);
    const title = (titleFromMarkdown || post.prompt || "").toLowerCase();
    const excerpt = getExcerptFromMarkdown(markdownContent, 200).toLowerCase();
    return title.includes(searchLower) || excerpt.includes(searchLower);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt).getTime();
    return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
  });

  const isSearchActive = search.trim().length > 0;

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Public Feed
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Discover published articles from our community
          </p>
        </div>

        {/* Search and Sort Controls */}
        {!loading && !error && publishedPosts.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 w-full sm:max-w-md">
              <label htmlFor="search" className="sr-only">
                Search posts
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or content..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              {isSearchActive && (
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Showing {sorted.length} of {publishedPosts.length} posts
                </span>
              )}
              <label htmlFor="sort" className="sr-only">
                Sort order
              </label>
              <select
                id="sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                className="px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 bg-white cursor-pointer"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading published posts...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-red-200">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Unable to Load Feed
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              No published posts yet
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Be the first to publish! Create a draft and share it with the community.
            </p>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Create Your First Post
            </Link>
          </div>
        ) : sorted.length === 0 && isSearchActive ? (
          /* No Search Results */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              No posts found
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              No posts match your search "{search}". Try a different search term.
            </p>
            <button
              onClick={() => setSearch("")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
