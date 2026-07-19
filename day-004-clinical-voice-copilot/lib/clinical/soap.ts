import { groq } from "@/lib/groq";

type SOAP = {
  subjective: unknown;
  objective: unknown;
  assessment: unknown;
  plan: unknown;
};

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

export async function generateSOAP(
  transcript: string
): Promise<SOAP> {
  const prompt = `
You are an experienced clinical documentation assistant.

Convert the following patient encounter transcript into a structured SOAP note.

Return ONLY valid JSON.

{
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan": ""
}

Transcript:
${transcript}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content:
          "You are an expert medical documentation assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const soap = JSON.parse(
    response.choices[0].message.content ?? "{}"
  );

 return {
  subjective: soap.subjective,
  objective: soap.objective,
  assessment: soap.assessment,
  plan: soap.plan,
};
}