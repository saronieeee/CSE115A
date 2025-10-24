"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
/**
 * GET /api/public/clothing-items
 * Temporary dev route: reads straight from the clothing_items table
 * (service role bypasses RLS, so this will work without any SQL changes)
 */
router.get("/clothing-items", async (_req, res) => {
    // Select a few safe columns; tweak to match your schema
    const { data, error } = await supabase_1.supabaseService
        .from("clothing_items")
        .select("id,user_id, image_url, category, occasion, color, favority, times_worn")
        .order("created_at", { ascending: false })
        .limit(50);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data ?? [] });
});
exports.default = router;
