"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Uses service-role so it works even if RLS is on (server-only, never expose to frontend)
const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE;
exports.supabaseService = (0, supabase_js_1.createClient)(url, service);
