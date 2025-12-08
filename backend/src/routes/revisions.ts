import { Router } from "express";
import { z } from "zod";
import Revision from "../models/Revision.js";
import Blog from "../models/Blog.js";
import { AuthRequest, optionalAuth } from "../middleware/auth.js";

const r = Router();

const getByBlogQuery = z.object({
  blog_id: z.string().min(1, "blog_id required"),
});

// Get all revisions for a blog
r.get("/get-by-blog", async (req, res) => {
  const parsed = getByBlogQuery.safeParse({ blog_id: String(req.query.blog_id || "") });
  if (!parsed.success) return res.status(400).json({ error: "blog_id required" });

  try {
    const blog = await Blog.findById(parsed.data.blog_id);
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    const revisions = await Revision.find({ blog: parsed.data.blog_id })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(revisions);
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to fetch revisions",
    });
  }
});

export default r;

