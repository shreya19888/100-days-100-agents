import { DatasetMetadata } from "./types";

export const employeeMaster: DatasetMetadata = {
  id: "employee master",

  title: "Employee Master",

  owner: "HR Data Engineering",

  domain: "Human Resources",

  platform: "Snowflake",

  description:
    "Enterprise master dataset containing employee demographics, reporting hierarchy, organizational structure, employment status and workforce information.",

  refresh: "Daily",

  quality: 98.6,

  schema: [
    { name: "employee_id", type: "STRING" },
    { name: "first_name", type: "STRING" },
    { name: "last_name", type: "STRING" },
    { name: "department", type: "STRING" },
    { name: "manager", type: "STRING" },
    { name: "hire_date", type: "DATE" },
    { name: "status", type: "STRING" },
  ],

  sampleData: [
    {
      employee_id: "100023",
      first_name: "Sarah",
      last_name: "Johnson",
      department: "Finance",
      manager: "David Kim",
      hire_date: "2022-01-12",
      status: "Active",
    },
    {
      employee_id: "100041",
      first_name: "Michael",
      last_name: "Patel",
      department: "HR",
      manager: "Lisa Wong",
      hire_date: "2021-09-02",
      status: "Active",
    },
    {
      employee_id: "100057",
      first_name: "Emily",
      last_name: "Brown",
      department: "Marketing",
      manager: "Robert Lee",
      hire_date: "2023-04-18",
      status: "Leave",
    },
    {
      employee_id: "100081",
      first_name: "Kevin",
      last_name: "Chen",
      department: "Engineering",
      manager: "Anita Shah",
      hire_date: "2020-07-09",
      status: "Active",
    },
    {
      employee_id: "100094",
      first_name: "Olivia",
      last_name: "Smith",
      department: "Finance",
      manager: "David Kim",
      hire_date: "2024-02-15",
      status: "Active",
    },
  ],

  sql: `SELECT
    employee_id,
    first_name,
    last_name,
    department,
    manager,
    hire_date,
    status
FROM hr.employee_master
WHERE status='Active'
ORDER BY department, employee_id;`,

  joins: [
    {
      dataset: "Payroll",
      key: "employee_id",
    },
    {
      dataset: "Expense Reports",
      key: "employee_id",
    },
    {
      dataset: "Performance Reviews",
      key: "employee_id",
    },
  ],

  lineage: {
    upstream: [
      "Workday",
      "Active Directory",
      "HR Recruiting",
    ],

    downstream: [
      "Payroll",
      "Finance Reporting",
      "HR Analytics",
      "Executive Dashboard",
    ],
  },

  learning: [
    {
      title: "Employee Master Fundamentals",
      duration: "20 mins",
      level: "Beginner",
    },
    {
      title: "Snowflake SQL for HR",
      duration: "35 mins",
      level: "Intermediate",
    },
    {
      title: "Slowly Changing Dimensions",
      duration: "30 mins",
      level: "Advanced",
    },
  ],

  mission: "HR Data Engineer Onboarding",
};