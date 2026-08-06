import { DatasetMetadata } from "./types";

export const customerSegments: DatasetMetadata = {
  id: "customer segments",

  title: "Customer Segments",

  owner: "Customer Analytics",

  domain: "Customer",

  platform: "Snowflake",

  description:
    "Enterprise customer segmentation dataset used for personalization, targeting, customer lifetime value analysis and marketing optimization.",

  refresh: "Daily",

  quality: 98.3,

  schema: [
    { name: "customer_id", type: "STRING" },
    { name: "segment", type: "STRING" },
    { name: "lifetime_value", type: "NUMBER" },
    { name: "region", type: "STRING" },
    { name: "campaign_id", type: "STRING" },
    { name: "engagement_score", type: "NUMBER" },
    { name: "status", type: "STRING" },
  ],

  sampleData: [
    {
      customer_id: "C10001",
      segment: "Gold",
      lifetime_value: "24500",
      region: "West",
      campaign_id: "CMP1001",
      engagement_score: "94",
      status: "Active",
    },
    {
      customer_id: "C10002",
      segment: "Silver",
      lifetime_value: "9800",
      region: "South",
      campaign_id: "CMP1002",
      engagement_score: "82",
      status: "Active",
    },
    {
      customer_id: "C10003",
      segment: "Platinum",
      lifetime_value: "51700",
      region: "East",
      campaign_id: "CMP1004",
      engagement_score: "99",
      status: "VIP",
    },
    {
      customer_id: "C10004",
      segment: "Bronze",
      lifetime_value: "2100",
      region: "North",
      campaign_id: "CMP1003",
      engagement_score: "61",
      status: "Inactive",
    },
    {
      customer_id: "C10005",
      segment: "Gold",
      lifetime_value: "18700",
      region: "West",
      campaign_id: "CMP1005",
      engagement_score: "90",
      status: "Active",
    },
  ],

  sql: `SELECT
    segment,
    COUNT(*) AS customers,
    AVG(lifetime_value) AS avg_ltv,
    AVG(engagement_score) AS avg_engagement
FROM marketing.customer_segments
GROUP BY segment
ORDER BY avg_ltv DESC;`,

  joins: [
    {
      dataset: "Campaign Performance",
      key: "campaign_id",
    },
    {
      dataset: "Email Analytics",
      key: "campaign_id",
    },
  ],

  lineage: {
    upstream: [
      "CRM",
      "Salesforce",
      "Adobe Analytics",
      "Loyalty Platform",
    ],

    downstream: [
      "Campaign Performance",
      "Recommendation Engine",
      "Customer 360 Dashboard",
      "Marketing Personalization",
    ],
  },

  learning: [
    {
      title: "Customer Segmentation Fundamentals",
      duration: "25 mins",
      level: "Beginner",
    },
    {
      title: "Customer Lifetime Value",
      duration: "30 mins",
      level: "Intermediate",
    },
    {
      title: "Behavioral Analytics",
      duration: "40 mins",
      level: "Advanced",
    },
  ],

  mission: "Customer Analytics Engineer",
};