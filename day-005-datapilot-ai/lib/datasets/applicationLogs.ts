import { DatasetMetadata } from "./types";

export const applicationLogs: DatasetMetadata = {
  id: "application logs",

  title: "Application Logs",

  owner: "Site Reliability Engineering",

  domain: "Engineering",

  platform: "Snowflake",

  description:
    "Centralized application log dataset capturing production events, warnings, errors and service activity across enterprise applications.",

  refresh: "Real Time",

  quality: 99.3,

  schema: [
    { name: "timestamp", type: "TIMESTAMP" },
    { name: "service", type: "STRING" },
    { name: "host", type: "STRING" },
    { name: "log_level", type: "STRING" },
    { name: "message", type: "STRING" },
    { name: "request_id", type: "STRING" },
    { name: "duration_ms", type: "NUMBER" },
  ],

  sampleData: [
    {
      timestamp: "2026-08-05 09:30:14",
      service: "Authentication",
      host: "api-prod-01",
      log_level: "INFO",
      message: "User login successful",
      request_id: "REQ-845210",
      duration_ms: "142",
    },
    {
      timestamp: "2026-08-05 09:31:42",
      service: "Checkout",
      host: "checkout-prod-02",
      log_level: "WARN",
      message: "Payment provider retry initiated",
      request_id: "REQ-845318",
      duration_ms: "310",
    },
    {
      timestamp: "2026-08-05 09:32:51",
      service: "Catalog",
      host: "catalog-prod-01",
      log_level: "INFO",
      message: "Product cache refreshed",
      request_id: "REQ-845422",
      duration_ms: "98",
    },
    {
      timestamp: "2026-08-05 09:33:17",
      service: "Orders",
      host: "orders-prod-01",
      log_level: "ERROR",
      message: "Order service timeout",
      request_id: "REQ-845501",
      duration_ms: "164",
    },
    {
      timestamp: "2026-08-05 09:34:28",
      service: "Search",
      host: "search-prod-03",
      log_level: "INFO",
      message: "Elastic index synchronized",
      request_id: "REQ-845612",
      duration_ms: "87",
    },
  ],

  sql: `SELECT
    service,
    log_level,
    COUNT(*) AS log_count
FROM engineering.application_logs
WHERE timestamp >= CURRENT_DATE()
GROUP BY service, log_level
ORDER BY log_count DESC;`,

  joins: [
    {
      dataset: "API Metrics",
      key: "service",
    },
    {
      dataset: "CI Pipeline",
      key: "service",
    },
  ],

  lineage: {
    upstream: [
      "Kubernetes",
      "Application Services",
      "Fluent Bit",
      "OpenTelemetry",
    ],

    downstream: [
      "Splunk",
      "Grafana",
      "Incident Management",
      "Security Monitoring",
    ],
  },

  learning: [
    {
      title: "Centralized Logging Fundamentals",
      duration: "20 mins",
      level: "Beginner",
    },
    {
      title: "OpenTelemetry Logging",
      duration: "35 mins",
      level: "Intermediate",
    },
    {
      title: "Observability Best Practices",
      duration: "40 mins",
      level: "Advanced",
    },
  ],

  mission: "Site Reliability Engineer",
};