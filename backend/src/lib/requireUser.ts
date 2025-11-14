import { Request } from "express";
import { supabaseService } from "./supabase";

export async function getUserFromRequest(req: Request) {
  const auth = req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { user: null, error: "Missing Bearer token" } as const;

  const { data, error } = await supabaseService.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: error?.message || "Invalid token" } as const;
  }
  return { user: data.user, error: null } as const;
}