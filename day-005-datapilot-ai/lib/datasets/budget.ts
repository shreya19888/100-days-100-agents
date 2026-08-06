import { DatasetMetadata } from "./types";

export const budget: DatasetMetadata = {
  id: "budget",

  title: "Department Budget",

  owner: "Corporate Finance",

  domain: "Finance",

  platform: "Snowflake",

  description:
    "Department-level budget planning dataset tracking planned budget, actual spend, forecasts and financial variance across business units.",

  refresh: "Monthly",

  quality: 99.1,

  schema: [
    { name: "department", type: "STRING" },
    { name: "fiscal_month", type: "STRING" },
    { name: "planned_budget", type: "NUMBER" },
    { name: "actual_spend", type: "NUMBER" },
    { name: "variance", type: "NUMBER" },
    { name: "forecast", type: "NUMBER" },
    { name: "budget_owner", type: "STRING" },
  ],

  sampleData: [
    {
      department: "Finance",
      fiscal_month: "2026-07",
      planned_budget: "250000",
      actual_spend: "242300",
      variance: "-7700",
      forecast: "248500",
      budget_owner: "David Kim",
    },
    {
      department: "HR",
      fiscal_month: "2026-07",
      planned_budget: "110000",
      actual_spend: "115800",
      variance: "5800",
      forecast: "118000",
      budget_owner: "Lisa Wong",
    },
    {
      department: "Marketing",
      fiscal_month: "2026-07",
      planned_budget: "380000",
      actual_spend: "371900",
      variance: "-8100",
      forecast: "376000",
      budget_owner: "Robert Lee",
    },
    {
      department: "Engineering",
      fiscal_month: "2026-07",
      planned_budget: "720000",
      actual_spend: "705100",
      variance: "-14900",
      forecast: "715000",
      budget_owner: "Anita Shah",
    },
    {
      department: "Sales",
      fiscal_month: "2026-07",
      planned_budget: "510000",
      actual_spend: "522000",
      variance: "12000",
      forecast: "526000",
      budget_owner: "Karen Lopez",
    },
  ],

  sql: `SELECT
    department,
    planned_budget,
    actual_spend,
    variance,
    ROUND((actual_spend/planned_budget)*100,2) AS utilization_pct
FROM finance.department_budget
ORDER BY actual_spend DESC;`,

  joins: [
    {
      dataset: "Expense Reports",
      key: "department",
    },
    {
      dataset: "Employee Master",
      key: "department",
    },
    {
      dataset: "Payroll",
      key: "department",
    },
  ],

  lineage: {
    upstream: [
      "Oracle ERP",
      "Workday",
      "Expense Reports",
      "Payroll",
    ],

    downstream: [
      "Executive Dashboard",
      "Finance Reporting",
      "Forecasting",
      "Board Reporting",
    ],
  },

  learning: [
    {
      title: "Corporate Budgeting",
      duration: "25 mins",
      level: "Beginner",
    },
    {
      title: "Financial Planning & Analysis",
      duration: "35 mins",
      level: "Intermediate",
    },
    {
      title: "Variance Analysis",
      duration: "30 mins",
      level: "Advanced",
    },
  ],

  mission: "Finance Planning Engineer",
};