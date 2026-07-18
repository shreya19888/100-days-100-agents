import { createEmbedding } from "../embeddings/openai";
import { getCollection } from "../vectorstore/chroma";

export async function retrieve(question: string) {
  const embedding = await createEmbedding(question);

  const collection = await getCollection();

  return collection.query({
    queryEmbeddings: [embedding],
    nResults: 5,
  });
}