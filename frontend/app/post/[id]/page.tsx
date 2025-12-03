"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IBlogDetail } from "@/types/Blog";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MarkdownContent } from "@/app/components/MarkdownContent";

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

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<IBlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!API_BASE_URL) {
        setError("API URL not configured (.env.local missing)");
        setLoading(false);
        return;
      }

      if (!postId) {
        setError("Post ID is missing");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/blogs/get-by-id?blog_id=${postId}`
        );
        const fetchedPost = response.data as IBlogDetail;
        
        if (!fetchedPost || fetchedPost.status !== "published") {
          setError("Post not found or not published");
        } else {
          setPost(fetchedPost);
        }
      } catch (err: any) {
        setError(
          `Failed to fetch post: ${err.message}. (Is Backend running?)`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-lg border-2 border-red-200">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Post Not Found
          </h1>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            {error || "This post doesn't exist or has been removed."}
          </p>
          <Link
            href="/feed"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors"
      >
        ← Back to Feed
      </Link>

      <article className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <header className="px-6 sm:px-8 py-6 sm:py-8 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {getTitleFromMarkdown(post.aiResult || "") || post.prompt || "Untitled Post"}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
            <span>
              By <span className="font-medium">{post.author || "Anonymous"}</span>
            </span>
            <span>
              Published{" "}
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        <div className="px-6 sm:px-8 py-6 sm:py-8">
          <MarkdownContent
            markdown={(post.aiResult || "").replace(/^#\s+.+$/m, "").trim()}
            variant="full"
          />
        </div>
      </article>
    </div>
  );
}

