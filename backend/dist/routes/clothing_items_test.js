"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
router.get("/closet-items", async (_req, res) => {
    const { data, error } = await supabase_1.supabaseService
        .from("closet_items")
        .select("id,user_id, image_path,category,occasion,color,favorite,times_worn");
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data ?? [] });
});
exports.default = router;
