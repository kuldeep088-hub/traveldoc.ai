import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { medication, country } = await req.json();

    if (!medication || !country) {
      return NextResponse.json(
        { error: "medication and country are required" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are a pharmaceutical reference database for international travelers. A traveler who takes "${medication}" needs to find it or its equivalent in ${country}.

Provide accurate, practical information. Respond ONLY with valid JSON (no markdown, no code blocks):

{
  "generic_name": "The INN/generic name for this medication",
  "brand_names": ["Main brand name in ${country}", "Second brand if known"],
  "prescription_required": true or false,
  "otc_available": true or false,
  "approximate_price": "e.g. $3–8 USD for 20 tablets (rough range)",
  "pharmacy_phrase": {
    "english": "Do you have [medication] / [generic name]? I take it for [common use].",
    "local": "The exact natural polite phrase to say in ${country}'s primary language",
    "transliteration": "Romanized phonetic version if the script is non-Latin, otherwise null",
    "language": "Name of the language used"
  },
  "alternatives": [
    { "name": "Alternative drug name", "note": "Why it is similar / what class it belongs to" }
  ],
  "warnings": [
    "Any important country-specific legal status (e.g. controlled substance)",
    "Any known interaction or storage concern for travelers"
  ],
  "storage_tip": "How to keep this medication safe while traveling (heat, humidity, etc.) — or null if standard room-temperature storage is fine",
  "found": true or false,
  "availability_note": "Brief sentence on how easy it is to find this in ${country}, any special pharmacies to try, or reason if not found"
}

Rules:
- If the medication is widely known by its generic name (e.g. ibuprofen, paracetamol), list the most common local brand names.
- Keep pharmacy_phrase.local realistic and natural — something a pharmacist would understand immediately.
- If you are not confident the medication is available in ${country}, set found to false and explain.
- Include 1–3 alternatives only if relevant.
- Keep all text concise and practical.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("[medication] error:", err);
    return NextResponse.json({ error: "Could not look up medication. Please try again." }, { status: 500 });
  }
}
