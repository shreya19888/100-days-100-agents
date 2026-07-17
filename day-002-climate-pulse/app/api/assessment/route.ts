import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { assessRisk } from "../../../lib/riskEngine";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { persona, weather } = await request.json();

    const risk = assessRisk(weather);

    const prompt = `
You are Climate Pulse AI.

You are an occupational outdoor safety expert.

Worker:
${persona}

Weather:
${JSON.stringify(weather, null, 2)}

Risk Assessment:
${JSON.stringify(risk, null, 2)}

Return ONLY valid JSON.

{
  "summary":"",
  "recommendations":[
    "...",
    "...",
    "...",
    "...",
    "..."
  ],
  "hydration":[
    "...",
    "..."
  ],
  "ppe":[
    "...",
    "..."
  ],
  "warningSigns":[
    "...",
    "...",
    "..."
  ],
  "bestWorkWindow":"",
  "avoidWorkWindow":""
}
`;

    const completion = await client.responses.create({
      model: "gpt-5.5",
      input: prompt,
    });

    const text = completion.output_text;

    return NextResponse.json({
      risk,
      assessment: JSON.parse(text),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to generate assessment",
      },
      {
        status: 500,
      }
    );
  }
}