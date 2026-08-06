import { DatasetMetadata } from "./types";

export const apiMetrics: DatasetMetadata = {
  id: "api metrics",

  title: "API Metrics",

  owner: "Platform Engineering",

  domain: "Engineering",

  platform: "Snowflake",

  description:
    "Operational metrics for enterprise APIs including request volume, latency, availability, throughput and error rates. Used by SRE, engineering and platform teams to monitor production health.",

  refresh: "Every Minute",

  quality: 99.5,

  schema: [
    { name: "timestamp", type: "TIMESTAMP" },
    { name: "service", type: "STRING" },
    { name: "endpoint", type: "STRING" },
    { name: "requests", type: "NUMBER" },
    { name: "latency_ms", type: "NUMBER" },
    { name: "error_rate", type: "NUMBER" },
    { name: "availability", type: "NUMBER" },
  ],

  sampleData: [
    {
      timestamp: "2026-08-05 09:30",
      service: "Authentication",
      endpoint: "/login",
      requests: "2450",
      latency_ms: "142",
      error_rate: "0.12%",
      availability: "99.99%",
    },
    {
      timestamp: "2026-08-05 09:31",
      service: "Checkout",
      endpoint: "/checkout",
      requests: "912",
      latency_ms: "310",
      error_rate: "1.21%",
      availability: "99.82%",
    },
    {
      timestamp: "2026-08-05 09:32",
      service: "Catalog",
      endpoint: "/products",
      requests: "5204",
      latency_ms: "98",
      error_rate: "0.03%",
      availability: "100%",
    },
    {
      timestamp: "2026-08-05 09:33",
      service: "Orders",
      endpoint: "/orders",
      requests: "2010",
      latency_ms: "164",
      error_rate: "0.18%",
      availability: "99.95%",
    },
    {
      timestamp: "2026-08-05 09:34",
      service: "Search",
      endpoint: "/search",
      requests: "8912",
      latency_ms: "87",
      error_rate: "0.01%",
      availability: "100%",
    },
  ],

  sql: `SELECT
    service,
    endpoint,
    SUM(requests) AS total_requests,
    AVG(latency_ms) AS avg_latency_ms,
    AVG(error_rate) AS avg_error_rate
FROM engineering.api_metrics
GROUP BY service, endpoint
ORDER BY total_requests DESC;`,

  joins: [
    {
      dataset: "Application Logs",
      key: "service",
    },
    {
      dataset: "CI Pipeline",
      key: "service",
    },
  ],

  lineage: {
    upstream: [
      "API Gateway",
      "Prometheus",
      "NGINX",
      "Kubernetes",
    ],

    downstream: [
      "Grafana Dashboards",
      "Platform Health",
      "Incident Management",
      "Executive Reliability Dashboard",
    ],
  },

  learning: [
    {
      title: "API Monitoring Fundamentals",
      duration: "20 mins",
      level: "Beginner",
    },
    {
      title: "Prometheus & Grafana",
      duration: "45 mins",
      level: "Intermediate",
    },
    {
      title: "SRE Golden Signals",
      duration: "35 mins",
      level: "Advanced",
    },
  ],

  mission: "Platform Reliability Engineer",
};