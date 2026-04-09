import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Try models in order until one works
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
];

function extractJSON(text: string): object {
  // Strip markdown code blocks if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse AI response as JSON");
  }
}

async function callVisionModel(
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  let lastError: unknown = new Error("No vision models configured");

  for (const model of VISION_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: "text", text: prompt },
            ],
          },
        ],
      });
      return completion.choices[0].message.content ?? "{}";
    } catch (err) {
      console.warn(`[medicine-analysis] model ${model} failed:`, err);
      lastError = err;
      continue;
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!image) {
      return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
    }

    if (image.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Please upload under 4MB." },
        { status: 400 }
      );
    }

    const lang =
      language === "hi"
        ? "IMPORTANT: Respond entirely in Hindi (हिंदी में जवाब दें). Use simple everyday Hindi words."
        : "Respond in clear, simple English.";

    const prompt = `You are a pharmaceutical expert helping patients understand their medicines. ${lang}

Look at this medicine image carefully. Read the medicine name, composition, and any visible text on the packet, strip, bottle, or label.

Respond ONLY with valid JSON (no markdown, no code blocks, no explanation outside JSON):

{
  "brandName": "Brand name of the medicine",
  "genericName": "Generic or chemical name",
  "manufacturer": "Company name or null",
  "type": "tablet OR capsule OR syrup OR injection OR cream OR drops OR inhaler OR other",
  "uses": ["What it treats 1", "What it treats 2"],
  "dosage": "Typical dosage and frequency (e.g. 1 tablet twice daily after food)",
  "howItWorks": "One simple sentence explaining how this medicine works",
  "sideEffects": ["Common side effect 1", "Common side effect 2"],
  "precautions": ["Important precaution 1", "Precaution 2"],
  "drugInteractions": ["Interacts with X if known"],
  "storage": "How to store this medicine",
  "prescriptionRequired": true,
  "pregnancySafe": "safe OR caution OR unsafe OR unknown",
  "activeIngredients": ["Ingredient with strength if visible"],
  "warnings": ["Critical warning if any"],
  "expiryVisible": "Expiry date if readable or null",
  "found": true,
  "notFoundReason": null
}

If you cannot identify the medicine (blurry image, not a medicine, text unreadable):
- Set found to false
- Set notFoundReason to a helpful explanation
- Fill other fields with null or empty arrays`;

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = image.type.startsWith("image/") ? image.type : "image/jpeg";

    const content = await callVisionModel(base64, mimeType, prompt);
    const result = extractJSON(content);
    return NextResponse.json({ result });

  } catch (err: unknown) {
    console.error("[medicine-analysis] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not analyze medicine: ${message}` },
      { status: 500 }
    );
  }
}
