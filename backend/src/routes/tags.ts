import { Router } from "express";
import { z } from "zod";
import Tag from "../models/Tag.js";
import Blog from "../models/Blog.js";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth.js";

const r = Router();

const createSchema = z.object({
  name: z.string().trim().min(1, "tag name is required").max(50, "tag name too long"),
});

const updateSchema = z.object({
  tag_id: z.string().min(1, "tag_id required"),
  name: z.string().trim().min(1, "tag name is required").max(50, "tag name too long"),
});

const deleteQuery = z.object({
  tag_id: z.string().min(1, "tag_id required"),
});

// Create tag (admin only)
r.post("/create", authenticate, requireRole(["admin"]), async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name } = parsed.data;

  try {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existingTag = await Tag.findOne({ $or: [{ name }, { slug }] });
    if (existingTag) {
      return res.status(409).json({ error: "tag with this name already exists" });
    }

    const tag = await Tag.create({ name, slug });
    return res.status(201).json(tag);
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(409).json({ error: "tag with this name or slug already exists" });
    }
    return res.status(500).json({
      error: e?.message || "failed to create tag",
    });
  }
});

// Get all tags
r.get("/get-all", async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 }).lean();
    
    // Get usage count for each tag
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const count = await Blog.countDocuments({ tags: tag._id });
        return { ...tag, usageCount: count };
      })
    );

    return res.json(tagsWithCount);
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to fetch tags",
    });
  }
});

// Update tag (admin only)
r.patch("/update", authenticate, requireRole(["admin"]), async (req: AuthRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { tag_id, name } = parsed.data;

  try {
    const tag = await Tag.findById(tag_id);
    if (!tag) {
      return res.status(404).json({ error: "tag not found" });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existingTag = await Tag.findOne({
      $or: [{ name }, { slug }],
      _id: { $ne: tag_id },
    });
    if (existingTag) {
      return res.status(409).json({ error: "tag with this name already exists" });
    }

    tag.name = name;
    tag.slug = slug;
    await tag.save();

    return res.json({ ok: true, tag });
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(409).json({ error: "tag with this name or slug already exists" });
    }
    return res.status(500).json({
      error: e?.message || "failed to update tag",
    });
  }
});

// Delete tag (admin only)
r.delete("/delete", authenticate, requireRole(["admin"]), async (req: AuthRequest, res) => {
  const parsed = deleteQuery.safeParse({ tag_id: String(req.query.tag_id || "") });
  if (!parsed.success) return res.status(400).json({ error: "tag_id required" });

  try {
    const tag = await Tag.findById(parsed.data.tag_id);
    if (!tag) {
      return res.status(404).json({ error: "tag not found" });
    }

    // Remove tag from all blogs
    await Blog.updateMany(
      { tags: parsed.data.tag_id },
      { $pull: { tags: parsed.data.tag_id } }
    );

    await Tag.findByIdAndDelete(parsed.data.tag_id);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "failed to delete tag",
    });
  }
});

export default r;

