import { Router } from "express";
import { z } from "zod";
import Blog from "../models/Blog.js";
import { generateBlog, updateBlog } from "../services/ai.js";
const r = Router();
const createSchema = z.object({
    prompt: z.string().trim().min(3, "prompt must be at least 3 characters"),
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
r.post("/create", async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const doc = await Blog.create({
        prompt: parsed.data.prompt,
        status: "pending",
        aiResult: "",
        errorMessage: null,
        publishedAt: null,
    });
    try {
        const aiOut = await generateBlog(parsed.data.prompt);
        const aiResult = typeof aiOut === "string" ? aiOut : JSON.stringify(aiOut);
        doc.aiResult = aiResult;
        doc.status = "created";
        doc.errorMessage = null;
        await doc.save();
        return res.status(201).json(doc);
    }
    catch (e) {
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
    const items = await Blog.find().sort({ createdAt: -1 }).lean();
    res.json(items);
});
r.get("/get-by-id", async (req, res) => {
    const parsed = getByIdQuery.safeParse({ blog_id: String(req.query.blog_id || "") });
    if (!parsed.success)
        return res.status(400).json({ error: "blog_id required" });
    const blog = await Blog.findById(parsed.data.blog_id);
    if (!blog)
        return res.status(404).json({ error: "not found" });
    res.json(blog);
});
r.get("/get-allPublished", async (req, res) => {
    const items = await Blog.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).lean();
    res.json(items);
});
r.delete("/delete", async (req, res) => {
    const parsed = getByIdQuery.safeParse({ blog_id: String(req.query.blog_id || "") });
    if (!parsed.success)
        return res.status(400).json({ error: "blog_id required" });
    const deleted = await Blog.findByIdAndDelete(parsed.data.blog_id);
    if (!deleted)
        return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
});
r.patch("/update-blogStatus", async (req, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const blog = await Blog.findById(parsed.data.blog_id);
    if (!blog)
        return res.status(404).json({ error: "not found" });
    blog.status = parsed.data.status;
    if (parsed.data.status === "published") {
        blog.publishedAt = blog.publishedAt || new Date();
    }
    await blog.save();
    res.json({ ok: true, blog });
});
r.patch("/update-blogContent", async (req, res) => {
    const parsed = updateAIContentSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const blog = await Blog.findById(parsed.data.blog_id);
    if (!blog)
        return res.status(404).json({ error: "not found" });
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
    }
    catch (e) {
        if (e?.code === "TARGET_NOT_FOUND" || String(e?.message).includes("TARGET_NOT_FOUND")) {
            return res.status(422).json({
                error: 'Target not found. Pass the EXACT sentence or use: starts with "..." ends with "..."',
            });
        }
        blog.status = "error";
        blog.errorMessage = e?.message ?? "AI update failed";
        await blog.save();
        return res.status(500).json({ error: blog.errorMessage });
    }
});
export default r;
