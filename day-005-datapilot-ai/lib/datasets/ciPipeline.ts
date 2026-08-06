import { DatasetMetadata } from "./types";

export const ciPipeline: DatasetMetadata = {
  id: "ci pipeline",

  title: "CI Pipeline",

  owner: "Developer Experience",

  domain: "Engineering",

  platform: "Snowflake",

  description:
    "Continuous Integration pipeline execution history tracking builds, deployments, test results and release quality across engineering teams.",

  refresh: "Every 5 Minutes",

  quality: 99.0,

  schema: [
    { name: "pipeline_id", type: "STRING" },
    { name: "service", type: "STRING" },
    { name: "branch", type: "STRING" },
    { name: "status", type: "STRING" },
    { name: "duration_minutes", type: "NUMBER" },
    { name: "tests_passed", type: "NUMBER" },
    { name: "deployment_time", type: "TIMESTAMP" },
  ],

  sampleData: [
    {
      pipeline_id: "PIPE-1001",
      service: "Authentication",
      branch: "main",
      status: "Success",
      duration_minutes: "8",
      tests_passed: "482",
      deployment_time: "2026-08-05 09:15",
    },
    {
      pipeline_id: "PIPE-1002",
      service: "Checkout",
      branch: "feature/payment",
      status: "Failed",
      duration_minutes: "6",
      tests_passed: "451",
      deployment_time: "2026-08-05 09:32",
    },
    {
      pipeline_id: "PIPE-1003",
      service: "Catalog",
      branch: "develop",
      status: "Running",
      duration_minutes: "4",
      tests_passed: "468",
      deployment_time: "2026-08-05 09:45",
    },
    {
      pipeline_id: "PIPE-1004",
      service: "Orders",
      branch: "main",
      status: "Success",
      duration_minutes: "11",
      tests_passed: "510",
      deployment_time: "2026-08-05 10:10",
    },
    {
      pipeline_id: "PIPE-1005",
      service: "Search",
      branch: "hotfix/search-cache",
      status: "Success",
      duration_minutes: "5",
      tests_passed: "437",
      deployment_time: "2026-08-05 10:28",
    },
  ],

  sql: `SELECT
    service,
    branch,
    status,
    duration_minutes,
    tests_passed
FROM engineering.ci_pipeline
ORDER BY deployment_time DESC;`,

  joins: [
    {
      dataset: "Application Logs",
      key: "service",
    },
    {
      dataset: "API Metrics",
      key: "service",
    },
  ],

  lineage: {
    upstream: [
      "GitHub",
      "GitHub Actions",
      "Jenkins",
      "SonarQube",
    ],

    downstream: [
      "Kubernetes",
      "Production Deployments",
      "Release Dashboard",
      "Engineering Metrics",
    ],
  },

  learning: [
    {
      title: "CI/CD Fundamentals",
      duration: "25 mins",
      level: "Beginner",
    },
    {
      title: "GitHub Actions",
      duration: "40 mins",
      level: "Intermediate",
    },
    {
      title: "DevOps Release Engineering",
      duration: "35 mins",
      level: "Advanced",
    },
  ],

  mission: "DevOps Engineer",
};