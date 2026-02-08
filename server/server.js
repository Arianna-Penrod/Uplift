import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Simple request log so you can see calls hitting the server
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Small helper: safely parse JSON even if wrapped in ```json fences or extra text
function safeParseJsonFromModelText(text) {
  if (!text) throw new Error("Empty response from model.");

  let cleaned = String(text).trim();

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // Extract the JSON object from any extra text
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object.");
  }

  const jsonText = cleaned.slice(start, end + 1);
  return JSON.parse(jsonText);
}

app.post("/api/elevator-feedback", async (req, res) => {
  try {
    const pitch = (req.body?.pitch || "").trim();

    if (pitch.length < 30) {
      return res.status(400).json({ error: "Pitch too short. Try 1–3 sentences." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in server/.env" });
    }

    const prompt = `
You are a career coach. Analyze this elevator pitch.

Return ONLY a raw JSON object (no backticks, no extra text) with exactly these keys:
{
  "overallScore": number (0-10),
  "strengths": string[] (3-6 items),
  "improvements": string[] (3-6 items),
  "tighterVersion": string (45-80 words),
  "suggestedNextSentence": string (1 sentence)
}

Pitch:
"""${pitch}"""
`;

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = (r.output_text || "").trim();
    const json = safeParseJsonFromModelText(raw);

    // Basic sanity defaults in case any field is missing
    return res.json({
      overallScore: json.overallScore ?? 0,
      strengths: Array.isArray(json.strengths) ? json.strengths : [],
      improvements: Array.isArray(json.improvements) ? json.improvements : [],
      tighterVersion: json.tighterVersion ?? "",
      suggestedNextSentence: json.suggestedNextSentence ?? "",
    });
  } catch (err) {
    console.error("OpenAI/server error:", err);

    return res.status(500).json({
      error: "AI request failed",
      details: err?.message ?? String(err),
    });
  }
});

app.listen(5050, () => console.log("AI server running at http://localhost:5050"));
