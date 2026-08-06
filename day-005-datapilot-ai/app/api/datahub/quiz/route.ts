import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ------------------------
  // Generate Quiz
  // ------------------------

  if (body.mode === "generate") {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `
You are a senior enterprise data engineering trainer.

Generate a quiz based ONLY on the dataset provided.

Return JSON only.

Format:

{
  "questions":[
    {
      "id":1,
      "question":"",
      "options":[
        "",
        "",
        "",
        ""
      ]
    },
    {
      "id":2,
      "question":""
    }
  ]
}

Requirements

- 5 questions
- Mix multiple choice and free text
- Questions should cover:
  • business purpose
  • schema
  • joins
  • lineage
  • SQL
`,
        },
        {
          role: "user",
          content: JSON.stringify(body.dataset),
        },
      ],
    });

    return NextResponse.json(
      JSON.parse(
        completion.choices[0].message.content ??
          '{"questions":[]}'
      )
    );
  }

  // ------------------------
  // Grade Quiz
  // ------------------------

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `
You are grading a data engineering quiz.

Return JSON.

{
  "score":4,
  "total":5,
  "feedback":[
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}
`,
      },
      {
        role: "user",
        content: JSON.stringify({
          dataset: body.dataset,
          questions: body.questions,
          answers: body.answers,
        }),
      },
    ],
  });

  return NextResponse.json(
    JSON.parse(
      completion.choices[0].message.content ??
        '{"score":0,"total":5,"feedback":[]}'
    )
  );
}