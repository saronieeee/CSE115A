// backend/src/lib/requireUser.ts

import type { Request, Response, NextFunction } from "express";
import { supabaseService } from "./supabase";

/**
 * Extract user from Authorization header
 */
export async function getUserFromRequest(req: Request) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }

  const token = auth.replace("Bearer ", "").trim();

  // Validate JWT using Supabase Admin API
  const { data, error } = await supabaseService.auth.getUser(token);

  if (error || !data?.user) {
    return { user: null, error: error?.message || "Invalid token" };
  }

  return { user: data.user, error: null };
}

/**
 * Middleware to require an authenticated user.
 * If valid, attaches req.user = supabaseUser
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const { user, error } = await getUserFromRequest(req);

  if (error || !user) {
    return res.status(401).json({ error: error || "Unauthorized" });
  }

  // attach authenticated user to request
  (req as any).user = user;

  next();
}
