"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IBlogDetail } from "@/types/Blog";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PostCardSkeleton } from "@/app/components/LoadingSkeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper: Extract title from markdown (first H1 heading)
function getTitleFromMarkdown(markdown: string): string | null {
  if (!markdown) return null;
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }
  return null;
}

// Helper: Extract plain text excerpt from markdown
function getExcerptFromMarkdown(markdown: string, maxChars = 200): string {
  if (!markdown) return "";
  let content = markdown.replace(/^#\s+.+$/m, "").trim();
  content = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("|"))
    .join("\n");
  let plainText = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^---+\s*$/gm, "")
    .replace(/^\|.+\|\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (plainText.length > maxChars) {
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

interface AuthorInfo {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AuthorPage() {
  const params = useParams();
  const authorId = params.id as string;
  const [author, setAuthor] = useState<AuthorInfo | null>(null);
  const [posts, setPosts] = useState<IBlogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!API_BASE_URL) {
        setError("API URL not configured");
        setLoading(false);
        return;
      }

      if (!authorId) {
        setError("Author ID is missing");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/blogs/get-by-author?author_id=${authorId}`
        );
        setAuthor(response.data.user);
        setPosts(response.data.posts || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch author data");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Author Not Found
          </h1>
          <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
            {error || "This author doesn't exist."}
          </p>
          <Link
            href="/feed"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
          >
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 font-medium mb-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
      >
        ← Back to Feed
      </Link>

      {/* Author Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {author.name}
            </h1>
            <p className="text-gray-600 mb-4 text-sm">
              {author.role === "admin" ? "Administrator" : "Author"}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
              <span>
                Joined {new Date(author.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            No published posts yet
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
            This author hasn't published any posts yet.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Published Posts ({posts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const markdownContent = post.aiResult || "";
              const titleFromMarkdown = getTitleFromMarkdown(markdownContent);
              const title = titleFromMarkdown || post.prompt || "Untitled Post";
              const excerpt = getExcerptFromMarkdown(markdownContent, 200);

              return (
                <Link
                  key={post._id}
                  href={`/post/${post._id}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 block overflow-hidden group h-full flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3 flex-grow">
                      {excerpt || "No content available."}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <span
                            key={tag._id}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-indigo-600 font-medium group-hover:text-indigo-700 flex items-center gap-1">
                        Read Full
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

