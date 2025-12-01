// src/routes/ai.ts
import { Router } from "express";
import fetch from "node-fetch";
import FormData from "form-data";
import { Blob } from "buffer";
import { supabaseService } from "../lib/supabase";
import { requireUser } from "../lib/requireUser";

const router = Router();
const AI_OUTFITS_BUCKET = "ai_outfits";

async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to download image from OpenAI URL: ${resp.status}`);
  }
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

type OutfitRequestBody = {
  prompt?: string;
  items?: Array<{
    id?: string;
    title?: string;
    category?: string;
    color?: string;
    tag?: string;
    image?: string;
  }>;
};


type DescribeClosetItemBody = {
  itemId?: string;
};

const OPENAI_EDIT_URL = "https://api.openai.com/v1/images/edits";
const DEV_PROMPT = "Generate a basic human wearing these items.";
const VISION_URL = "https://api.openai.com/v1/chat/completions";
const BODY_PROFILE_BUCKET = "body-profiles";

type BodyImageAsset = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

function mimeTypeFromPath(path: string | null): string {
  if (!path) return "image/jpeg";
  const lc = path.toLowerCase();
  if (lc.endsWith(".png")) return "image/png";
  if (lc.endsWith(".webp")) return "image/webp";
  if (lc.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function loadBodyImageForUser(
  userId: string
): Promise<BodyImageAsset | null> {
  const { data, error } = await supabaseService
    .from("body_profiles")
    .select("image_path")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[AI outfit] failed to fetch body profile row", error);
    throw new Error("Failed to load body profile");
  }

  const imagePath = data?.image_path ?? null;
  if (!imagePath) {
    return null;
  }

  const { data: downloaded, error: downloadErr } = await supabaseService.storage
    .from(BODY_PROFILE_BUCKET)
    .download(imagePath);

  if (downloadErr || !downloaded) {
    console.error(
      "[AI outfit] failed to download body profile image",
      downloadErr
    );
    throw new Error("Failed to download body photo");
  }

  const blob = downloaded as Blob;
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    mimeType: (blob as any)?.type || mimeTypeFromPath(imagePath),
    filename: imagePath.split("/").pop() || "body-profile.jpg",
  };
}

/**
 * POST /api/ai/outfit
 * Existing outfit image generation route (unchanged)
 */
router.post("/outfit", requireUser, async (req, res) => {
  const { prompt, items }: OutfitRequestBody = req.body ?? {};
  const user = (req as any).user;
  const userId = user?.id as string;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI is not configured" });
  }

  const selectedItems = Array.isArray(items) ? items.slice(0, 8) : [];

  let bodyImage: BodyImageAsset | null = null;
  try {
    bodyImage = await loadBodyImageForUser(userId);
  } catch (err) {
    console.error("[AI outfit] failed to load body profile", err);
    return res
      .status(500)
      .json({ error: "Could not load your body profile photo" });
  }

  if (!bodyImage) {
    return res.status(400).json({
      error: "Upload a body profile photo before generating outfits.",
    });
  }

  // ask a vision model to describe items
  let visionDescriptions: string | null = null;
  const usableImages = selectedItems
    .map((it) => typeof it.image === "string" && it.image.trim())
    .filter(Boolean) as string[];

  if (usableImages.length) {
    try {
      const visionPayload: any = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a fashion assistant. Describe each garment in the provided images. Focus on garment type, color/pattern, and style cues. Return a short comma-separated list, one item per image, in order.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe these garments for outfit generation.",
              },
              ...usableImages.map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.4,
      };

      const visionRes = await fetch(VISION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(visionPayload),
      });

      const txt = await visionRes.text();
      let visionJson: any;
      try {
        visionJson = JSON.parse(txt);
      } catch {
        visionJson = txt;
      }

      if (!visionRes.ok) {
        console.error("[AI outfit] vision describe failed", visionJson);
      } else {
        const content = visionJson?.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          visionDescriptions = content.trim();
        }
      }
    } catch (err) {
      console.error("[AI outfit] vision step error", err);
    }
  }

  const itemSummary = selectedItems
    .map((it, idx) => {
      const parts = [
        it.category || it.tag || "item",
        it.title || it.color,
        it.color && !it.title ? it.color : null,
      ].filter(Boolean);
      const label = parts.join(" - ");
      return label ? `${idx + 1}. ${label}` : null;
    })
    .filter(Boolean)
    .join("; ");

  const userPrompt = (prompt || DEV_PROMPT).trim();
  const combinedPrompt = [
    DEV_PROMPT,
    "Create a single full-body photo using the provided body reference image as the base person.",
    "Keep the same face, pose, and proportions from the input photo—only change hair styling as needed and dress the person in new clothes.",
    "Frame the composition so the subject is fully visible from head to toe with footwear included—avoid cropping off the top of the head or the bottom of the shoes.",
    "Leave a small neutral background margin (about 5-10% of the canvas) above the head and below the shoes so nothing touches the frame edges.",
    "Make the final image a 1024×1024 PNG suitable for download without further resizing.",
    "Blend these wardrobe pieces into the look:",
    visionDescriptions
      ? `From wardrobe images: ${visionDescriptions}`
      : itemSummary || "use generic staple wardrobe pieces",
    "Ensure edits are photorealistic, seamless, and free of artifacts or text.",
    `Instruction: ${userPrompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    console.log("[AI outfit] sending to OpenAI", {
      userId,
      itemCount: selectedItems.length,
      itemSummary,
      imageUrls: usableImages,
      visionUsed: Boolean(visionDescriptions),
      visionPreview: visionDescriptions?.slice(0, 160),
      visionFull: visionDescriptions,
      promptPreview: combinedPrompt.slice(0, 200),
      editingFromBodyPhoto: true,
      bodyPhotoBytes: bodyImage.buffer.length,
    });

    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", combinedPrompt);
    form.append("size", "1024x1024");
    form.append("n", "1");
    form.append("image", bodyImage.buffer, {
      filename: bodyImage.filename,
      contentType: bodyImage.mimeType,
      knownLength: bodyImage.buffer.length,
    });

    const openAiRes = await fetch(OPENAI_EDIT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      body: form as any,
    });

    const text = await openAiRes.text();
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }

    if (!openAiRes.ok) {
      const err =
        (payload &&
          typeof payload === "object" &&
          (payload as any).error?.message) ||
        openAiRes.statusText ||
        "Failed to generate image";
      return res.status(openAiRes.status || 500).json({ error: err });
    }

    const first = (payload as any)?.data?.[0];
    const imageUrlFromOpenAI = first?.url;
    const b64 = first?.b64_json;

    if (!imageUrlFromOpenAI && !b64) {
      console.error("OpenAI response missing image data", payload);
      return res.status(502).json({ error: "OpenAI response missing image" });
    }

    let imageBuffer: Buffer;

    if (b64) {
      imageBuffer = Buffer.from(b64, "base64");
    } else {
      imageBuffer = await fetchImageAsBuffer(imageUrlFromOpenAI);
    }

    const fileName = `user-${userId}/${Date.now()}.png`;

    const { data: uploadData, error: uploadErr } = await supabaseService.storage
      .from(AI_OUTFITS_BUCKET)
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadErr) {
      console.error("[AI outfit] storage upload error:", uploadErr);
      return res
        .status(500)
        .json({ error: "Failed to upload AI outfit image." });
    }

    const { data: publicUrlData } = supabaseService.storage
      .from(AI_OUTFITS_BUCKET)
      .getPublicUrl(fileName);

    const finalImageUrl = publicUrlData.publicUrl;

    let bodyProfileSnapshot: any = null;
    try {
      const { data: bodyProfileRow, error: bodyProfileErr } =
        await supabaseService
          .from("body_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

      if (bodyProfileErr && bodyProfileErr.code !== "PGRST116") {
        console.error(
          "[AI outfit] failed to fetch body profile snapshot",
          bodyProfileErr
        );
      } else {
        bodyProfileSnapshot = bodyProfileRow || null;
      }
    } catch (err) {
      console.error("[AI outfit] error while snapshotting body profile", err);
    }

    const { data: outfitRow, error: insertErr } = await supabaseService
      .from("ai_outfits")
      .insert({
        user_id: userId,
        image_path: fileName,
        image_url: finalImageUrl,
        body_profile: bodyProfileSnapshot,
        items: selectedItems, // snapshot of what was used
      })
      .select()
      .single();

    if (insertErr || !outfitRow) {
      console.error("[AI outfit] DB insert error:", insertErr);
      return res
        .status(500)
        .json({ error: "Failed to create AI outfit record." });
    }

    const joinRows =
      selectedItems
        ?.filter((it) => it.id)
        .map((it) => ({
          ai_outfit_id: outfitRow.id,
          closet_item_id: it.id,
          role: (it.category || it.tag || null) as string | null,
        })) ?? [];

    if (joinRows.length > 0) {
      const { error: joinErr } = await supabaseService
        .from("ai_outfit_items")
        .insert(joinRows);

      if (joinErr) {
        console.error(
          "[AI outfit] join insert error (ai_outfit_items):",
          joinErr
        );
        // not fatal; we still return the outfit
      }
    }

    return res.json({
      id: outfitRow.id,
      imageUrl: outfitRow.image_url,
      createdAt: outfitRow.created_at,
      items: outfitRow.items,
      promptUsed: combinedPrompt,
    });
  } catch (e: any) {
    console.error("/api/ai/outfit failed", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

export default router;
