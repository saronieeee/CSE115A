// src/routes/bodyProfile.ts
import { Router } from "express";
import multer from "multer";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

type BodyProfilePayload = {
  heightFt: number;
  heightIn: number;
  weight?: number;
  bodyType: string;
  topsSize?: string;
  bottomsSize?: string;
  shoesSize?: string;
};

// POST /api/body-profile
router.post(
  "/",
  requireUser,
  upload.single("photo"), // field name "photo" must match what you send from frontend
  async (req, res) => {
    const user = (req as any).user;
    const userId = user.id as string;

    try {
      const rawProfile = req.body.profile as string | undefined;
      if (!rawProfile) {
        return res.status(400).json({ error: "Missing profile payload" });
      }

      const profile: BodyProfilePayload = JSON.parse(rawProfile);

      // optional photo
      const file = req.file;
      let image_path: string | null = null;

if (file) {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  const ext = mimeToExt[file.mimetype] || "jpg";

  // 👇 define `path` here – this is what TS is complaining about
  const path = `body-profiles/${userId}-${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabaseService.storage
    .from("body-profiles")
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    console.error("Upload body profile image failed:", uploadErr);
    return res.status(500).json({ error: "Failed to upload profile image" });
  }

  image_path = path;
}


      // upsert profile (one per user)
      const { data, error: upsertErr } = await supabaseService
        .from("body_profiles")
        .upsert(
          {
            user_id: userId,
            image_path,
            height_ft: profile.heightFt,
            height_in: profile.heightIn,
            weight: profile.weight ?? null,
            body_type: profile.bodyType,
            tops_size: profile.topsSize ?? null,
            bottoms_size: profile.bottomsSize ?? null,
            shoes_size: profile.shoesSize ?? null,
          },
          { onConflict: "user_id" } // unique index we created
        )
        .select("*")
        .single();

      if (upsertErr) {
        console.error("Upsert body profile failed:", upsertErr);
        return res.status(500).json({ error: "Failed to save body profile" });
      }

      return res.json({ profile: data });
    } catch (e: any) {
      console.error("Error in POST /api/body-profile:", e);
      return res.status(500).json({ error: e?.message || "Server error" });
    }
  }
);

// GET /api/body-profile
router.get("/", requireUser, async (req, res) => {
  const user = (req as any).user;
  const userId = user.id as string;

  try {
    const { data, error } = await supabaseService
      .from("body_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // No profile yet → return null
    if (error) {
      if (error.code === "PGRST116") {
        return res.json({ profile: null });
      }
      console.error("Fetch body profile failed:", error);
      return res.status(500).json({ error: error.message });
    }

    // Build public image URL (assuming bucket "body-profiles" is public)
    // Build public image URL (assuming bucket "body-profiles" is public)
    let imageUrl: string | null = null;
    if (data.image_path) {
    const { data: pub } = supabaseService.storage
        .from("body-profiles")
        .getPublicUrl(data.image_path);

    imageUrl = pub?.publicUrl ?? null;
    }
    console.log("Image URL:", imageUrl);


    return res.json({
      profile: {
        id: data.id,
        heightFt: data.height_ft,
        heightIn: data.height_in,
        weight: data.weight,
        bodyType: data.body_type,
        topsSize: data.tops_size,
        bottomsSize: data.bottoms_size,
        shoesSize: data.shoes_size,
        imageUrl,
        imagePath: data.image_path,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (e: any) {
    console.error("Error in GET /api/body-profile:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});


export default router;
