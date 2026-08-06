import { DatasetMetadata } from "./types";

export const campaignPerformance: DatasetMetadata = {
  id: "campaign performance",

  title: "Campaign Performance",

  owner: "Marketing Analytics",

  domain: "Marketing",

  platform: "Snowflake",

  description:
    "Marketing performance dataset containing campaign KPIs across email, paid search, social media and display advertising.",

  refresh: "Hourly",

  quality: 97.9,

  schema: [
    { name: "campaign_id", type: "STRING" },
    { name: "campaign_name", type: "STRING" },
    { name: "channel", type: "STRING" },
    { name: "clicks", type: "NUMBER" },
    { name: "conversions", type: "NUMBER" },
    { name: "spend", type: "NUMBER" },
    { name: "revenue", type: "NUMBER" },
  ],

  sampleData: [
    {
      campaign_id: "CMP1001",
      campaign_name: "Spring Sale",
      channel: "Email",
      clicks: "12540",
      conversions: "432",
      spend: "8200",
      revenue: "65200",
    },
    {
      campaign_id: "CMP1002",
      campaign_name: "Summer Promo",
      channel: "Google Ads",
      clicks: "24120",
      conversions: "782",
      spend: "15200",
      revenue: "124500",
    },
    {
      campaign_id: "CMP1003",
      campaign_name: "Back to School",
      channel: "Facebook",
      clicks: "18450",
      conversions: "615",
      spend: "10300",
      revenue: "84100",
    },
    {
      campaign_id: "CMP1004",
      campaign_name: "Holiday Preview",
      channel: "Instagram",
      clicks: "29620",
      conversions: "1042",
      spend: "19100",
      revenue: "168700",
    },
    {
      campaign_id: "CMP1005",
      campaign_name: "Winter Clearance",
      channel: "LinkedIn",
      clicks: "8320",
      conversions: "188",
      spend: "4200",
      revenue: "27600",
    },
  ],

  sql: `SELECT
    campaign_name,
    channel,
    clicks,
    conversions,
    spend,
    revenue,
    ROUND(revenue/spend,2) AS roas
FROM marketing.campaign_performance
ORDER BY revenue DESC;`,

  joins: [
    {
      dataset: "Customer Segments",
      key: "campaign_id",
    },
    {
      dataset: "Email Analytics",
      key: "campaign_id",
    },
  ],

  lineage: {
    upstream: [
      "Google Ads",
      "Meta Ads",
      "Salesforce Marketing Cloud",
      "Adobe Analytics",
    ],

    downstream: [
      "Marketing Dashboard",
      "Executive KPI Dashboard",
      "ROI Reporting",
      "Customer Insights",
    ],
  },

  learning: [
    {
      title: "Marketing Analytics Fundamentals",
      duration: "20 mins",
      level: "Beginner",
    },
    {
      title: "Campaign Attribution",
      duration: "35 mins",
      level: "Intermediate",
    },
    {
      title: "ROAS & Conversion Analytics",
      duration: "30 mins",
      level: "Advanced",
    },
  ],

  mission: "Marketing Analytics Engineer",
};