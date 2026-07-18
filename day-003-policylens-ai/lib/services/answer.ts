import { openai } from "../openai";
import { retrieve } from "./retrieve";

export async function answerQuestion(question: string) {
  const results = await retrieve(question);

  const context =
    results.documents?.[0]?.join("\n\n") ?? "";

  const response = await openai.responses.create({
    model: "gpt-5.5",
    input: [
      {
        role: "system",
        content:
          "Answer only from the provided HR policy. If the answer isn't present, say you don't know.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${question}`,
      },
    ],
  });

  return response.output_text;
}