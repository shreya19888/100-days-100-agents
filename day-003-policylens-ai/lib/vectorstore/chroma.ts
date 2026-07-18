import { CloudClient } from "chromadb";

export const chroma = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY!,
  tenant: process.env.CHROMA_TENANT!,
  database: process.env.CHROMA_DATABASE!,
});

export async function getCollection() {
  return chroma.getOrCreateCollection({
    name: "hr-policies",
  });
}