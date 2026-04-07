import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Doctor } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Local ranking used when Gemini is unavailable
function localRank(doctors: Doctor[], symptoms: string, specialty: string) {
  const kw = (symptoms + " " + specialty).toLowerCase();

  const scored = doctors.map((d) => {
    let score = 5;
    const reasons: string[] = [];
    const concerns: string[] = [];

    if (d.phone) { score += 1; reasons.push("Has a listed phone number for easy contact"); }
    if (d.website) { score += 1; reasons.push("Has an official website for more information"); }
    if (d.address && d.address.length > 10) {
      score += 1;
      reasons.push("Full address available for navigation");
    }
    if (d.specialty.some((s) => kw.includes(s.toLowerCase()))) {
      score += 2;
      reasons.push(`Specialty matches your need: ${d.specialty.join(", ")}`);
    } else {
      reasons.push(`Specialty: ${d.specialty.join(", ")}`);
    }
    if (!d.phone && !d.website) {
      concerns.push("Limited contact information available");
    }

    return { doctor: d, score: parseFloat(score.toFixed(1)), reasons, concerns };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  return {
    summary: `Based on your need (${symptoms}), we ranked the available facilities by data completeness and specialty match. Top result: ${top[0]?.doctor.name}.`,
    best_match: top[0]?.doctor.name ?? "",
    ranked_doctors: top.map((item, i) => ({
      name: item.doctor.name,
      rank: i + 1,
      score: item.score,
      reasons: item.reasons,
      concerns: item.concerns,
    })),
  };
}

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
          `${i + 1}. ${d.name} | Specialty: ${d.specialty.join(", ")} | Address: ${d.address}${d.phone ? ` | Phone: ${d.phone}` : ""}${d.website ? ` | Website: ${d.website}` : ""}`
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
Analyze the doctors above and rank the top 3-5 best matches for this specific user. Consider: specialty match, contact availability, and the user's language/urgency needs.

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

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ result: parsed });
    } catch (geminiErr: unknown) {
      // Gemini unavailable (quota / key issue) — fall back to local ranking
      const errMsg = geminiErr instanceof Error ? geminiErr.message : "";
      const isQuotaOrAuth = errMsg.includes("429") || errMsg.includes("quota") ||
        errMsg.includes("404") || errMsg.includes("403");

      if (isQuotaOrAuth) {
        const fallback = localRank(doctors.slice(0, 10), symptoms, doctors[0]?.specialty[0] ?? "");
        return NextResponse.json({ result: fallback, fallback: true });
      }
      throw geminiErr;
    }
  } catch (err) {
    console.error("Recommend API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
