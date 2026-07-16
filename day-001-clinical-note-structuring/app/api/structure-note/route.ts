import { openai } from "../../../lib/openai";
import { NextResponse } from "next/server";

function parseJsonOutput(output: string) {
  const fencedMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1] : output;
  const trimmed = candidate.trim();
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);

  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  return JSON.parse(trimmed);
}

export async function POST(req: Request) {
  try {
    const { note } = await req.json();

    const prompt = `
You are a medical documentation assistant.

Convert the following fictional clinical note into a SOAP note.

Return ONLY valid JSON in this format:

{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}

Clinical Note:
${note}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output = response.output_text ?? "";
    const parsed = parseJsonOutput(output);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to structure note.",
      },
      { status: 500 }
    );
  }
}