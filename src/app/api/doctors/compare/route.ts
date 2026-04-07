import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Doctor } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { doctors, symptoms }: { doctors: Doctor[]; symptoms: string } = await req.json();

    if (!doctors || doctors.length < 2) {
      return NextResponse.json({ error: "At least 2 doctors required" }, { status: 400 });
    }

    const doctorList = doctors
      .map(
        (d, i) =>
          `Doctor ${i + 1}: ${d.name}
  - Specialty: ${d.specialty.join(", ")}
  - Address: ${d.address}
  - Phone: ${d.phone || "Not listed"}
  - Website: ${d.website || "Not listed"}`
      )
      .join("\n\n");

    const prompt = `Compare these ${doctors.length} doctors for a patient with the following medical need: "${symptoms}"

${doctorList}

Provide a concise, helpful comparison in this exact JSON format (no markdown, raw JSON only):
{
  "summary": "1-2 sentence overview of the comparison",
  "winner": "Name of the recommended doctor and why in one sentence",
  "comparison": [
    {
      "name": "Doctor Name",
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1"]
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Compare API error:", err);
    return NextResponse.json({ error: "Comparison failed" }, { status: 500 });
  }
}
