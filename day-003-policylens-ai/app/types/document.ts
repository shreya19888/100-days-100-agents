export type DocumentStatus =
  | "uploading"
  | "uploaded"
  | "extracting"
  | "chunking"
  | "embedding"
  | "indexing"
  | "ready"
  | "error";

export interface KnowledgeDocument {
  id: string;
  filename: string;
  language?: string;
  pages?: number;
  chunks?: number;
 status: DocumentStatus;
}