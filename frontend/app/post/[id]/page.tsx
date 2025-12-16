"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IBlogDetail } from "@/types/Blog";
import { IComment } from "@/types/Comment";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { CommentForm } from "@/app/components/CommentForm";
import { CommentList } from "@/app/components/CommentList";
import { PostDetailSkeleton } from "@/app/components/LoadingSkeleton";

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
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
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

  useEffect(() => {
    const fetchComments = async () => {
      if (!postId || !post) return;

      setCommentsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/comments/get-by-blog?blog_id=${postId}`
        );
        setComments(response.data as IComment[]);
      } catch (err: any) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (post) {
      fetchComments();
    }
  }, [postId, post]);

  const handleCommentAdded = () => {
    // Refetch comments after adding a new one
    const fetchComments = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/comments/get-by-blog?blog_id=${postId}`
        );
        setComments(response.data as IComment[]);
      } catch (err: any) {
        console.error("Failed to fetch comments:", err);
      }
    };
    fetchComments();
  };

  if (loading) {
    return <PostDetailSkeleton />;
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

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = getTitleFromMarkdown(post.aiResult || "") || post.prompt || "Untitled Post";

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    
    let shareLink = "";
    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 font-medium mb-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
      >
        ← Back to Feed
      </Link>

      <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors overflow-hidden">
        <header className="px-6 sm:px-8 py-8 sm:py-10 border-b border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5 leading-tight">
            {getTitleFromMarkdown(post.aiResult || "") || post.prompt || "Untitled Post"}
          </h1>
          <div className="flex flex-col gap-4">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
              <span>
                By <Link href={`/author/${post.authorId || post.author}`} className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">{post.author || "Anonymous"}</Link>
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
            {/* Share Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500">Share:</span>
              <button
                onClick={() => handleShare("twitter")}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                title="Share on Twitter"
              >
                Twitter
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                title="Share on Facebook"
              >
                Facebook
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                title="Share on LinkedIn"
              >
                LinkedIn
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                title="Copy link"
              >
                Copy Link
              </button>
            </div>
          </div>
        </header>

        <div className="px-6 sm:px-8 py-8 sm:py-10">
          <MarkdownContent
            markdown={(post.aiResult || "").replace(/^#\s+.+$/m, "").trim()}
            variant="full"
          />
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-8 space-y-6">
        <CommentForm blogId={postId} onCommentAdded={handleCommentAdded} />

        {commentsLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600 text-sm">Loading comments...</p>
          </div>
        ) : (
          <CommentList comments={comments} onCommentDeleted={handleCommentAdded} />
        )}
      </div>
    </div>
  );
}

