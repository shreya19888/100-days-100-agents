import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file uploaded." },
        { status: 400 }
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      language: "en",
      temperature: 0,
    });

    return NextResponse.json({
      transcript: transcription.text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to transcribe audio.",
      },
      {
        status: 500,
      }
    );
  }
}