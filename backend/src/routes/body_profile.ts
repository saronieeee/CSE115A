// src/routes/body_profile.ts
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

// small helper for extensions
function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  // default jpg for jpeg/anything else
  return "jpg";
}

// POST /api/body-profile
router.post(
  "/",
  requireUser,
  upload.single("photo"),
  async (req, res) => {
    const user = (req as any).user;
    const userId = user.id as string;

    try {
      const rawProfile = req.body.profile as string | undefined;
      if (!rawProfile) {
        return res.status(400).json({ error: "Missing profile payload" });
      }

      const profile: BodyProfilePayload = JSON.parse(rawProfile);

      // 1️⃣ Load existing profile so we know old image_path
      let oldImagePath: string | null = null;
      const { data: existing, error: existingErr } = await supabaseService
        .from("body_profiles")
        .select("image_path")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingErr && existing) {
        oldImagePath = (existing as any).image_path ?? null;
      }

      // 2️⃣ Handle optional photo upload
      const file = req.file;
      let image_path: string | null = oldImagePath;

      if (file) {
        const ext = extForMime(file.mimetype);
        const newPath = `body-profiles/${userId}.${ext}`;

        // If path changed (e.g. jpg → webp), delete old image first
        if (oldImagePath && oldImagePath !== newPath) {
          const { error: removeErr } = await supabaseService.storage
            .from("body-profiles")
            .remove([oldImagePath]);

          if (removeErr) {
            console.warn(
              "Failed to remove old body profile image:",
              oldImagePath,
              removeErr
            );
            // not fatal – we keep going
          }
        }

        const { error: uploadErr } = await supabaseService.storage
          .from("body-profiles")
          .upload(newPath, file.buffer, {
            contentType: file.mimetype,
            upsert: true, // overwrite if same path
          });

        if (uploadErr) {
          console.error("Upload body profile image failed:", uploadErr);
          return res
            .status(500)
            .json({ error: "Failed to upload profile image" });
        }

        image_path = newPath;
      }

      // 3️⃣ Upsert profile (one per user)
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
          { onConflict: "user_id" }
        )
        .select("*")
        .single();

      if (upsertErr) {
        console.error("Upsert body profile failed:", upsertErr);
        return res.status(500).json({ error: "Failed to save body profile" });
      }

      // 4️⃣ Build public URL for the saved image so frontend can refetch
      let imageUrl: string | null = null;
      if (data.image_path) {
        const { data: pub } = supabaseService.storage
          .from("body-profiles")
          .getPublicUrl(data.image_path);
        imageUrl = pub?.publicUrl ?? null;
      }

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
