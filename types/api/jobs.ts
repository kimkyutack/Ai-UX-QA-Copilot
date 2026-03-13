import type { AuditJob } from "@/types/domain/audit-job";
import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { AIProvider } from "@/types/domain/ai-settings";

export type CreateJobRequest = {
  url: string;
  projectId?: string;
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
};

export type CreateJobResponse = {
  job: AuditJob;
  report?: AuditReportRecord;
  error?: string;
};

export type ListJobsResponse = {
  jobs: AuditJob[];
};

export type GetJobResponse = {
  job?: AuditJob;
  report?: AuditReportRecord;
  error?: string;
};
