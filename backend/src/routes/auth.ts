import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import User from "../models/User.js";

const r = Router();

const registerSchema = z.object({
  email: z.string().email("invalid email format").trim().toLowerCase(),
  name: z.string().trim().min(1, "name is required"),
  password: z.string().min(6, "password must be at least 6 characters"),
  role: z.enum(["admin", "author"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "password is required"),
});

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

r.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, name, password, role } = parsed.data;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name,
      passwordHash,
      role: role || "author",
    });

    const payload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const options = { expiresIn: JWT_EXPIRES_IN } as SignOptions;
    const token = jwt.sign(payload, JWT_SECRET, options);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "registration failed",
    });
  }
});

r.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const payload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const options = { expiresIn: JWT_EXPIRES_IN } as SignOptions;
    const token = jwt.sign(payload, JWT_SECRET, options);

    return res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "login failed",
    });
  }
});

r.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "authentication required" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: "admin" | "author";
    };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "user not found" });
    }

    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (e: any) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
});

export default r;

