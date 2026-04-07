import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history }: { message: string; history?: Message[] } = await req.json();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    // Build conversation context from history (last 6 messages)
    const contextMessages = (history ?? [])
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a friendly AI medical assistant for TravelDoc AI, helping travelers find the right doctor or medical care anywhere in the world.

CRITICAL RULES:
1. ALWAYS respond in the EXACT same language the user is speaking. Arabic → Arabic, Hindi → Hindi, French → French, Spanish → Spanish, Turkish → Turkish, etc.
2. Keep your response under 2-3 SHORT sentences — it will be read aloud by a voice synthesizer. Be concise.
3. EMERGENCY: If the user describes emergency symptoms (chest pain radiating to arm, difficulty breathing, stroke symptoms like facial drooping, severe bleeding, loss of consciousness), immediately tell them to call emergency services and go to the nearest ER. Do NOT suggest booking an appointment.
4. For non-emergencies, tell them what type of specialist they need and that they can search on TravelDoc AI.
5. Remember the conversation context — you are in an ongoing voice conversation.
6. Never diagnose — only guide toward the right care.
7. Be warm, calm, and reassuring.`,
        },
        ...contextMessages,
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 150,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Voice chat error:", err);
    return NextResponse.json({ error: "AI unavailable" }, { status: 500 });
  }
}
