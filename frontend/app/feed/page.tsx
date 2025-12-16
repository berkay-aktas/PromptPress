"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IBlogDetail } from "@/types/Blog";
import { ITag } from "@/types/Tag";
import Link from "next/link";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { FeedSkeleton } from "@/app/components/LoadingSkeleton";

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

const PostCard = ({ post, onTagClick }: { post: IBlogDetail; onTagClick?: (tagId: string) => void }) => {
  const markdownContent = post.aiResult || "";
  const titleFromMarkdown = getTitleFromMarkdown(markdownContent);
  const title = titleFromMarkdown || post.prompt || "Untitled Post";
  const excerpt = getExcerptFromMarkdown(markdownContent, 200);

  const handleTagClick = (e: React.MouseEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(tagId);
    }
  };

  return (
    <Link
      href={`/post/${post._id}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 block overflow-hidden group h-full flex flex-col"
    >
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
          {title}
        </h2>
        
        {/* Excerpt */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3 flex-grow">
          {excerpt || "No content available."}
        </p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <button
                key={tag._id}
                onClick={(e) => handleTagClick(e, tag._id)}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                title={`Filter by ${tag.name}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        
        {/* Footer: Author + Read Full */}
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            By{" "}
            {post.authorId || post.author ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/author/${post.authorId || post.author}`;
                }}
                className="text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {post.author || "Anonymous"}
              </button>
            ) : (
              <span className="text-gray-700">{post.author || "Anonymous"}</span>
            )}
          </span>
          <span className="text-xs text-indigo-600 font-medium group-hover:text-indigo-700 flex items-center gap-1">
            Read Full
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function FeedPage() {
  const [posts, setPosts] = useState<IBlogDetail[]>([]);
  const [tags, setTags] = useState<ITag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;
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

  useEffect(() => {
    const fetchTags = async () => {
      if (!API_BASE_URL) {
        setTagsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/tags/get-all`);
        setTags(response.data as ITag[]);
      } catch (err: any) {
        console.error("Failed to fetch tags:", err);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTags, sortOrder]);

  // Filter and sort posts
  const publishedPosts = posts.filter(
    (post) => post._id && post.status === "published"
  );

  const filtered = publishedPosts.filter((post) => {
    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      const markdownContent = post.aiResult || "";
      const titleFromMarkdown = getTitleFromMarkdown(markdownContent);
      const title = (titleFromMarkdown || post.prompt || "").toLowerCase();
      const excerpt = getExcerptFromMarkdown(markdownContent, 200).toLowerCase();
      if (!title.includes(searchLower) && !excerpt.includes(searchLower)) {
        return false;
      }
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const postTagIds = post.tags?.map((tag) => tag._id) || [];
      const hasSelectedTag = selectedTags.some((tagId) => postTagIds.includes(tagId));
      if (!hasSelectedTag) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt).getTime();
    return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = sorted.slice(startIndex, endIndex);

  const isSearchActive = search.trim().length > 0;
  const hasActiveFilters = isSearchActive || selectedTags.length > 0;

  const handleTagClick = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedTags([]);
  };

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Public Feed
          </h1>
          <p className="text-[var(--text-secondary)] text-base">
            Discover published articles from our community
          </p>
        </div>

        {/* Search and Sort Controls */}
        {!loading && !error && publishedPosts.length > 0 && (
          <div className="mb-10 bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              {/* Search Input */}
              <div className="flex-1">
                <label htmlFor="search" className="block text-xs font-medium text-gray-600 mb-1.5">
                  Search posts
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or content..."
                    className="w-full px-4 py-2.5 pl-9 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 bg-white text-sm"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="sm:w-48">
                <label htmlFor="sort" className="block text-xs font-medium text-gray-600 mb-1.5">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 bg-white cursor-pointer text-sm"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Tag Filters */}
            {!tagsLoading && tags.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-600 mb-3">
                  Filter by tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag._id);
                    return (
                      <button
                        key={tag._id}
                        onClick={() => handleTagClick(tag._id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                        }`}
                      >
                        {tag.name}
                        {tag.usageCount !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isSelected ? "bg-indigo-700" : "bg-gray-200 text-gray-600"
                          }`}>
                            {tag.usageCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-medium text-gray-900">{sorted.length}</span> of{" "}
                    <span className="font-medium text-gray-900">{publishedPosts.length}</span> posts
                  </span>
                  {selectedTags.length > 0 && (
                    <span className="text-xs text-gray-500">
                      ({selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""} selected)
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Feed
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No published posts yet
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
              Be the first to publish! Create a draft and share it with the community.
            </p>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            >
              Create Your First Post
            </Link>
          </div>
        ) : sorted.length === 0 && hasActiveFilters ? (
          /* No Search Results */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No posts found
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
              {isSearchActive && selectedTags.length > 0
                ? `No posts match your search "${search}" and selected tags.`
                : isSearchActive
                ? `No posts match your search "${search}".`
                : "No posts match the selected tags."}
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedPosts.map((post) => (
                <PostCard key={post._id} post={post} onTagClick={handleTagClick} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mb-16">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      if (!showPage) {
                        // Show ellipsis
                        const prevPage = page - 1;
                        const nextPage = page + 1;
                        if (
                          (prevPage === 1 || prevPage === currentPage - 2) &&
                          (nextPage === totalPages || nextPage === currentPage + 2)
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-400 text-sm">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            currentPage === page
                              ? "bg-indigo-600 text-white"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  >
                    Next
                  </button>
                </div>

                {/* Pagination Info */}
                <div className="text-xs text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, sorted.length)} of {sorted.length} posts
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
