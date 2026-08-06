import { DatasetMetadata } from "./types";

export const emailAnalytics: DatasetMetadata = {
  id: "email analytics",

  title: "Email Analytics",

  owner: "Marketing Operations",

  domain: "Marketing",

  platform: "Snowflake",

  description:
    "Email campaign performance dataset tracking delivery, opens, clicks, conversions and engagement metrics across marketing campaigns.",

  refresh: "Hourly",

  quality: 98.8,

  schema: [
    { name: "campaign_id", type: "STRING" },
    { name: "campaign_name", type: "STRING" },
    { name: "emails_sent", type: "NUMBER" },
    { name: "open_rate", type: "NUMBER" },
    { name: "click_rate", type: "NUMBER" },
    { name: "conversion_rate", type: "NUMBER" },
    { name: "unsubscribe_rate", type: "NUMBER" },
  ],

  sampleData: [
    {
      campaign_id: "CMP1001",
      campaign_name: "Spring Sale",
      emails_sent: "250000",
      open_rate: "48.2%",
      click_rate: "11.5%",
      conversion_rate: "3.8%",
      unsubscribe_rate: "0.2%",
    },
    {
      campaign_id: "CMP1002",
      campaign_name: "Summer Promo",
      emails_sent: "180000",
      open_rate: "42.1%",
      click_rate: "9.7%",
      conversion_rate: "2.9%",
      unsubscribe_rate: "0.3%",
    },
    {
      campaign_id: "CMP1003",
      campaign_name: "Back to School",
      emails_sent: "195000",
      open_rate: "46.8%",
      click_rate: "10.8%",
      conversion_rate: "3.2%",
      unsubscribe_rate: "0.2%",
    },
    {
      campaign_id: "CMP1004",
      campaign_name: "Holiday Preview",
      emails_sent: "310000",
      open_rate: "51.7%",
      click_rate: "13.2%",
      conversion_rate: "4.4%",
      unsubscribe_rate: "0.1%",
    },
    {
      campaign_id: "CMP1005",
      campaign_name: "Winter Clearance",
      emails_sent: "142000",
      open_rate: "39.5%",
      click_rate: "8.4%",
      conversion_rate: "2.4%",
      unsubscribe_rate: "0.4%",
    },
  ],

  sql: `SELECT
    campaign_name,
    emails_sent,
    open_rate,
    click_rate,
    conversion_rate
FROM marketing.email_analytics
ORDER BY conversion_rate DESC;`,

  joins: [
    {
      dataset: "Campaign Performance",
      key: "campaign_id",
    },
    {
      dataset: "Customer Segments",
      key: "campaign_id",
    },
  ],

  lineage: {
    upstream: [
      "Salesforce Marketing Cloud",
      "Mailchimp",
      "Customer Segments",
    ],

    downstream: [
      "Marketing Dashboard",
      "Executive KPI Dashboard",
      "Campaign Performance",
      "Customer Insights",
    ],
  },

  learning: [
    {
      title: "Email Marketing Analytics",
      duration: "20 mins",
      level: "Beginner",
    },
    {
      title: "Campaign Optimization",
      duration: "35 mins",
      level: "Intermediate",
    },
    {
      title: "Marketing Attribution Models",
      duration: "40 mins",
      level: "Advanced",
    },
  ],

  mission: "Marketing Analytics Engineer",
};