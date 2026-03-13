import type { AuditReportRecord } from "@/types/domain/audit-report-record";

export type GetReportResponse = {
  report?: AuditReportRecord;
  error?: string;
};

export type ListReportsResponse = {
  reports: AuditReportRecord[];
};
