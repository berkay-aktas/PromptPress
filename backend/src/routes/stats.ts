import { Router } from "express";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Tag from "../models/Tag.js";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth.js";

const r = Router();

// Get overview statistics (admin only)
r.get("/overview", authenticate, requireRole(["admin"]), async (req: AuthRequest, res) => {
  try {
    // Get counts for each status
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      pendingPosts,
      errorPosts,
      totalComments,
      visibleComments,
      hiddenComments,
      totalUsers,
      adminUsers,
      authorUsers,
      totalTags,
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "created" }),
      Blog.countDocuments({ status: "pending" }),
      Blog.countDocuments({ status: "error" }),
      Comment.countDocuments(),
      Comment.countDocuments({ status: "visible" }),
      Comment.countDocuments({ status: "hidden" }),
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "author" }),
      Tag.countDocuments(),
    ]);

    // Get posts by status breakdown
    const postsByStatus = {
      published: publishedPosts,
      created: draftPosts,
      pending: pendingPosts,
      error: errorPosts,
    };

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentPosts,
      recentComments,
      recentUsers,
    ] = await Promise.all([
      Blog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Comment.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return res.json({
      posts: {
        total: totalPosts,
        published: publishedPosts,
        drafts: draftPosts,
        pending: pendingPosts,
        error: errorPosts,
        byStatus: postsByStatus,
        recent: recentPosts,
      },
      comments: {
        total: totalComments,
        visible: visibleComments,
        hidden: hiddenComments,
        recent: recentComments,
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        authors: authorUsers,
        recent: recentUsers,
      },
      tags: {
        total: totalTags,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to fetch statistics",
    });
  }
});

export default r;

