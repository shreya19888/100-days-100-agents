import { DatasetMetadata } from "./types";

export const expenseReports: DatasetMetadata = {
  id: "expense reports",

  title: "Expense Reports",

  owner: "Finance Operations",

  domain: "Finance",

  platform: "Snowflake",

  description:
    "Employee expense reimbursement dataset containing travel, meals, lodging, mileage and business expenses submitted for approval.",

  refresh: "Daily",

  quality: 98.4,

  schema: [
    { name: "report_id", type: "STRING" },
    { name: "employee_id", type: "STRING" },
    { name: "expense_date", type: "DATE" },
    { name: "category", type: "STRING" },
    { name: "amount", type: "NUMBER" },
    { name: "status", type: "STRING" },
    { name: "approved_by", type: "STRING" },
  ],

  sampleData: [
    {
      report_id: "EXP1001",
      employee_id: "100023",
      expense_date: "2026-07-14",
      category: "Travel",
      amount: "245.80",
      status: "Approved",
      approved_by: "David Kim",
    },
    {
      report_id: "EXP1002",
      employee_id: "100041",
      expense_date: "2026-07-16",
      category: "Meals",
      amount: "42.15",
      status: "Pending",
      approved_by: "Lisa Wong",
    },
    {
      report_id: "EXP1003",
      employee_id: "100057",
      expense_date: "2026-07-18",
      category: "Hotel",
      amount: "612.40",
      status: "Approved",
      approved_by: "Robert Lee",
    },
    {
      report_id: "EXP1004",
      employee_id: "100081",
      expense_date: "2026-07-20",
      category: "Mileage",
      amount: "118.60",
      status: "Rejected",
      approved_by: "Anita Shah",
    },
    {
      report_id: "EXP1005",
      employee_id: "100094",
      expense_date: "2026-07-25",
      category: "Office Supplies",
      amount: "88.20",
      status: "Approved",
      approved_by: "David Kim",
    },
  ],

  sql: `SELECT
    report_id,
    employee_id,
    expense_date,
    category,
    amount,
    status
FROM finance.expense_reports
WHERE status = 'Approved'
ORDER BY expense_date DESC;`,

  joins: [
    {
      dataset: "Employee Master",
      key: "employee_id",
    },
    {
      dataset: "Payroll",
      key: "employee_id",
    },
    {
      dataset: "Budget",
      key: "department",
    },
  ],

  lineage: {
    upstream: [
      "Concur",
      "Corporate Credit Cards",
      "Travel Booking System",
    ],

    downstream: [
      "Finance Reporting",
      "Expense Dashboard",
      "Budget Planning",
      "Accounts Payable",
    ],
  },

  learning: [
    {
      title: "Expense Reporting Fundamentals",
      duration: "20 mins",
      level: "Beginner",
    },
    {
      title: "Financial Data Modeling",
      duration: "35 mins",
      level: "Intermediate",
    },
    {
      title: "Building Finance Dashboards",
      duration: "30 mins",
      level: "Advanced",
    },
  ],

  mission: "Finance Analytics Onboarding",
};