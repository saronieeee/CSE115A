import { Router } from "express";
import fetch from "node-fetch";
import { requireUser } from "../lib/requireUser";

const router = Router();

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

const OPENAI_URL = "https://api.openai.com/v1/images/generations";
const DEV_PROMPT = "Generate a basic human wearing these items.";
const VISION_URL = "https://api.openai.com/v1/chat/completions";

router.post("/outfit", requireUser, async (req, res) => {
  const { prompt, items }: OutfitRequestBody = req.body ?? {};
  const user = (req as any).user;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI is not configured" });
  }

  const selectedItems = Array.isArray(items) ? items.slice(0, 8) : [];

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
              { type: "text", text: "Describe these garments for outfit generation." },
              ...usableImages.map((url) => ({ type: "image_url", image_url: { url } })),
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
    "Create a single full-body fashion photo on a neutral studio background.",
    "Blend these wardrobe pieces into the look:",
    visionDescriptions ? `From images: ${visionDescriptions}` : itemSummary || "use generic staple wardrobe pieces",
    "Keep lighting flattering, no text or watermarks.",
    `Instruction: ${userPrompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    console.log("[AI outfit] sending to OpenAI", {
      userId: user?.id,
      itemCount: selectedItems.length,
      itemSummary,
      imageUrls: usableImages,
      visionUsed: Boolean(visionDescriptions),
      visionPreview: visionDescriptions?.slice(0, 160),
      visionFull: visionDescriptions,
      promptPreview: combinedPrompt.slice(0, 200),
    });

    const openAiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: combinedPrompt,
        size: "1024x1024",
        n: 1,
        user: user?.id,
      }),
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
        (payload && typeof payload === "object" && (payload as any).error?.message) ||
        openAiRes.statusText ||
        "Failed to generate image";
      return res.status(openAiRes.status || 500).json({ error: err });
    }

    const first = (payload as any)?.data?.[0];
    const imageUrl = first?.url;
    const b64 = first?.b64_json;

    if (!imageUrl && !b64) {
      console.error("OpenAI response missing image data", payload);
      return res.status(502).json({ error: "OpenAI response missing image" });
    }

    const finalUrl = imageUrl || (b64 ? `data:image/png;base64,${b64}` : null);
    return res.json({ imageUrl: finalUrl, promptUsed: combinedPrompt });
  } catch (e: any) {
    console.error("/api/ai/outfit failed", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

export default router;
