import type { AuditReport } from "@/types/audit";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type { AIProvider } from "@/types/domain/ai-settings";

export type AuditReportRecord = {
  id: string;
  jobId: string;
  projectId: string;
  targetUrl: string;
  createdAt: string;
  report: AuditReport;
  debug: {
    signalScore: number;
    warnings: string[];
    source: "fetch" | "playwright";
    provider?: AIProvider;
    model?: string;
    title?: string;
    description?: string;
    headings?: string[];
    buttons?: string[];
    links?: string[];
    textSnippet?: string;
    agentTraces?: AuditAgentTrace[];
  };
};
