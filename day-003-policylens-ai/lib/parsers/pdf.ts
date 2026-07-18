import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export interface ParsedDocument {
  filename: string;
  text: string;
  pages: number;
}

export async function parsePdf(file: File): Promise<ParsedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    return {
      filename: file.name,
      text: result.text,
      pages: result.total,
    };
  } finally {
    await parser.destroy();
  }
}