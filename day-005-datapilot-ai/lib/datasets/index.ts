import { employeeMaster } from "./employeeMaster";
import { payroll } from "./payroll";
import { expenseReports } from "./expenseReports";
import { campaignPerformance } from "./campaignPerformance";
import { customerSegments } from "./customerSegments";
import { budget } from "./budget";
import { apiMetrics } from "./apiMetrics";
import { applicationLogs } from "./applicationLogs";
import { ciPipeline } from "./ciPipeline";
import { emailAnalytics } from "./emailAnalytics";

export const datasets = {
  [employeeMaster.id]: employeeMaster,
  [payroll.id]: payroll,
  [expenseReports.id]: expenseReports,
  [campaignPerformance.id]: campaignPerformance,
  [customerSegments.id]: customerSegments,
  [budget.id]: budget,
  [apiMetrics.id]: apiMetrics,
  [applicationLogs.id]: applicationLogs,
  [ciPipeline.id]: ciPipeline,
  [emailAnalytics.id]: emailAnalytics,
};