import type { AuditJob } from "@/types/domain/audit-job";
import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { AIProvider } from "@/types/domain/ai-settings";
import type { AnalysisMode } from "@/types/domain/analysis-mode";

export type CreateJobRequest = {
  url: string;
  projectId?: string;
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
  analysisMode?: AnalysisMode;
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
