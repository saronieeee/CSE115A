import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import "dotenv/config";


const VISION_URL = "https://api.openai.com/v1/chat/completions";
const BATCH_SIZE = 25;
const DELAY_MS = 800;        

// ---- Env + client setup ----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
}
if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in env.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ClosetItem = {
  id: string;
  user_id: string;
  image_url: string | null;
  category: string | null;
  color: string | null;
  occasion: string | null;
  ai_generated_description: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Build the same prompt/meta you used in your route
function buildVisionPayload(item: ClosetItem) {
  const metaParts: string[] = [];
  if (item.category) metaParts.push(`Category: ${item.category}`);
  if (item.color) metaParts.push(`Color: ${item.color}`);
  if (item.occasion) metaParts.push(`Occasion: ${item.occasion}`);

  const metaString =
    metaParts.length > 0
      ? metaParts.join(", ")
      : "No extra metadata provided.";

  return {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a fashion assistant. You are given ONE clothing item image plus some text metadata. " +
          "Your job is to: (1) describe the garment in 1–2 concise sentences (type, color/pattern, fit, style vibe), " +
          "(2) recommend the primary occasion to wear it (one of: casual, smart casual, business, formal, party), " +
          "(3) recommend the appropriate weather or season (e.g. warm weather, cold weather, all-season, rainy). " +
          "Do NOT mention that you are looking at an image. Respond ONLY in the following JSON format:\n" +
          "{\n" +
          '  "description": "<short natural language description>",\n' +
          '  "occasion": "<one of: casual | smart casual | business | formal | party>",\n' +
          '  "weather": "<short phrase like: warm weather | cold weather | all-season | rainy>"\n' +
          "}",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Describe this single clothing item for a virtual wardrobe and follow the required JSON format. " +
              `Metadata: ${metaString}`,
          },
          {
            type: "image_url",
            image_url: { url: item.image_url! },
          },
        ],
      },
    ],
    max_tokens: 200,
    temperature: 0.4,
  };
}

async function describeOneItem(item: ClosetItem): Promise<string | null> {
  if (!item.image_url) {
    console.warn(`Item ${item.id} has no image_url, skipping.`);
    return null;
  }

  const payload = buildVisionPayload(item);

  const res = await fetch(VISION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  if (!res.ok) {
    console.error("[batch] OpenAI error for item", item.id, data);
    return null;
  }

  const description = data?.choices?.[0]?.message?.content?.trim() || null;
  if (!description) {
    console.error("[batch] Empty description from OpenAI for item", item.id);
    return null;
  }

  return description;
}

async function updateItemDescription(itemId: string, description: string) {
  const { error } = await supabase
    .from("closet_items")
    .update({
      ai_generated_description: description,
    })
    .eq("id", itemId);

  if (error) {
    console.error("[batch] Failed to update item", itemId, error);
  }
}

async function processBatch(offset: number): Promise<number> {
  // Fetch a slice of closet_items that still need descriptions
  const { data, error } = await supabase
    .from("closet_items")
    .select(
      "id, user_id, image_url, category, color, occasion, ai_generated_description"
    )
    .is("ai_generated_description", null)
    .not("image_url", "is", null)
    .order("id", { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1);

  if (error) {
    console.error("[batch] Supabase fetch error:", error);
    throw error;
  }

  const items = (data || []) as ClosetItem[];
  if (items.length === 0) {
    return 0;
  }

  console.log(
    `Processing batch starting at offset=${offset}, count=${items.length}`
  );

  for (const item of items) {
    console.log(`→ Item ${item.id} (user ${item.user_id})`);

    try {
      const description = await describeOneItem(item);
      if (description) {
        await updateItemDescription(item.id, description);
        console.log(`  ✓ updated description for item ${item.id}`);
      } else {
        console.log(`  skipped or failed for item ${item.id}`);
      }
    } catch (err) {
      console.error(`  error processing item ${item.id}`, err);
    }

    // Short delay between OpenAI calls
    await sleep(DELAY_MS);
  }

  return items.length;
}

async function main() {
  console.log("Starting batch AI description generation for ALL closet_items…");

  let offset = 0;
  while (true) {
    const count = await processBatch(offset);
    if (count === 0) {
      console.log("No more items to process. Done.");
      break;
    }
    offset += count;
  }

  console.log("Batch job complete");
}

main().catch((err) => {
  console.error("Fatal error in batch script:", err);
  process.exit(1);
});
