import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ intent: "general", specialty: null });
    }

    // Fast keyword check before calling Groq
    const lower = message.toLowerCase();
    const bookingKeywords = ["book", "appointment", "schedule", "reserve", "doctor for me", "find me a doctor", "book me"];
    if (bookingKeywords.some((k) => lower.includes(k))) {
      return NextResponse.json({ intent: "booking", specialty: null });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Classify this user message into one of three intents: "booking" (user wants to find/book a doctor), "symptom_check" (user describing symptoms), or "general" (anything else).
Also extract the medical specialty if mentioned (e.g. "cardiologist" → "Cardiologist", "cold/flu" → "General Practitioner", null if not clear).

Message: "${message}"

Respond only with JSON like: {"intent": "booking", "specialty": "General Practitioner"}`,
        },
      ],
      temperature: 0,
      max_tokens: 60,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    return NextResponse.json({
      intent: parsed.intent ?? "general",
      specialty: parsed.specialty ?? null,
    });
  } catch {
    return NextResponse.json({ intent: "general", specialty: null });
  }
}
