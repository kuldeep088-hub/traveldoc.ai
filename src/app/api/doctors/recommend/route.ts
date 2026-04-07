import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Doctor } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      doctors,
      symptoms,
      language,
      urgency,
      insurance,
      city,
    }: {
      doctors: Doctor[];
      symptoms: string;
      language: string;
      urgency: string;
      insurance: string;
      city: string;
    } = body;

    if (!doctors?.length || !symptoms) {
      return NextResponse.json({ error: "doctors and symptoms are required" }, { status: 400 });
    }

    const doctorList = doctors
      .map(
        (d, i) =>
          `${i + 1}. ${d.name} | Rating: ${d.rating ?? "N/A"} (${d.reviews_count ?? 0} reviews) | Specialty: ${d.specialty.join(", ")} | Address: ${d.address}`
      )
      .join("\n");

    const prompt = `You are a medical concierge AI helping a traveler or new resident find the best doctor in ${city}.

USER SITUATION:
- Symptoms / medical need: ${symptoms}
- Preferred language: ${language || "Any"}
- Urgency: ${urgency || "Not urgent"}
- Insurance / payment: ${insurance || "Not specified"}

AVAILABLE DOCTORS:
${doctorList}

TASK:
Analyze the doctors above and rank the top 3-5 best matches for this specific user. Consider: rating, number of reviews, specialty match, location convenience, and the user's language/urgency needs.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "summary": "2-3 sentence summary of your recommendation approach",
  "best_match": "Name of the single best doctor",
  "ranked_doctors": [
    {
      "name": "Doctor Name",
      "rank": 1,
      "score": 9.2,
      "reasons": ["reason 1", "reason 2"],
      "concerns": ["optional concern"]
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip markdown code fences if Gemini wraps the response
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid response", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Recommend API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
