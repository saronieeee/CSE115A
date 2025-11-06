import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Uses service-role so it works even if RLS is on (server-only, never expose to frontend)
const url = process.env.SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE!;

export const supabaseService = createClient(url, service);
