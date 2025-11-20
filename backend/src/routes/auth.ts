import { Router } from "express";
import { supabaseService } from "../lib/supabase";
import { getUserFromRequest } from "../lib/requireUser";

const router = Router();

// POST /api/auth/signup
// Creates a user in Supabase Auth using the service-role (admin) API
router.post("/signup", async (req, res) => {
  const { email, password, email_confirm = true, full_name } = req.body || {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { data, error } = await supabaseService.auth.admin.createUser({
    email,
    password,
    email_confirm,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const user = data.user;

  if (user && typeof full_name === "string") {
    await supabaseService.from("profiles").insert({ id: user.id, email: user.email, full_name });
  }

  return res.status(201).json({ user });
});

// GET /api/auth/users/:id
// Admin lookup of a user by ID (server-side only)
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing user id" });

  const { data, error } = await supabaseService.auth.admin.getUserById(id);
  if (error) return res.status(404).json({ error: error.message });
  return res.json({ user: data.user });
});

// GET /api/auth/me
// Returns current user info from a provided JWT in Authorization header
router.get("/me", async (req, res) => {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: error || "Unauthorized" });
  return res.json({ user });
});

export default router;
