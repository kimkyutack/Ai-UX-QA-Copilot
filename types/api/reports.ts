import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { FindingStatus } from "@/types/domain/report-collaboration";

export type GetReportResponse = {
  report?: AuditReportRecord;
  error?: string;
};

export type ListReportsResponse = {
  reports: AuditReportRecord[];
  error?: string;
};

export type UpdateReportFindingPayload = {
  findingId: string;
  status: FindingStatus;
  assignee?: string;
  note?: string;
};

export type UpdateReportResponse = {
  report?: AuditReportRecord;
  error?: string;
};
