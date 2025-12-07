import { Router } from "express";
import { z } from "zod";
import Blog from "../models/Blog.js";
import Tag from "../models/Tag.js";
import { generateBlog, updateBlog } from "../services/ai.js";
import { AuthRequest, optionalAuth } from "../middleware/auth.js";
import { Types } from "mongoose";

const r = Router();

const createSchema = z.object({
    prompt: z.string().trim().min(3, "prompt must be at least 3 characters"),
    author: z.string().trim().min(1).optional(),
    tags: z.array(z.string()).optional(),
  });
  
  const getByIdQuery = z.object({
    blog_id: z.string().min(1, "blog_id required"),
  });
  
  const updateStatusSchema = z.object({
    blog_id: z.string().min(1),
    status: z.enum(["pending", "created", "published", "error"]),
  });

  const updateContentSchema = z.object({
    blog_id: z.string().min(1),
    full: z.string().min(1, "full content required"),
  });

  const updateAIContentSchema = z.object({
    blog_id: z.string().min(1),
    what: z.string().min(3, "please describe what part to change"),
    how: z.string().min(3, "please describe how it should change"),
  });

  const updateTagsSchema = z.object({
    blog_id: z.string().min(1),
    tags: z.array(z.string()),
  });


r.post("/create", optionalAuth, async (req: AuthRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  
    const { prompt, author, tags } = parsed.data;
    
    // Validate and convert tag IDs
    let tagIds: Types.ObjectId[] = [];
    if (tags && tags.length > 0) {
      const validTags = await Tag.find({ _id: { $in: tags } });
      tagIds = validTags.map((tag) => tag._id);
    }
    
    const doc = await Blog.create({
      prompt: parsed.data.prompt,
      status: "pending",
      aiResult: "",
      errorMessage: null,
      publishedAt: null,
      author: author ?? (req.user ? undefined : null),
      authorId: req.user ? new Types.ObjectId(req.user.userId) : null,
      tags: tagIds,
    });
  
    try {
      const aiOut = await generateBlog(parsed.data.prompt);
      const aiResult = typeof aiOut === "string" ? aiOut : JSON.stringify(aiOut);
  
      doc.aiResult = aiResult;
      doc.status = "created";
      doc.errorMessage = null;
      await doc.save();
  
      return res.status(201).json(doc);
    } catch (e: any) {
      doc.status = "error";
      doc.errorMessage = e?.message ?? "AI generation failed";
      await doc.save();
  
      return res.status(500).json({
        error: doc.errorMessage,
        blogId: String(doc._id),
      });
    }
});

r.get("/get-all", async (req, res) => {
    const items = await Blog.find().populate("tags", "name slug").sort({ createdAt: -1 }).lean();
    res.json(items);
});

r.get("/get-by-id", async (req, res) => {
    const parsed = getByIdQuery.safeParse({ blog_id: String(req.query.blog_id || "") });
    if (!parsed.success) return res.status(400).json({ error: "blog_id required" });

    const blog = await Blog.findById(parsed.data.blog_id).populate("tags", "name slug").lean();
    if (!blog) return res.status(404).json({ error: "not found" });

    res.json(blog);
});

r.get("/get-allPublished", async (req, res) => {
    const items = await Blog.find({ status: "published" })
      .populate("tags", "name slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    res.json(items);
});

r.delete("/delete", async (req, res) => {
    const parsed = getByIdQuery.safeParse({ blog_id: String(req.query.blog_id || "") });
    if (!parsed.success) return res.status(400).json({ error: "blog_id required" });
  
    const deleted = await Blog.findByIdAndDelete(parsed.data.blog_id);
    if (!deleted) return res.status(404).json({ error: "not found" });
  
    res.json({ ok: true });
});

r.patch("/update-blogStatus", async (req, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  
    const blog = await Blog.findById(parsed.data.blog_id);
    if (!blog) return res.status(404).json({ error: "not found" });
  
    blog.status = parsed.data.status;
    if (parsed.data.status === "published") {
      blog.publishedAt = blog.publishedAt || new Date();
    }
  
    await blog.save();
    res.json({ ok: true, blog });
});

r.patch("/update-blogContent", async (req, res) => {
  const parsed = updateAIContentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const blog = await Blog.findById(parsed.data.blog_id);
  if (!blog) return res.status(404).json({ error: "not found" });

  const previousStatus = blog.status;
  if (blog.status === "published") {
    blog.status = "pending";
    blog.errorMessage = null;
    await blog.save();
  }

  try {
    const updated = await updateBlog({
      current: blog.aiResult ?? "",
      what: parsed.data.what,
      how: parsed.data.how,
    });

    blog.aiResult = updated;
    blog.status = "created";
    blog.errorMessage = null;
    await blog.save();

    return res.json({ ok: true, previousStatus, blog });
  } catch (e: any) {
    if (e?.code === "TARGET_NOT_FOUND" || String(e?.message).includes("TARGET_NOT_FOUND")) {
      return res.status(422).json({
        error:
          'Target not found. Pass the EXACT sentence or use: starts with "..." ends with "..."',
      });
    }

    blog.status = "error";
    blog.errorMessage = e?.message ?? "AI update failed";
    await blog.save();

    return res.status(500).json({ error: blog.errorMessage });
  }
});

// Update blog tags
r.patch("/update-tags", async (req, res) => {
  const parsed = updateTagsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const blog = await Blog.findById(parsed.data.blog_id);
  if (!blog) return res.status(404).json({ error: "not found" });

  // Validate and convert tag IDs
  let tagIds: Types.ObjectId[] = [];
  if (parsed.data.tags && parsed.data.tags.length > 0) {
    const validTags = await Tag.find({ _id: { $in: parsed.data.tags } });
    tagIds = validTags.map((tag) => tag._id);
  }

  blog.tags = tagIds;
  await blog.save();

  const populated = await Blog.findById(blog._id).populate("tags", "name slug").lean();
  res.json({ ok: true, blog: populated });
});


export default r;