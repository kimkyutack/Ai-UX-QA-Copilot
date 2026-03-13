export type AuditJobStatus = "queued" | "running" | "completed" | "failed";

export type AuditJob = {
  id: string;
  projectId: string;
  targetUrl: string;
  status: AuditJobStatus;
  createdAt: string;
  updatedAt: string;
  reportId?: string;
  errorMessage?: string;
  signalScore?: number;
  source?: "fetch" | "playwright";
};
