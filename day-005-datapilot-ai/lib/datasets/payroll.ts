import { DatasetMetadata } from "./types";

export const payroll: DatasetMetadata = {
  id: "payroll",

  title: "Payroll",

  owner: "Finance Data Engineering",

  domain: "Finance",

  platform: "Snowflake",

  description:
    "Payroll fact table containing employee compensation, deductions, taxes, bonuses and net pay for every payroll cycle.",

  refresh: "Bi-Weekly",

  quality: 99.2,

  schema: [
    { name: "employee_id", type: "STRING" },
    { name: "pay_period", type: "STRING" },
    { name: "gross_salary", type: "NUMBER" },
    { name: "bonus", type: "NUMBER" },
    { name: "tax", type: "NUMBER" },
    { name: "net_salary", type: "NUMBER" },
  ],

  sampleData: [
    {
      employee_id: "100023",
      pay_period: "2026-07",
      gross_salary: "8250",
      bonus: "500",
      tax: "1420",
      net_salary: "7330",
    },
    {
      employee_id: "100041",
      pay_period: "2026-07",
      gross_salary: "6900",
      bonus: "0",
      tax: "1180",
      net_salary: "5720",
    },
    {
      employee_id: "100057",
      pay_period: "2026-07",
      gross_salary: "9100",
      bonus: "1200",
      tax: "1980",
      net_salary: "8320",
    },
    {
      employee_id: "100081",
      pay_period: "2026-07",
      gross_salary: "10800",
      bonus: "1500",
      tax: "2510",
      net_salary: "9790",
    },
    {
      employee_id: "100094",
      pay_period: "2026-07",
      gross_salary: "7600",
      bonus: "300",
      tax: "1340",
      net_salary: "6560",
    },
  ],

  sql: `SELECT
    employee_id,
    pay_period,
    gross_salary,
    bonus,
    tax,
    net_salary
FROM finance.payroll
WHERE pay_period = '2026-07'
ORDER BY gross_salary DESC;`,

  joins: [
    {
      dataset: "Employee Master",
      key: "employee_id",
    },
    {
      dataset: "Expense Reports",
      key: "employee_id",
    },
    {
      dataset: "Budget",
      key: "department",
    },
  ],

  lineage: {
    upstream: [
      "Workday Payroll",
      "ADP",
      "Compensation Planning",
    ],

    downstream: [
      "Finance Dashboard",
      "Payroll Reports",
      "Executive Compensation",
      "Budget Planning",
    ],
  },

  learning: [
    {
      title: "Payroll Fundamentals",
      duration: "25 mins",
      level: "Beginner",
    },
    {
      title: "Snowflake SQL for Finance",
      duration: "40 mins",
      level: "Intermediate",
    },
    {
      title: "Payroll Data Modeling",
      duration: "30 mins",
      level: "Advanced",
    },
  ],

  mission: "Finance Data Engineer Onboarding",
};