import { Router } from "express";
import { z } from "zod";
import Comment from "../models/Comment.js";
import Blog from "../models/Blog.js";
import { AuthRequest, optionalAuth, authenticate } from "../middleware/auth.js";
import { Types } from "mongoose";

const r = Router();

const createSchema = z.object({
  blog_id: z.string().min(1, "blog_id required"),
  text: z.string().trim().min(1, "comment text is required"),
});

const getByBlogQuery = z.object({
  blog_id: z.string().min(1, "blog_id required"),
});

const updateStatusSchema = z.object({
  comment_id: z.string().min(1, "comment_id required"),
  status: z.enum(["visible", "hidden"]),
});

const deleteQuery = z.object({
  comment_id: z.string().min(1, "comment_id required"),
});

r.post("/create", optionalAuth, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { blog_id, text } = parsed.data;

  try {
    const blog = await Blog.findById(blog_id);
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    if (blog.status !== "published") {
      return res.status(400).json({ error: "can only comment on published posts" });
    }

    const comment = await Comment.create({
      blog: new Types.ObjectId(blog_id),
      user: req.user ? new Types.ObjectId(req.user.userId) : null,
      text: text.trim(),
      status: "visible",
    });

    const populated = await Comment.findById(comment._id)
      .populate("user", "name email")
      .lean();

    return res.status(201).json(populated);
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to create comment",
    });
  }
});

r.get("/get-by-blog", async (req, res) => {
  const parsed = getByBlogQuery.safeParse({ blog_id: String(req.query.blog_id || "") });
  if (!parsed.success) return res.status(400).json({ error: "blog_id required" });

  try {
    const blog = await Blog.findById(parsed.data.blog_id);
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    const comments = await Comment.find({
      blog: parsed.data.blog_id,
      status: "visible",
    })
      .populate("user", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return res.json(comments);
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to fetch comments",
    });
  }
});

r.get("/get-all", authenticate, async (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "admin access required" });
  }

  try {
    const comments = await Comment.find({})
      .populate("user", "name email")
      .populate("blog", "prompt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(comments);
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to fetch comments",
    });
  }
});

r.patch("/update-status", authenticate, async (req: AuthRequest, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "admin access required" });
  }

  try {
    const comment = await Comment.findById(parsed.data.comment_id);
    if (!comment) {
      return res.status(404).json({ error: "comment not found" });
    }

    comment.status = parsed.data.status;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate("user", "name email")
      .lean();

    return res.json({ ok: true, comment: populated });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to update comment status",
    });
  }
});

r.delete("/delete", optionalAuth, async (req: AuthRequest, res) => {
  const parsed = deleteQuery.safeParse({ comment_id: String(req.query.comment_id || "") });
  if (!parsed.success) return res.status(400).json({ error: "comment_id required" });

  try {
    const comment = await Comment.findById(parsed.data.comment_id);
    if (!comment) {
      return res.status(404).json({ error: "comment not found" });
    }

    // Allow deletion if: user is admin, or user owns the comment
    const canDelete =
      req.user &&
      (req.user.role === "admin" ||
        String(comment.user) === req.user.userId);

    if (!canDelete) {
      return res.status(403).json({ error: "insufficient permissions" });
    }

    await Comment.findByIdAndDelete(parsed.data.comment_id);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to delete comment",
    });
  }
});

export default r;

