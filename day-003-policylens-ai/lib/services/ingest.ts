import { parsePdf } from "../parsers/pdf";
import { createEmbedding } from "../embeddings/openai";
import { getCollection } from "../vectorstore/chroma";

export async function ingestDocument(file: File) {
  const parsed = await parsePdf(file);

  const embedding = await createEmbedding(parsed.text);

  const collection = await getCollection();

  await collection.add({
    ids: [crypto.randomUUID()],
    documents: [parsed.text],
    embeddings: [embedding],
    metadatas: [
      {
        filename: parsed.filename,
        pages: parsed.pages,
      },
    ],
  });

  return parsed;
}