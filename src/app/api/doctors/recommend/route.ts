import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Doctor } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Local ranking fallback when Groq is unavailable
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
    if (d.rating) {
      score += d.rating * 0.5;
      reasons.push(`Patient rating: ${d.rating.toFixed(1)}/5 (${d.reviews_count ?? 0} reviews)`);
    }
    if (d.distance_km != null && d.distance_km < 5) {
      score += 2;
      reasons.push(`Only ${d.distance_km} km away`);
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
    summary: `Based on your need (${symptoms}), we ranked the available facilities by specialty match and contact availability. Top result: ${top[0]?.doctor.name}.`,
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
    const { doctors, symptoms, language, urgency, insurance, city, tripDuration, travelPurpose, allergies, conditions }: {
      doctors: Doctor[];
      symptoms: string;
      language: string;
      urgency: string;
      insurance: string;
      city: string;
      tripDuration?: string;
      travelPurpose?: string;
      allergies?: string;
      conditions?: string;
    } = body;

    if (!doctors?.length || !symptoms) {
      return NextResponse.json({ error: "doctors and symptoms are required" }, { status: 400 });
    }

    const doctorList = doctors
      .slice(0, 10)
      .map((d, i) =>
        `${i + 1}. ${d.name} | Specialty: ${d.specialty.join(", ")} | Address: ${d.address}${d.rating ? ` | Rating: ${d.rating.toFixed(1)}/5 (${d.reviews_count ?? 0} reviews)` : ""}${d.distance_km != null ? ` | Distance: ${d.distance_km} km` : ""}${d.phone ? ` | Phone: ${d.phone}` : ""}${d.website ? ` | Website: ${d.website}` : ""}`
      )
      .join("\n");

    const prompt = `You are a medical concierge AI helping a traveler or new resident find the best doctor in ${city}.

USER SITUATION:
- Symptoms / medical need: ${symptoms}
- Preferred language: ${language || "Any"}
- Urgency: ${urgency || "Not urgent"}
- Insurance / payment: ${insurance || "Not specified"}
- Trip duration: ${tripDuration || "Not specified"}
- Travel purpose: ${travelPurpose || "Not specified"}
- Known allergies: ${allergies || "None mentioned"}
- Chronic conditions: ${conditions || "None mentioned"}

AVAILABLE DOCTORS:
${doctorList}

TASK:
1. Check if the symptoms describe a MEDICAL EMERGENCY (chest pain, difficulty breathing, stroke signs, severe bleeding, loss of consciousness, poisoning, high fever in infant). If so, set urgency_alert.
2. Rank the top 3-5 best matching doctors for this user.
3. Generate 3-4 smart questions the user should ask the doctor at the appointment.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "summary": "2-3 sentence summary of your recommendation approach",
  "best_match": "Name of the single best doctor",
  "urgency_alert": null,
  "questions_to_ask": ["Question 1?", "Question 2?", "Question 3?"],
  "what_to_bring": ["Item 1", "Item 2", "Item 3"],
  "ranked_doctors": [
    {
      "name": "Doctor Name",
      "rank": 1,
      "score": 9.2,
      "reasons": ["reason 1", "reason 2"],
      "concerns": ["optional concern"]
    }
  ]
}

If symptoms are a medical emergency, set urgency_alert to a short warning message (e.g. "Your symptoms may indicate a medical emergency. Please go to the nearest emergency room immediately or call emergency services."). Otherwise keep it null.

For what_to_bring, list 3-5 practical items the patient should bring to the appointment (e.g. "Passport or ID", "Travel insurance card", "List of current medications", "Medical records if available"). Tailor to the user's situation (trip duration, purpose, allergies).`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      });

      const text = completion.choices[0]?.message?.content ?? "";
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ result: parsed });
    } catch (groqErr: unknown) {
      console.error("Groq error:", groqErr);
      // Fall back to local ranking
      const fallback = localRank(doctors.slice(0, 10), symptoms, doctors[0]?.specialty[0] ?? "");
      return NextResponse.json({ result: fallback, fallback: true });
    }
  } catch (err) {
    console.error("Recommend API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
