"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ITag } from "@/types/Tag";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  useNotifications,
  NotificationContainer,
} from "@/app/components/Notification";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function TagManagement() {
  const [tags, setTags] = useState<ITag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<ITag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const { token } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError } =
    useNotifications();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchAllTags();
  }, []);

  async function fetchAllTags() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tags/get-all`);
      setTags(response.data || []);
    } catch (err: any) {
      showError(
        "Failed to load tags. Please check your connection.",
        err.response?.data?.error || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      showError("Tag name cannot be empty.");
      return;
    }

    setIsCreating(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${API_BASE_URL}/tags/create`,
        { name: newTagName.trim() },
        { headers }
      );

      setTags((prev) => [...prev, response.data]);
      setNewTagName("");
      showSuccess("Tag created successfully.");
    } catch (err: any) {
      showError(
        "Failed to create tag. Please try again.",
        err.response?.data?.error || err.message
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (tag: ITag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditTagName("");
  };

  const handleUpdate = async (tagId: string) => {
    if (!editTagName.trim()) {
      showError("Tag name cannot be empty.");
      return;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.patch(
        `${API_BASE_URL}/tags/update`,
        {
          tag_id: tagId,
          name: editTagName.trim(),
        },
        { headers }
      );

      setTags((prev) =>
        prev.map((t) => (t._id === tagId ? response.data.tag : t))
      );
      setEditingTag(null);
      setEditTagName("");
      showSuccess("Tag updated successfully.");
    } catch (err: any) {
      showError(
        "Failed to update tag. Please try again.",
        err.response?.data?.error || err.message
      );
    }
  };

  const handleDelete = (tag: ITag) => {
    setConfirmDialog({
      open: true,
      title: "Delete Tag",
      message: `Are you sure you want to delete the tag "${tag.name}"? This will remove it from all posts. This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          await axios.delete(`${API_BASE_URL}/tags/delete`, {
            params: { tag_id: tag._id },
            headers,
          });

          setTags((prev) => prev.filter((t) => t._id !== tag._id));
          showSuccess("Tag deleted successfully.");
        } catch (err: any) {
          showError(
            "Failed to delete tag. Please try again.",
            err.response?.data?.error || err.message
          );
        }
      },
    });
  };

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Tag Management
              </h2>
              <p className="text-sm text-gray-600">
                Create and manage tags for organizing blog posts
              </p>
            </div>
          </div>
        </div>

        {/* Create Tag Form */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 placeholder-gray-400"
              maxLength={50}
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newTagName.trim()}
              className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                isCreating || !newTagName.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isCreating ? "Creating..." : "Create Tag"}
            </button>
          </form>
        </div>

        {/* Tags List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600 text-sm">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-2">🏷️</div>
            <p className="text-gray-600 text-sm">No tags yet. Create your first tag above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tags.map((tag) => (
              <div
                key={tag._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                {editingTag?._id === tag._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900"
                      maxLength={50}
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(tag._id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {tag.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Used in {tag.usageCount || 0} post{tag.usageCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(tag.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStartEdit(tag)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

