import type { PostgrestError } from "@supabase/supabase-js";
import { supabaseService } from "./supabase";

const PROFILE_TABLES = ["users", "profiles"] as const;

export type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
};

type ProfileFetchResult = {
  row: ProfileRow | null;
  status: number;
  errorMessage?: string;
};

const isMissingTableError = (error?: PostgrestError | null) => {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST201" ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
};

export async function fetchProfileRow(userId: string): Promise<ProfileFetchResult> {
  for (const tableName of PROFILE_TABLES) {
    const { data, error } = await supabaseService
      .from(tableName)
      .select("id,email,full_name,avatar_url,bio")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        continue;
      }
      return { row: null, status: 500, errorMessage: error.message };
    }

    if (data) {
      return { row: data as ProfileRow, status: 200 };
    }
  }

  return { row: null, status: 404, errorMessage: "Profile not found" };
}

export async function insertProfileRow(record: { id: string; email?: string | null; full_name?: string | null }) {
  for (const tableName of PROFILE_TABLES) {
    const { error } = await supabaseService.from(tableName).insert([record]);
    if (!error) return;
    if (isMissingTableError(error)) {
      continue;
    }
    console.warn(`Failed to insert profile into ${tableName}: ${error.message}`);
    return;
  }
  console.warn("Profile tables not found; skipping profile insert");
}
