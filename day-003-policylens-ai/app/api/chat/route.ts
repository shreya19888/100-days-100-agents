import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/services/answer";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    const answer = await answerQuestion(question);

    return NextResponse.json({
      answer,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        answer: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}