export type DatasetMetadata = {
  id: string;
  title: string;
  owner: string;
  domain: string;
  platform: string;
  description: string;
  refresh: string;
  quality: number;

  schema: {
    name: string;
    type: string;
  }[];

  sampleData: Record<string, string>[];

  sql: string;

  joins: {
    dataset: string;
    key: string;
  }[];

  lineage: {
    upstream: string[];
    downstream: string[];
  };

  learning: {
    title: string;
    duration: string;
    level: string;
  }[];

  mission: string;
};