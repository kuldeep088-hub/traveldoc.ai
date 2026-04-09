import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PDFParse } from "pdf-parse";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const VISION_MODEL = "llama-3.2-11b-vision-preview";
const TEXT_MODEL = "llama-3.3-70b-versatile";

function extractJSON(text: string): object {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse AI response as JSON");
  }
}

function buildPrompt(language: string): string {
  const lang =
    language === "hi"
      ? "IMPORTANT: Respond entirely in Hindi (हिंदी में जवाब दें). Use simple everyday Hindi words that any patient can understand."
      : "Respond in clear, simple English — no medical jargon.";

  return `You are a compassionate medical report explainer. You help patients understand their reports in plain language. ${lang}

Analyze the medical report and respond ONLY with valid JSON (no markdown, no code blocks):

{
  "reportType": "e.g. Blood Test / X-Ray / Prescription / ECG / Urine Test / MRI",
  "summary": "2-3 sentence simple overall explanation of what this report shows",
  "urgency": "none OR see_doctor OR urgent",
  "findings": [
    {
      "test": "Test or parameter name",
      "value": "Measured value with unit (e.g. 110 mg/dL)",
      "normalRange": "Normal reference range if visible (e.g. 70-100 mg/dL)",
      "status": "normal OR attention OR critical",
      "meaning": "One simple sentence: what this result means for the patient"
    }
  ],
  "recommendations": ["Practical action step 1", "Practical action step 2"],
  "urgency_reason": "Brief reason why this urgency level was chosen",
  "disclaimer": "Short medical disclaimer"
}

Rules:
- Use only simple words, avoid complex medical terms
- status critical = potentially life-threatening; attention = outside normal range; normal = within range
- urgency urgent only for life-threatening findings, see_doctor for abnormal values, none if all normal
- Include 1-3 practical actionable recommendations
- If you cannot read the report clearly, still return JSON with summary explaining what you could not read`;
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Please upload under 4MB." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(language);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf") {
      // Extract text from PDF
      let text = "";
      try {
        text = await extractPDFText(buffer);
      } catch (pdfErr) {
        console.error("[report-analysis] PDF extraction error:", pdfErr);
        return NextResponse.json(
          { error: "Could not read this PDF. It may be a scanned image — please take a photo of the report and upload that instead." },
          { status: 400 }
        );
      }

      if (!text || text.length < 20) {
        return NextResponse.json(
          { error: "This PDF appears to be a scanned image with no extractable text. Please take a photo of the report and upload that instead." },
          { status: 400 }
        );
      }

      const completion = await groq.chat.completions.create({
        model: TEXT_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Medical report text:\n\n${text.slice(0, 8000)}` },
        ],
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      return NextResponse.json({ result });

    } else {
      // Image upload — send to vision model
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";

      const completion = await groq.chat.completions.create({
        model: VISION_MODEL,
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: "text", text: prompt + "\n\nAnalyze the medical report shown in this image." },
            ],
          },
        ],
      });

      const result = extractJSON(completion.choices[0].message.content || "{}");
      return NextResponse.json({ result });
    }

  } catch (err: unknown) {
    console.error("[report-analysis] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to analyze report: ${message}` },
      { status: 500 }
    );
  }
}
