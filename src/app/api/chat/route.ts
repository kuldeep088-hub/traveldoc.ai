import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a friendly AI medical concierge for TravelDoc AI, helping travelers and new residents find the right doctor anywhere in the world.

YOUR GOAL: Through natural conversation, gather:
1. What symptoms or medical need the user has
2. What city they are in (or traveling to)
3. Any urgency level

RULES:
- Be warm, empathetic, and brief — max 2-3 sentences per reply.
- Ask only ONE question at a time.
- If symptoms sound like a MEDICAL EMERGENCY (chest pain, stroke, severe bleeding, difficulty breathing), immediately tell them to go to the nearest emergency room and call emergency services. Do NOT ask follow-up questions.
- Once you know the symptoms AND the city, determine the appropriate medical specialty and respond with this EXACT format at the end of your message:
  [SEARCH:city=CITY_NAME&specialty=SPECIALTY_NAME]
  Where SPECIALTY_NAME is one of: General Practice, Dentist, Dermatologist, Cardiologist, Orthopedist, Ophthalmologist, Gynecologist, Pediatrician, Neurologist, Psychiatrist, Urologist, ENT Specialist, Gastroenterologist, Endocrinologist, Oncologist, Pulmonologist, Rheumatologist, Allergist, Emergency Medicine
- If the user does not know the city or has not mentioned it yet, ask for it after they describe symptoms.
- Do NOT include [SEARCH:...] until you have BOTH the city and enough symptom information.`,
        },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const rawReply = completion.choices[0]?.message?.content?.trim() ?? "";

    // Parse action from reply
    const actionMatch = rawReply.match(/\[SEARCH:([^\]]+)\]/);
    let action: { city: string; specialty: string } | null = null;
    let reply = rawReply;

    if (actionMatch) {
      const params = new URLSearchParams(actionMatch[1]);
      const city = params.get("city") ?? "";
      const specialty = params.get("specialty") ?? "";
      if (city) {
        action = { city, specialty };
        // Remove the marker from visible text
        reply = rawReply.replace(/\[SEARCH:[^\]]+\]/, "").trim();
      }
    }

    return NextResponse.json({ reply, action });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "AI unavailable" }, { status: 500 });
  }
}
