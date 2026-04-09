import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const VISION_MODEL = "llama-3.2-11b-vision-preview";

function extractJSON(text: string): object {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse AI response as JSON");
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!image) {
      return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
    }

    const MAX_SIZE = 4 * 1024 * 1024;
    if (image.size > MAX_SIZE) {
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

Analyze this medicine image carefully — read the medicine name, composition, and any text visible on the packet/strip/bottle/label.

Respond ONLY with valid JSON (no markdown, no code blocks):

{
  "brandName": "Brand name of the medicine",
  "genericName": "Generic/chemical/INN name",
  "manufacturer": "Manufacturer company name or null",
  "type": "tablet OR capsule OR syrup OR injection OR cream OR drops OR inhaler OR other",
  "uses": ["Condition or disease it treats 1", "Condition 2"],
  "dosage": "Typical dosage and frequency (e.g. 1 tablet twice daily after food)",
  "howItWorks": "One simple sentence explaining how this medicine works in the body",
  "sideEffects": ["Common side effect 1", "Common side effect 2"],
  "precautions": ["Important precaution 1", "Precaution 2"],
  "drugInteractions": ["Medicines it should not be taken with, if known"],
  "storage": "How to store this medicine (temperature, humidity, light)",
  "prescriptionRequired": true or false,
  "pregnancySafe": "safe OR caution OR unsafe OR unknown",
  "activeIngredients": ["Active ingredient 1 with strength if visible"],
  "warnings": ["Critical warning 1 if any"],
  "expiryVisible": "Expiry date if readable from image or null",
  "found": true or false,
  "notFoundReason": "Reason if found is false (blurry image, not a medicine, etc.)"
}

Rules:
- If you can clearly read the medicine name from the image, set found: true
- If the image is blurry, not a medicine, or text is unreadable, set found: false with a helpful notFoundReason
- Keep all explanations simple — assume the reader has no medical background
- For drugInteractions, only include if you are confident based on known pharmacology`;

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = image.type || "image/jpeg";

    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const content = completion.choices[0].message.content || "{}";
    const result = extractJSON(content);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[medicine-analysis] error:", err);
    return NextResponse.json(
      { error: "Failed to analyze medicine. Please try again." },
      { status: 500 }
    );
  }
}
