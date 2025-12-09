"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { IRevision } from "@/types/Revision";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RevisionHistoryProps {
  blogId: string;
}

export function RevisionHistory({ blogId }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<IRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchRevisions();
    }
  }, [expanded, blogId]);

  async function fetchRevisions() {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/revisions/get-by-blog?blog_id=${blogId}`
      );
      setRevisions(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch revisions:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-2 px-4 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
      >
        View Edit History
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Edit History</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1 transition-colors"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600 text-sm">Loading history...</p>
        </div>
      ) : revisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-600 text-sm">No edit history yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Edits made to this draft will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {revisions.map((revision, index) => (
            <div
              key={revision._id}
              className="border-l-4 border-indigo-500 pl-4 py-3 bg-gray-50 rounded-r"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-600">
                      Edit #{revisions.length - index}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(revision.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {revision.user && (
                      <span className="text-xs text-gray-500">
                        by {revision.user.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    What was changed:
                  </p>
                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                    {revision.what}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    How it was changed:
                  </p>
                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                    {revision.how}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

