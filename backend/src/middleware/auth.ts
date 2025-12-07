import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "admin" | "author";
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (e: any) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

export function requireRole(roles: ("admin" | "author")[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "insufficient permissions" });
    }

    next();
  };
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: "admin" | "author";
    };

    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (e: any) {
    next();
  }
}

